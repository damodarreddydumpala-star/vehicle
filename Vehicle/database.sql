-- ============================================================================
-- VEHICLE SERVICE CENTRE MANAGEMENT SYSTEM DATABASE SCHEMA
-- Compatible with SQLite, MySQL Workbench, PostgreSQL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1: CUSTOMERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255)
);

-- ----------------------------------------------------------------------------
-- TABLE 2: VEHICLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    vehicle_number VARCHAR(30) UNIQUE NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- TABLE 3: SERVICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    service_date DATE NOT NULL,
    description TEXT,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Booked', -- 'Booked', 'In Progress', 'Completed', 'Cancelled'
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- TABLE 4: PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- 'UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'
    payment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Paid', 'Pending', 'Failed'
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Sample Seed Data: Customers
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO customers (customer_id, name, phone, email, address)
VALUES
(1, 'Rahul Sharma', '+91 98765 11221', 'rahul.sharma@example.com', 'Flat 302, Green Meadows, Hyderabad'),
(2, 'Pooja Reddy', '+91 98765 22332', 'pooja.reddy@example.com', 'Plot 45, Jubilee Enclave, Kurnool'),
(3, 'Vikram Mehta', '+91 98765 33443', 'vikram.mehta@example.com', 'House 12-4, MG Road, Vijayawada'),
(4, 'Suresh Patel', '+91 98765 44554', 'suresh.patel@example.com', 'Sector 9, HSR Layout, Bengaluru');

-- ----------------------------------------------------------------------------
-- Sample Seed Data: Vehicles
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO vehicles (vehicle_id, customer_id, vehicle_number, vehicle_model, vehicle_type)
VALUES
(1, 1, 'AP-21-BK-1001', 'Hyundai Creta 1.5 SX', 'SUV'),
(2, 2, 'AP-21-CA-2042', 'Maruti Suzuki Swift VXi', 'Hatchback'),
(3, 3, 'TS-09-EA-3344', 'Tata Nexon EV Max', 'Electric SUV'),
(4, 4, 'KA-05-MH-9988', 'Royal Enfield Classic 350', 'Motorcycle');

-- ----------------------------------------------------------------------------
-- Sample Seed Data: Services
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO services (service_id, vehicle_id, service_type, service_date, description, service_charge, status)
VALUES
(1, 1, 'Periodic Maintenance Service', '2026-11-05', 'Engine oil replacement, oil filter, air filter cleaning, and brake fluid inspection.', 4500.00, 'Completed'),
(2, 2, 'Brake System Overhaul', '2026-11-06', 'Front brake pads worn out, rotor disk skimmed, hydraulic bleeding completed.', 2800.00, 'Completed'),
(3, 3, 'AC Cooling Inspection & Filter', '2026-11-07', 'Customer reported weak cabin airflow. Cabin pollen filter replaced, refrigerant gas refilled.', 3200.00, 'In Progress'),
(4, 4, 'General Tune-Up & Chain Lubrication', '2026-11-07', 'Chain clean and lube, spark plug inspection, carburettor tuning and cable tension adjustment.', 1200.00, 'Booked');

-- ----------------------------------------------------------------------------
-- Sample Seed Data: Payments
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO payments (payment_id, service_id, amount, payment_method, payment_date, status)
VALUES
(1, 1, 4500.00, 'UPI', '2026-11-05', 'Paid'),
(2, 2, 2800.00, 'Credit Card', '2026-11-06', 'Paid'),
(3, 3, 3200.00, 'UPI', '2026-11-07', 'Pending'),
(4, 4, 1200.00, 'Cash', '2026-11-07', 'Pending');
