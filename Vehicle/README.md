# 🚗 Vehicle Service Centre Management System

A production-ready, full-stack management web application built for vehicle workshops, auto garages, and authorized service centers.

---

## 📌 Project Overview
- **Customer Registration & Vehicles**: Customers can register their profiles, record their vehicle license numbers, models, and types (SUV, Sedan, Hatchback, EV, Motorcycle).
- **Service Appointments**: Customers and service advisors can schedule service bookings with custom descriptions and dates.
- **Mechanic Progress Tracking**: Mechanics can view pending tickets, update repair progress (`Booked` ➔ `In Progress` ➔ `Completed`), and attach technician notes.
- **Admin Billing & Payments**: Service managers can update service charges, log customer payments (UPI, Cash, Cards, Net Banking), and track unpaid receivables.
- **Strictly English Only**: Clean, standardized industrial interface with no placeholder text or dialect conversions.

---

## 🗄️ Database Schema & Specifications

### TABLE 1: `CUSTOMERS`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for customer |
| `name` | `VARCHAR(100)` | `NOT NULL` | Customer full name |
| `phone` | `VARCHAR(15)` | `NOT NULL` | Contact phone number |
| `email` | `VARCHAR(100)` | `NULLABLE` | Customer email |
| `address` | `VARCHAR(255)` | `NULLABLE` | Residential / billing address |

### TABLE 2: `VEHICLES`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `vehicle_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique vehicle record ID |
| `customer_id` | `INTEGER` | `FOREIGN KEY REFERENCES customers` | Linked owner |
| `vehicle_number` | `VARCHAR(30)` | `UNIQUE NOT NULL` | License plate number |
| `vehicle_model` | `VARCHAR(100)` | `NOT NULL` | Make and model (e.g., Hyundai Creta) |
| `vehicle_type` | `VARCHAR(50)` | `NOT NULL` | Category (SUV, Sedan, Hatchback, etc.) |

### TABLE 3: `SERVICES`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `service_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Service ticket number |
| `vehicle_id` | `INTEGER` | `FOREIGN KEY REFERENCES vehicles` | Target vehicle |
| `service_type` | `VARCHAR(100)` | `NOT NULL` | Maintenance or repair category |
| `service_date` | `DATE` | `NOT NULL` | Scheduled appointment date |
| `description` | `TEXT` | `NULLABLE` | Symptoms, work required, technician notes |
| `service_charge` | `DECIMAL(10,2)`| `DEFAULT 0.00` | Labor & replacement cost |
| `status` | `VARCHAR(30)` | `DEFAULT 'Booked'` | `Booked`, `In Progress`, `Completed`, `Cancelled` |

### TABLE 4: `PAYMENTS`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payment_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Transaction ID |
| `service_id` | `INTEGER` | `FOREIGN KEY REFERENCES services` | Linked service ticket |
| `amount` | `DECIMAL(10,2)`| `NOT NULL` | Amount billed / paid |
| `payment_method` | `VARCHAR(30)` | `NOT NULL` | `UPI`, `Cash`, `Credit Card`, `Debit Card`, `Net Banking` |
| `payment_date` | `DATE` | `NOT NULL` | Date of settlement |
| `status` | `VARCHAR(20)` | `DEFAULT 'Pending'` | `Paid`, `Pending`, `Failed` |

---

## 📂 Project Directory Structure

```text
C:\Users\D DAMODAR REDDY\Desktop\vehicle\
├── .env                       # Environment configuration (Port, Database path)
├── .env.example               # Template environment configuration
├── database.sql               # Standard SQL DDL & initial seed records
├── database.js                # SQLite data access engine with CRUD methods
├── server.js                  # Native HTTP REST API server
├── app.js                     # Alias server entrypoint
├── package.json               # Node.js project manifest & scripts
├── start.bat                  # One-click Windows launcher (starts server & opens browser)
├── start.ps1                  # PowerShell launcher script
├── test_crud.js               # Automated CRUD test suite
├── README.md                  # System documentation
├── index.html                 # [DASHBOARD] Live KPI counters & Service Queue
├── customers.html             # [TABLE 1] Customer Registry (CRUD)
├── vehicles.html              # [TABLE 2] Vehicles Registry (CRUD)
├── services.html              # [TABLE 3] Services & Mechanic Progress (CRUD)
├── payments.html              # [TABLE 4] Payments Ledger & Invoice Receipts (CRUD)
├── css/
│   └── style.css              # Industrial auto care UI stylesheet
├── js/
│   └── app.js                 # Frontend utilities, currency & date formatters
└── public/                    # Mirror directory for web assets
```

---

## ⚡ How to Run the Application

### Method 1: One-Click (Windows)
Double-click **`start.bat`** inside `C:\Users\D DAMODAR REDDY\Desktop\vehicle`.  
The server will start and automatically open your default browser to:  
👉 **http://localhost:3000/index.html**

### Method 2: Command Line
```powershell
cd "C:\Users\D DAMODAR REDDY\Desktop\vehicle"
node server.js
```
Then visit: **http://localhost:3000/index.html**

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stats` | Dashboard counters (customers, vehicles, active/completed services, revenue) |
| `GET` | `/api/customers` | Get all customers (Supports `?search=`) |
| `POST`| `/api/customers` | Insert new customer |
| `PUT` | `/api/customers/:id` | Update customer details |
| `DELETE`| `/api/customers/:id` | Delete customer (Cascades to vehicles/services/payments) |
| `GET` | `/api/vehicles` | Get all vehicles with owner information |
| `POST`| `/api/vehicles` | Register vehicle for a customer |
| `PUT` | `/api/vehicles/:id` | Update vehicle details |
| `DELETE`| `/api/vehicles/:id` | Delete vehicle |
| `GET` | `/api/services` | Get all services (Supports `?status=` and `?search=`) |
| `POST`| `/api/services` | Book new service appointment |
| `PUT` | `/api/services/:id` | Update service progress (Mechanic) / charge (Admin) |
| `DELETE`| `/api/services/:id` | Delete service ticket |
| `GET` | `/api/payments` | Get all payments (Supports `?status=` and `?method=`) |
| `POST`| `/api/payments` | Record payment transaction |
| `PUT` | `/api/payments/:id` | Update payment status / method |
| `DELETE`| `/api/payments/:id` | Delete payment record |

---

## 🧪 Automated Testing
Run the test suite anytime:
```bash
node test_crud.js
```
Verifies insertion, reading, updates, stats aggregation, and cascade deletion across all 4 tables.
