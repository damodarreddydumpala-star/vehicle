/**
 * ============================================================================
 * VEHICLE SERVICE CENTRE MANAGEMENT SYSTEM - DATABASE LAYER (MySQL)
 * Connected directly to MySQL Server / MySQL Workbench (vehicle_service_centre)
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

// Load environment variables if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {}
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'damodar';
const DB_NAME = process.env.DB_NAME || 'vehicle_service_centre';

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

// Test and initialize MySQL connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] Connected successfully to "${DB_NAME}" on ${DB_HOST}:${DB_PORT} as "${DB_USER}"`);
    connection.release();
  } catch (err) {
    console.error(`[MySQL Error] Failed to connect to MySQL database "${DB_NAME}":`, err.message);
  }
}

testConnection();

// ============================================================================
// TABLE 1: CUSTOMERS CRUD
// ============================================================================

async function getAllCustomers(search = '') {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    const [rows] = await pool.query(
      `SELECT * FROM customers 
       WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
       ORDER BY customer_id DESC`,
      [term, term, term]
    );
    return rows;
  }
  const [rows] = await pool.query('SELECT * FROM customers ORDER BY customer_id DESC');
  return rows;
}

async function getCustomerById(id) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [Number(id)]);
  return rows.length ? rows[0] : null;
}

async function insertCustomer(data) {
  const [result] = await pool.query(
    `INSERT INTO customers (name, phone, email, address)
     VALUES (?, ?, ?, ?)`,
    [
      data.name ? data.name.trim() : '',
      data.phone ? data.phone.trim() : '',
      data.email ? data.email.trim() : '',
      data.address ? data.address.trim() : ''
    ]
  );
  return await getCustomerById(result.insertId);
}

async function updateCustomer(id, data) {
  const existing = await getCustomerById(id);
  if (!existing) return null;

  await pool.query(
    `UPDATE customers SET
       name = ?,
       phone = ?,
       email = ?,
       address = ?
     WHERE customer_id = ?`,
    [
      data.name !== undefined ? data.name.trim() : existing.name,
      data.phone !== undefined ? data.phone.trim() : existing.phone,
      data.email !== undefined ? data.email.trim() : existing.email,
      data.address !== undefined ? data.address.trim() : existing.address,
      Number(id)
    ]
  );

  return await getCustomerById(id);
}

async function deleteCustomer(id) {
  const [result] = await pool.query('DELETE FROM customers WHERE customer_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

// ============================================================================
// TABLE 2: VEHICLES CRUD
// ============================================================================

async function getAllVehicles(search = '') {
  let query = `
    SELECT v.*, c.name AS customer_name, c.phone AS customer_phone
    FROM vehicles v
    JOIN customers c ON v.customer_id = c.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (search && search.trim()) {
    query += ` AND (v.vehicle_number LIKE ? OR v.vehicle_model LIKE ? OR c.name LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY v.vehicle_id DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getVehicleById(id) {
  const [rows] = await pool.query(
    `SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
     FROM vehicles v
     JOIN customers c ON v.customer_id = c.customer_id
     WHERE v.vehicle_id = ?`,
    [Number(id)]
  );
  return rows.length ? rows[0] : null;
}

async function getVehiclesByCustomer(customerId) {
  const [rows] = await pool.query(
    'SELECT * FROM vehicles WHERE customer_id = ? ORDER BY vehicle_id DESC',
    [Number(customerId)]
  );
  return rows;
}

async function insertVehicle(data) {
  const [result] = await pool.query(
    `INSERT INTO vehicles (customer_id, vehicle_number, vehicle_model, vehicle_type)
     VALUES (?, ?, ?, ?)`,
    [
      Number(data.customer_id),
      data.vehicle_number ? data.vehicle_number.trim().toUpperCase() : '',
      data.vehicle_model ? data.vehicle_model.trim() : '',
      data.vehicle_type ? data.vehicle_type.trim() : 'Sedan'
    ]
  );
  return await getVehicleById(result.insertId);
}

async function updateVehicle(id, data) {
  const existing = await getVehicleById(id);
  if (!existing) return null;

  await pool.query(
    `UPDATE vehicles SET
       customer_id = ?,
       vehicle_number = ?,
       vehicle_model = ?,
       vehicle_type = ?
     WHERE vehicle_id = ?`,
    [
      data.customer_id !== undefined ? Number(data.customer_id) : existing.customer_id,
      data.vehicle_number !== undefined ? data.vehicle_number.trim().toUpperCase() : existing.vehicle_number,
      data.vehicle_model !== undefined ? data.vehicle_model.trim() : existing.vehicle_model,
      data.vehicle_type !== undefined ? data.vehicle_type.trim() : existing.vehicle_type,
      Number(id)
    ]
  );

  return await getVehicleById(id);
}

async function deleteVehicle(id) {
  const [result] = await pool.query('DELETE FROM vehicles WHERE vehicle_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

// ============================================================================
// TABLE 3: SERVICES CRUD
// ============================================================================

async function getAllServices(filters = {}) {
  let query = `
    SELECT 
      s.*,
      v.vehicle_number,
      v.vehicle_model,
      v.vehicle_type,
      c.customer_id,
      c.name AS customer_name,
      c.phone AS customer_phone
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.vehicle_id
    JOIN customers c ON v.customer_id = c.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status && filters.status !== 'All') {
    query += ' AND s.status = ?';
    params.push(filters.status.trim());
  }

  if (filters.search && filters.search.trim()) {
    query += ` AND (v.vehicle_number LIKE ? OR c.name LIKE ? OR s.service_type LIKE ?)`;
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY s.service_id DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getServiceById(id) {
  const [rows] = await pool.query(
    `SELECT 
       s.*,
       v.vehicle_number,
       v.vehicle_model,
       v.vehicle_type,
       c.customer_id,
       c.name AS customer_name,
       c.phone AS customer_phone,
       c.email AS customer_email
     FROM services s
     JOIN vehicles v ON s.vehicle_id = v.vehicle_id
     JOIN customers c ON v.customer_id = c.customer_id
     WHERE s.service_id = ?`,
    [Number(id)]
  );
  return rows.length ? rows[0] : null;
}

async function insertService(data) {
  const [result] = await pool.query(
    `INSERT INTO services (vehicle_id, service_type, service_date, description, service_charge, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      Number(data.vehicle_id),
      data.service_type ? data.service_type.trim() : 'General Service',
      data.service_date || new Date().toISOString().slice(0, 10),
      data.description ? data.description.trim() : '',
      Number(data.service_charge) || 0.00,
      data.status || 'Booked'
    ]
  );
  return await getServiceById(result.insertId);
}

async function updateService(id, data) {
  const existing = await getServiceById(id);
  if (!existing) return null;

  await pool.query(
    `UPDATE services SET
       vehicle_id = ?,
       service_type = ?,
       service_date = ?,
       description = ?,
       service_charge = ?,
       status = ?
     WHERE service_id = ?`,
    [
      data.vehicle_id !== undefined ? Number(data.vehicle_id) : existing.vehicle_id,
      data.service_type !== undefined ? data.service_type.trim() : existing.service_type,
      data.service_date !== undefined ? data.service_date : existing.service_date,
      data.description !== undefined ? data.description.trim() : existing.description,
      data.service_charge !== undefined ? Number(data.service_charge) : existing.service_charge,
      data.status !== undefined ? data.status.trim() : existing.status,
      Number(id)
    ]
  );

  return await getServiceById(id);
}

async function updateServiceStatus(id, status, description) {
  const existing = await getServiceById(id);
  if (!existing) return null;

  await pool.query(
    `UPDATE services SET
       status = ?,
       description = COALESCE(?, description)
     WHERE service_id = ?`,
    [status, description ? description.trim() : null, Number(id)]
  );
  return await getServiceById(id);
}

async function updateServiceCharge(id, service_charge) {
  const existing = await getServiceById(id);
  if (!existing) return null;

  await pool.query(
    'UPDATE services SET service_charge = ? WHERE service_id = ?',
    [Number(service_charge), Number(id)]
  );
  return await getServiceById(id);
}

async function deleteService(id) {
  const [result] = await pool.query('DELETE FROM services WHERE service_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

// ============================================================================
// TABLE 4: PAYMENTS CRUD
// ============================================================================

async function getAllPayments(filters = {}) {
  let query = `
    SELECT 
      p.*,
      s.service_type,
      s.service_charge,
      v.vehicle_number,
      v.vehicle_model,
      c.name AS customer_name,
      c.phone AS customer_phone
    FROM payments p
    JOIN services s ON p.service_id = s.service_id
    JOIN vehicles v ON s.vehicle_id = v.vehicle_id
    JOIN customers c ON v.customer_id = c.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status && filters.status !== 'All') {
    query += ' AND p.status = ?';
    params.push(filters.status.trim());
  }

  if (filters.method && filters.method !== 'All') {
    query += ' AND p.payment_method = ?';
    params.push(filters.method.trim());
  }

  query += ' ORDER BY p.payment_id DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getPaymentById(id) {
  const [rows] = await pool.query(
    `SELECT 
       p.*,
       s.service_type,
       s.service_charge,
       v.vehicle_number,
       v.vehicle_model,
       c.name AS customer_name,
       c.phone AS customer_phone
     FROM payments p
     JOIN services s ON p.service_id = s.service_id
     JOIN vehicles v ON s.vehicle_id = v.vehicle_id
     JOIN customers c ON v.customer_id = c.customer_id
     WHERE p.payment_id = ?`,
    [Number(id)]
  );
  return rows.length ? rows[0] : null;
}

async function insertPayment(data) {
  const [result] = await pool.query(
    `INSERT INTO payments (service_id, amount, payment_method, payment_date, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      Number(data.service_id),
      Number(data.amount) || 0.00,
      data.payment_method || 'Cash',
      data.payment_date || new Date().toISOString().slice(0, 10),
      data.status || 'Pending'
    ]
  );
  return await getPaymentById(result.insertId);
}

async function updatePayment(id, data) {
  const existing = await getPaymentById(id);
  if (!existing) return null;

  await pool.query(
    `UPDATE payments SET
       service_id = ?,
       amount = ?,
       payment_method = ?,
       payment_date = ?,
       status = ?
     WHERE payment_id = ?`,
    [
      data.service_id !== undefined ? Number(data.service_id) : existing.service_id,
      data.amount !== undefined ? Number(data.amount) : existing.amount,
      data.payment_method !== undefined ? data.payment_method.trim() : existing.payment_method,
      data.payment_date !== undefined ? data.payment_date : existing.payment_date,
      data.status !== undefined ? data.status.trim() : existing.status,
      Number(id)
    ]
  );

  return await getPaymentById(id);
}

async function deletePayment(id) {
  const [result] = await pool.query('DELETE FROM payments WHERE payment_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

// ============================================================================
// SYSTEM KPI STATS
// ============================================================================

async function getDashboardStats() {
  const [custRows] = await pool.query('SELECT COUNT(*) AS count FROM customers');
  const [vehRows] = await pool.query('SELECT COUNT(*) AS count FROM vehicles');
  
  const [activeRows] = await pool.query(`
    SELECT COUNT(*) AS count FROM services 
    WHERE status = 'Booked' OR status = 'In Progress'
  `);

  const [compRows] = await pool.query(`
    SELECT COUNT(*) AS count FROM services WHERE status = 'Completed'
  `);

  const [revRows] = await pool.query(`
    SELECT SUM(amount) AS total FROM payments WHERE status = 'Paid'
  `);
  const totalRevenue = revRows[0] && revRows[0].total ? Number(revRows[0].total) : 0.00;

  const [pendingRows] = await pool.query(`
    SELECT COUNT(*) AS count, SUM(amount) AS total 
    FROM payments WHERE status = 'Pending'
  `);
  const pendingPaymentsCount = pendingRows[0] ? Number(pendingRows[0].count) : 0;
  const pendingPaymentsAmount = pendingRows[0] && pendingRows[0].total ? Number(pendingRows[0].total) : 0.00;

  const [recentServices] = await pool.query(`
    SELECT 
      s.service_id, s.service_type, s.service_date, s.service_charge, s.status,
      v.vehicle_number, v.vehicle_model,
      c.name AS customer_name
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.vehicle_id
    JOIN customers c ON v.customer_id = c.customer_id
    ORDER BY s.service_id DESC
    LIMIT 6
  `);

  return {
    totalCustomers: custRows[0].count,
    totalVehicles: vehRows[0].count,
    activeServices: activeRows[0].count,
    completedServices: compRows[0].count,
    totalRevenue,
    pendingPaymentsCount,
    pendingPaymentsAmount,
    recentServices
  };
}

module.exports = {
  pool,
  getAllCustomers,
  getCustomerById,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
  getAllVehicles,
  getVehicleById,
  getVehiclesByCustomer,
  insertVehicle,
  updateVehicle,
  deleteVehicle,
  getAllServices,
  getServiceById,
  insertService,
  updateService,
  updateServiceStatus,
  updateServiceCharge,
  deleteService,
  getAllPayments,
  getPaymentById,
  insertPayment,
  updatePayment,
  deletePayment,
  getDashboardStats
};
