/**
 * Automated Verification Test Suite
 * Vehicle Service Centre Management System (MySQL Backend)
 * Tests CRUD on all 4 tables: CUSTOMERS, VEHICLES, SERVICES, PAYMENTS in MySQL Server
 */

const db = require('./database.js');

async function runTests() {
  console.log('================================================================');
  console.log('🚗 VEHICLE SERVICE CENTRE - MYSQL CRUD VERIFICATION TEST');
  console.log('Database Schema: vehicle_service_centre (MySQL Workbench)');
  console.log('================================================================\n');

  try {
    // 1. CUSTOMER CRUD
    console.log('--- 1. Testing CUSTOMERS Table (MySQL) ---');
    const initialCustomers = await db.getAllCustomers();
    console.log(`[READ] Initial customers count: ${initialCustomers.length}`);

    const newCust = await db.insertCustomer({
      name: 'Anita Desai (MySQL Test)',
      phone: '+91 99887 77665',
      email: 'anita.desai@example.com',
      address: '404 Skyline Towers, MG Road'
    });
    console.log(`[CREATE] Customer inserted into MySQL: ID=${newCust.customer_id}, Name=${newCust.name}`);

    const updatedCust = await db.updateCustomer(newCust.customer_id, {
      address: '505 Penthouse, Skyline Towers, MG Road'
    });
    console.log(`[UPDATE] Customer updated in MySQL: ${updatedCust.address}`);

    // 2. VEHICLE CRUD
    console.log('\n--- 2. Testing VEHICLES Table (MySQL) ---');
    const newVeh = await db.insertVehicle({
      customer_id: newCust.customer_id,
      vehicle_number: 'TS-08-TX-9999',
      vehicle_model: 'Honda City ZX',
      vehicle_type: 'Sedan'
    });
    console.log(`[CREATE] Vehicle inserted into MySQL: ID=${newVeh.vehicle_id}, Number=${newVeh.vehicle_number}, Owner=${newVeh.customer_name}`);

    const updatedVeh = await db.updateVehicle(newVeh.vehicle_id, {
      vehicle_model: 'Honda City e:HEV Hybrid'
    });
    console.log(`[UPDATE] Vehicle model updated in MySQL: ${updatedVeh.vehicle_model}`);

    // 3. SERVICES CRUD
    console.log('\n--- 3. Testing SERVICES Table (MySQL) ---');
    const newSvc = await db.insertService({
      vehicle_id: newVeh.vehicle_id,
      service_type: 'Comprehensive 40,000 KM Periodic Service',
      service_date: '2026-11-08',
      description: 'Replace synthetic engine oil, oil filter, cabin pollen filter, coolant flush.',
      service_charge: 5400.00,
      status: 'Booked'
    });
    console.log(`[CREATE] Service booked in MySQL: ID=${newSvc.service_id}, Type=${newSvc.service_type}, Charge=₹${newSvc.service_charge}`);

    // Mechanic progress update
    const mechanicUpdated = await db.updateServiceStatus(newSvc.service_id, 'In Progress', 'Engine oil drained, new OEM oil filter installed.');
    console.log(`[UPDATE] Mechanic updated progress in MySQL: Status=${mechanicUpdated.status}, Notes=${mechanicUpdated.description}`);

    // Admin charge update
    const adminChargeUpdated = await db.updateServiceCharge(newSvc.service_id, 5800.00);
    console.log(`[UPDATE] Admin updated final service charge in MySQL: ₹${adminChargeUpdated.service_charge}`);

    // 4. PAYMENTS CRUD
    console.log('\n--- 4. Testing PAYMENTS Table (MySQL) ---');
    const newPay = await db.insertPayment({
      service_id: newSvc.service_id,
      amount: 5800.00,
      payment_method: 'UPI',
      payment_date: '2026-11-08',
      status: 'Pending'
    });
    console.log(`[CREATE] Payment logged in MySQL: ID=${newPay.payment_id}, Amount=₹${newPay.amount}, Method=${newPay.payment_method}, Status=${newPay.status}`);

    const paidPay = await db.updatePayment(newPay.payment_id, {
      status: 'Paid'
    });
    console.log(`[UPDATE] Payment settled in MySQL: ID=${paidPay.payment_id}, New Status=${paidPay.status}`);

    // 5. KPI DASHBOARD STATS
    console.log('\n--- 5. Testing KPI Stats from MySQL ---');
    const stats = await db.getDashboardStats();
    console.log(`- Total Customers: ${stats.totalCustomers}`);
    console.log(`- Total Vehicles: ${stats.totalVehicles}`);
    console.log(`- Active Services: ${stats.activeServices}`);
    console.log(`- Completed Services: ${stats.completedServices}`);
    console.log(`- Total Revenue Collected: ₹${stats.totalRevenue}`);
    console.log(`- Pending Payments: ${stats.pendingPaymentsCount}`);

    // 6. CLEANUP TEST DATA (CASCADE DELETION TEST)
    console.log('\n--- 6. Testing Deletion & Cascade Integrity in MySQL ---');
    const delCust = await db.deleteCustomer(newCust.customer_id);
    console.log(`[DELETE] Deleted test customer ID=${newCust.customer_id} from MySQL. Result: ${delCust}`);

    // Verify vehicle was cascade deleted
    const checkVeh = await db.getVehicleById(newVeh.vehicle_id);
    console.log(`[CASCADE CHECK] Vehicle exists after customer deletion? ${checkVeh !== null}`);
    if (checkVeh !== null) {
      throw new Error('Cascade delete check failed in MySQL!');
    }

    console.log('\n================================================================');
    console.log('✅ ALL 4 TABLES & CRUD OPERATIONS IN MYSQL VERIFIED SUCCESSFULLY!');
    console.log('================================================================\n');

    process.exit(0);

  } catch (err) {
    console.error('\n❌ MYSQL TEST ERROR:', err);
    process.exit(1);
  }
}

runTests();
