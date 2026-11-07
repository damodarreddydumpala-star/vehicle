const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const db = require('./database.js');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(envPath); } catch {}
}

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { success: false, error: message });
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Request payload too large (max 5MB)'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON payload: ' + e.message));
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(body);
        const obj = {};
        for (const [key, val] of params.entries()) {
          obj[key] = val;
        }
        resolve(obj);
      } else {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ raw: body });
        }
      }
    });
    req.on('error', err => reject(err));
  });
}

function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? '/index.html' : pathname;

  if (!path.extname(relativePath)) {
    const candidateHtml = relativePath + '.html';
    if (fs.existsSync(path.join(__dirname, candidateHtml))) {
      relativePath = candidateHtml;
    } else if (fs.existsSync(path.join(__dirname, 'public', candidateHtml))) {
      relativePath = '/public' + candidateHtml;
    }
  }

  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  
  let filePath = path.join(__dirname, safePath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', safePath);
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + pathname);
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveFile(res, indexPath);
      return;
    }
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Directory listing forbidden');
    return;
  }

  serveFile(res, filePath);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  try {
    // ------------------------------------------------------------------------
    // API: System Configuration & Metadata
    // ------------------------------------------------------------------------
    if (pathname === '/api/info' && method === 'GET') {
      return sendJSON(res, 200, {
        success: true,
        centreName: process.env.CENTRE_NAME || 'Apex Vehicle Service Centre',
        tagline: process.env.CENTRE_TAGLINE || 'Precision Auto Maintenance & Diagnostics',
        phone: process.env.CENTRE_PHONE || '+91 98765 12345',
        email: process.env.CENTRE_EMAIL || 'service@apexauto.com',
        address: process.env.CENTRE_ADDRESS || 'Shop 12-15, Auto City Bypass Road',
        databaseEngine: 'MySQL Server 8.0 (Workbench: vehicle_service_centre)'
      });
    }

    // ------------------------------------------------------------------------
    // API: Dashboard KPI Analytics
    // ------------------------------------------------------------------------
    if (pathname === '/api/stats' && method === 'GET') {
      const stats = await db.getDashboardStats();
      return sendJSON(res, 200, { success: true, data: stats });
    }

    // ------------------------------------------------------------------------
    // API 1: CUSTOMERS CRUD
    // ------------------------------------------------------------------------
    if (pathname === '/api/customers' && method === 'GET') {
      const search = parsedUrl.query.search || '';
      const list = await db.getAllCustomers(search);
      return sendJSON(res, 200, { success: true, count: list.length, data: list });
    }

    const custIdMatch = pathname.match(/^\/api\/customers\/(\d+)$/);
    if (custIdMatch && method === 'GET') {
      const customer = await db.getCustomerById(custIdMatch[1]);
      if (!customer) return sendError(res, 404, 'Customer record not found');
      return sendJSON(res, 200, { success: true, data: customer });
    }

    if (pathname === '/api/customers' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.name || !body.phone) {
        return sendError(res, 400, 'Customer name and phone number are required');
      }
      const newCustomer = await db.insertCustomer(body);
      return sendJSON(res, 201, {
        success: true,
        message: 'Customer registered successfully in MySQL',
        data: newCustomer
      });
    }

    if (custIdMatch && method === 'PUT') {
      const id = custIdMatch[1];
      const body = await parseRequestBody(req);
      const updated = await db.updateCustomer(id, body);
      if (!updated) return sendError(res, 404, 'Customer not found to update');
      return sendJSON(res, 200, {
        success: true,
        message: 'Customer updated successfully in MySQL',
        data: updated
      });
    }

    if (custIdMatch && method === 'DELETE') {
      const id = custIdMatch[1];
      const deleted = await db.deleteCustomer(id);
      if (!deleted) return sendError(res, 404, 'Customer not found to delete');
      return sendJSON(res, 200, {
        success: true,
        message: 'Customer deleted successfully from MySQL'
      });
    }

    // ------------------------------------------------------------------------
    // API 2: VEHICLES CRUD
    // ------------------------------------------------------------------------
    if (pathname === '/api/vehicles' && method === 'GET') {
      const search = parsedUrl.query.search || '';
      const list = await db.getAllVehicles(search);
      return sendJSON(res, 200, { success: true, count: list.length, data: list });
    }

    const vehIdMatch = pathname.match(/^\/api\/vehicles\/(\d+)$/);
    if (vehIdMatch && method === 'GET') {
      const vehicle = await db.getVehicleById(vehIdMatch[1]);
      if (!vehicle) return sendError(res, 404, 'Vehicle not found');
      return sendJSON(res, 200, { success: true, data: vehicle });
    }

    if (pathname === '/api/vehicles' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.customer_id || !body.vehicle_number || !body.vehicle_model) {
        return sendError(res, 400, 'Customer ID, vehicle number, and model are required');
      }
      try {
        const newVehicle = await db.insertVehicle(body);
        return sendJSON(res, 201, {
          success: true,
          message: 'Vehicle registered successfully in MySQL',
          data: newVehicle
        });
      } catch (e) {
        return sendError(res, 400, 'Failed to insert vehicle: ' + e.message);
      }
    }

    if (vehIdMatch && method === 'PUT') {
      const id = vehIdMatch[1];
      const body = await parseRequestBody(req);
      const updated = await db.updateVehicle(id, body);
      if (!updated) return sendError(res, 404, 'Vehicle not found to update');
      return sendJSON(res, 200, {
        success: true,
        message: 'Vehicle updated successfully in MySQL',
        data: updated
      });
    }

    if (vehIdMatch && method === 'DELETE') {
      const id = vehIdMatch[1];
      const deleted = await db.deleteVehicle(id);
      if (!deleted) return sendError(res, 404, 'Vehicle not found to delete');
      return sendJSON(res, 200, {
        success: true,
        message: 'Vehicle deleted successfully from MySQL'
      });
    }

    // ------------------------------------------------------------------------
    // API 3: SERVICES CRUD
    // ------------------------------------------------------------------------
    if (pathname === '/api/services' && method === 'GET') {
      const filters = {
        status: parsedUrl.query.status || 'All',
        search: parsedUrl.query.search || ''
      };
      const list = await db.getAllServices(filters);
      return sendJSON(res, 200, { success: true, count: list.length, data: list });
    }

    const svcIdMatch = pathname.match(/^\/api\/services\/(\d+)$/);
    if (svcIdMatch && method === 'GET') {
      const service = await db.getServiceById(svcIdMatch[1]);
      if (!service) return sendError(res, 404, 'Service record not found');
      return sendJSON(res, 200, { success: true, data: service });
    }

    if (pathname === '/api/services' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.vehicle_id || !body.service_type || !body.service_date) {
        return sendError(res, 400, 'Vehicle ID, service type, and service date are mandatory');
      }
      try {
        const newService = await db.insertService(body);
        return sendJSON(res, 201, {
          success: true,
          message: 'Service appointment booked successfully in MySQL',
          data: newService
        });
      } catch (e) {
        return sendError(res, 400, 'Error booking service: ' + e.message);
      }
    }

    if (svcIdMatch && method === 'PUT') {
      const id = svcIdMatch[1];
      const body = await parseRequestBody(req);
      const updated = await db.updateService(id, body);
      if (!updated) return sendError(res, 404, 'Service not found to update');
      return sendJSON(res, 200, {
        success: true,
        message: 'Service details updated successfully in MySQL',
        data: updated
      });
    }

    if (svcIdMatch && method === 'DELETE') {
      const id = svcIdMatch[1];
      const deleted = await db.deleteService(id);
      if (!deleted) return sendError(res, 404, 'Service not found to delete');
      return sendJSON(res, 200, {
        success: true,
        message: 'Service record deleted successfully from MySQL'
      });
    }

    // ------------------------------------------------------------------------
    // API 4: PAYMENTS CRUD
    // ------------------------------------------------------------------------
    if (pathname === '/api/payments' && method === 'GET') {
      const filters = {
        status: parsedUrl.query.status || 'All',
        method: parsedUrl.query.method || 'All'
      };
      const list = await db.getAllPayments(filters);
      return sendJSON(res, 200, { success: true, count: list.length, data: list });
    }

    const payIdMatch = pathname.match(/^\/api\/payments\/(\d+)$/);
    if (payIdMatch && method === 'GET') {
      const payment = await db.getPaymentById(payIdMatch[1]);
      if (!payment) return sendError(res, 404, 'Payment record not found');
      return sendJSON(res, 200, { success: true, data: payment });
    }

    if (pathname === '/api/payments' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.service_id || !body.amount || !body.payment_method) {
        return sendError(res, 400, 'Service ID, amount, and payment method are required');
      }
      try {
        const newPayment = await db.insertPayment(body);
        return sendJSON(res, 201, {
          success: true,
          message: 'Payment logged successfully in MySQL',
          data: newPayment
        });
      } catch (e) {
        return sendError(res, 400, 'Error recording payment: ' + e.message);
      }
    }

    if (payIdMatch && method === 'PUT') {
      const id = payIdMatch[1];
      const body = await parseRequestBody(req);
      const updated = await db.updatePayment(id, body);
      if (!updated) return sendError(res, 404, 'Payment record not found to update');
      return sendJSON(res, 200, {
        success: true,
        message: 'Payment updated successfully in MySQL',
        data: updated
      });
    }

    if (payIdMatch && method === 'DELETE') {
      const id = payIdMatch[1];
      const deleted = await db.deletePayment(id);
      if (!deleted) return sendError(res, 404, 'Payment not found to delete');
      return sendJSON(res, 200, {
        success: true,
        message: 'Payment record deleted successfully from MySQL'
      });
    }

    // ------------------------------------------------------------------------
    // Serve Static Web Files
    // ------------------------------------------------------------------------
    serveStaticFile(req, res, pathname);

  } catch (error) {
    console.error('Server Error:', error);
    sendError(res, 500, error.message || 'Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(`🚗 ${process.env.CENTRE_NAME || 'Vehicle Service Centre Management'}`);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`🐬 Database: MySQL Server (${process.env.DB_NAME || 'vehicle_service_centre'}) on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.log('✨ Modules:');
  console.log(`   - Dashboard        : http://localhost:${PORT}/index.html`);
  console.log(`   - Customers        : http://localhost:${PORT}/customers.html`);
  console.log(`   - Vehicles         : http://localhost:${PORT}/vehicles.html`);
  console.log(`   - Services Progress: http://localhost:${PORT}/services.html`);
  console.log(`   - Payments & Bills : http://localhost:${PORT}/payments.html`);
  console.log('================================================================');
});

module.exports = server;
