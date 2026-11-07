# 🛍️ Retail Shop Management System (Python Flask + React + SQLite3)

A complete, modern conversion of the legacy PHP & MySQL Retail Shop Management System into a high-performance web application powered by **Python Flask**, **SQLite3**, **React.js (Vite)**, and **Openpyxl**.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full Access (Products, Users, Danger Zone, Budgets, Analytics) |
| **Staff Member** | `staff` | `staff123` | Sales Billing, Inventory, Customers, Expenses, Reports |
| **Customer** | Select *Customer* | *(None required)* | Public Product Storefront & Catalog |

> 🔒 **Security Note**: Original MD5 passwords have been upgraded to secure cryptographic PBKDF2/SHA-256 hashes automatically upon migration. Passwords are never returned by API or exported in Excel sheets.

---

## 🚀 Key Technology Stack

- **Backend**: Python 3 (Flask, Flask-CORS, Werkzeug)
- **Database**: SQLite3 with foreign key enforcement (`PRAGMA foreign_keys = ON;`) and ACID transaction management
- **Frontend**: React.js 18+ with Vite tooling
- **UI Components & Icons**: Lucide React, HTML5 Canvas Speedometer, Chart.js analytics
- **Excel Generation**: Python `openpyxl` with professional cell styling, auto column widths, currency & date formatting
- **Testing**: `pytest` comprehensive test suite covering all APIs, transactions, stock deduction, and Excel files

---

## ✨ Features & Modules Preserved

1. **Admin & Staff Authentication**: Token-based secure authentication with session management and role-based access control.
2. **Interactive Dashboard**:
   - Total Active Products, Units in Stock, Today's Sales Revenue, and Total Bills count.
   - **Centered Inventory Speedometer Gauge** with needle pointer, low inventory alerts (< 30%), and capacity monitoring (5,000 unit capacity).
   - **Monthly Expense Health Widget** featuring dynamic emoji reactions (`😊 Good`, `😐 Warning`, `😟 Overspent`) and progress bar.
   - Recent invoices and low-stock alerts table.
   - **Danger Zone** (Admin only) to safely reset transaction and product data with confirmation protection.
3. **Product Management**: Full CRUD (Add, Edit, Soft Delete, Restore) with category, brand, size, color, unit price, and stock levels.
4. **Categories & Brands Management**: Grouping products with live item counts, unit totals, valuation, and separate Excel exports.
5. **Product Publishing & Customer Storefront**:
   - Admin upload of cover/display photos to publish products to the public storefront.
   - Customer-facing responsive product catalog with price in INR (`₹`), category tags, and search.
   - Ability to toggle publish status and unpublish products anytime.
6. **Stock Management & Reports**: Real-time stock levels, inventory valuation (`price * stock`), and low-stock warning tags (< 15 units).
7. **Customer Management**: Add, edit, and delete customer profiles; search by name/phone/email; view customer purchase invoice history.
8. **Point of Sale (POS) Billing**:
   - Dynamic multi-item billing interface.
   - Real-time stock checks preventing overselling or invalid quantities.
   - Automatic line-total and live Grand Total calculations.
   - Option to select existing customers or automatically register walk-in details.
   - **Atomic Database Transactions**: Deducts stock and creates invoice synchronously; automatically rolls back if any item fails.
   - Instant printable invoice modal with clean thermal / A4 tax bill layout.
9. **Sales History**: Complete searchable bill master table with customer details, item count, date range filters, and invoice viewer.
10. **Sales Item Details**: Detailed line-item breakdown across all bills with product name, category, brand, unit price, quantity sold, and line total.
11. **Daily Sales Report**: Filterable by calendar date, showing closed bills, customer names, and daily revenue sum.
12. **Monthly Sales Report**: Monthly selector with daily revenue aggregation and grand monthly totals.
13. **Expense Tracker**:
    - Monthly view of operational expenses.
    - Category spending breakdown cards with icon emoji, spent vs. budget bar, and health reaction badge.
    - Interactive **Chart.js** Analytics: Expense vs Budget Bar Chart and Spending Distribution Doughnut Chart.
    - Full expense list with category, title, amount, date, notes, and delete capability.
    - Add Expense form with category selector.
14. **Expense Categories & Budget Management**:
    - Manage category names, custom emoji icons, and monthly budget allocations.
    - Real-time budget variance calculation (`Budget - Spent`) and utilization rate (`%`).

---

## 📊 Excel Download for Every Records Page (Openpyxl)

Every module contains a prominent green **Export to Excel** button. Exports are genuine `.xlsx` files generated server-side using Python `openpyxl`:

| Module | Export Endpoint | Filename | Key Features |
| :--- | :--- | :--- | :--- |
| **Products** | `GET /api/export/products` | `products_export.xlsx` | All active products, category/brand filters, stock sum, status |
| **Customers** | `GET /api/export/customers` | `customers_export.xlsx` | Customer directory, total bills, lifetime purchase total sum |
| **Sales Master** | `GET /api/export/sales` | `sales_export.xlsx` | Invoices list, date range filters, total revenue sum, item count |
| **Sales Items** | `GET /api/export/sale-items` | `sale_items_export.xlsx` | Granular line items, product details, quantity sum, revenue sum |
| **Expenses** | `GET /api/export/expenses` | `expenses_export.xlsx` | Monthly expense logs, category icon, amount sum, notes |
| **Staff & Users** | `GET /api/export/users` | `users_export.xlsx` | System accounts list (passwords excluded for security) |
| **Stock Report** | `GET /api/export/stock` | `stock_export.xlsx` | Stock levels, inventory valuation sum, stock health status |
| **Categories** | `GET /api/export/categories` | `product_categories_export.xlsx` | Product distribution, stock unit sum, inventory value sum |
| **Brands** | `GET /api/export/brands` | `product_brands_export.xlsx` | Brand distribution, stock unit sum, inventory value sum |
| **Expense Categories** | `GET /api/export/expense-categories`| `expense_categories_export.xlsx` | Categories, monthly budget sum, spent sum, remaining sum |
| **Monthly Budgets** | `GET /api/export/budgets` | `budgets_export.xlsx` | Budget ceiling, actual spent, variance sum, utilization % |
| **Daily Report** | `GET /api/export/daily-report` | `daily_report_<date>.xlsx` | Filtered day sales, closed bills, day total sum |
| **Monthly Report** | `GET /api/export/monthly-report`| `monthly_report_<month>.xlsx`| Filtered month sales, daily aggregated revenue, grand total |

### Excel Formatting Highlights:
- **Navy Header Banner**: Title, timestamp, active filters, and record count.
- **Header Row**: `#2C3E50` dark fill with bold white typography and thin borders.
- **Cell Formatting**: Currencies formatted as `₹#,##0.00`, numbers as `#,##0`, dates as `YYYY-MM-DD`.
- **Auto Column Widths**: Automatically adjusted with safety padding so text is never truncated.
- **Totals Row**: Bold summary row with double bottom border on financial columns.
- **Empty-Data Handling**: Displays clean headers and a formatted "No records found" row without crashing.

---

## 🛠️ Windows Installation & Execution Guide

### Prerequisites
- Python 3.10 or higher installed (with `pip`)
- Node.js 18 or higher (optional, only needed if rebuilding frontend)

### Quick Start (Standalone / Single Command)
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd c:\xampp\htdocs\retail_shop_with_expenses\retail_shop
   ```
2. Install Python dependencies:
   ```powershell
   python -m pip install -r backend/requirements.txt
   ```
3. Run the system:
   ```powershell
   python run.py
   ```
   *(Or double-click `start_app.bat` in Windows Explorer)*
4. The system will automatically:
   - Initialize the SQLite3 database (`backend/retail_shop.db`).
   - Import all existing data from `mysql_dump.json` if not already present.
   - Start the web server at **http://127.0.0.1:5000**.
   - Open your default web browser to the application!

### Development Mode (with Vite Hot Reloading)
If you wish to modify the React frontend with live reloading:
1. Start the Flask backend:
   ```powershell
c
   ```
2. In a second terminal, start the Vite development server:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Access Vite at **http://localhost:3000** (API calls are automatically proxied to port 5000).

*(Or double-click `start_dev.bat` to launch both automatically!)*

---

## 🧪 Testing Verification

Automated test suite is located in `backend/tests/test_backend.py`.

To run tests:
```powershell
python -m pytest backend/tests/test_backend.py -v
```

### Verified Test Results (21 / 21 Passed):
- `test_health`: API status health check PASSED
- `test_login_invalid`: Bad credential rejection PASSED
- `test_customer_login`: Public storefront customer login PASSED
- `test_dashboard_metrics`: Live stats, gauge %, and expense overview calculation PASSED
- `test_product_crud_and_publish`: Add, read, update, soft delete, restore, and storefront publishing PASSED
- `test_sales_and_atomic_stock_deduction`: Stock check, insufficient stock rejection, atomic transaction, and stock decrement PASSED
- `test_expenses_and_budgets`: Category creation, expense tracking, and Chart.js analytics payload PASSED
- `test_all_excel_exports` [13 Endpoints]: Verified genuine `.xlsx` format, content headers, and valid openpyxl parsing PASSED
- `test_empty_records_excel_export`: Empty query handling with formatted table and "No records found" row PASSED

---

## 🗄️ Database Structure (SQLite3)

The application uses `backend/retail_shop.db` with the following schema:
- `users` (`id`, `username`, `password`, `role`, `created_at`)
- `products` (`id`, `name`, `category`, `brand`, `size`, `color`, `image`, `publish_image`, `price`, `stock`, `status`, `publish_status`, `created_at`)
- `customers` (`id`, `name`, `phone`, `email`, `created_at`)
- `sales` (`id`, `customer_id`, `sale_date`, `total_amount`)
- `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `unit_price`)
- `expense_categories` (`id`, `name`, `icon`, `budget`, `created_at`)
- `expenses` (`id`, `category_id`, `title`, `amount`, `note`, `expense_date`, `created_at`)

---

## 📡 REST API Reference Summary

### Authentication & Users
- `POST /api/auth/login` — Login with username and password or customer role
- `GET /api/auth/me` — Current user profile
- `POST /api/auth/logout` — Logout
- `GET /api/auth/users` — List users (Admin)
- `POST /api/auth/users` — Create user (Admin)
- `PUT /api/auth/users/<id>` — Update user role or reset password (Admin)
- `DELETE /api/auth/users/<id>` — Delete user (Admin)

### Dashboard
- `GET /api/dashboard/metrics` — Real-time metrics, gauge values, and expense summary
- `POST /api/dashboard/clear-all` — Danger zone clear all transactional data (Admin)

### Products & Storefront
- `GET /api/products` — List products with search, category, brand, and status filters
- `GET /api/products/<id>` — Product details
- `POST /api/products` — Add product (supports image upload)
- `PUT /api/products/<id>` — Update product
- `DELETE /api/products/<id>` — Soft delete product
- `POST /api/products/<id>/restore` — Restore product
- `POST /api/products/<id>/publish` — Publish product with cover image to customer store
- `POST /api/products/<id>/unpublish` — Remove product from storefront
- `GET /api/products/categories` — Product categories list with counts
- `GET /api/products/brands` — Product brands list with counts
- `GET /api/products/storefront` — Public customer catalog

### Customers
- `GET /api/customers` — List customers with purchase totals and bill count
- `GET /api/customers/<id>` — Customer profile and purchase history
- `POST /api/customers` — Add customer
- `PUT /api/customers/<id>` — Update customer
- `DELETE /api/customers/<id>` — Delete customer

### Sales & Billing
- `POST /api/sales` — Create sale invoice with atomic stock deduction and customer linking
- `GET /api/sales` — List invoices with search and date range filters
- `GET /api/sales/<id>` — Invoice details with line items for printing
- `GET /api/sales/items` — Detailed listing of all sold line items across bills
- `DELETE /api/sales/<id>` — Delete invoice record (Admin)

### Expenses & Budgets
- `GET /api/expenses` — Monthly expense log, category breakdown, and summary reaction
- `POST /api/expenses` — Add operational expense
- `DELETE /api/expenses/<id>` — Delete expense
- `GET /api/expenses/categories` — Expense categories with monthly spent and budget
- `POST /api/expenses/categories` — Create category (Admin)
- `PUT /api/expenses/categories/<id>` — Update category and budget (Admin)
- `DELETE /api/expenses/categories/<id>` — Delete category (Admin)
- `GET /api/expenses/analytics` — Chart data for Bar Chart and Doughnut Chart

### Reports
- `GET /api/reports/daily` — Sales on specific date with day total
- `GET /api/reports/monthly` — Sales for year and month with daily breakdown
- `GET /api/reports/stock` — Inventory valuation and low stock analysis

### Excel Exports (Openpyxl)
- `GET /api/export/products`
- `GET /api/export/customers`
- `GET /api/export/sales`
- `GET /api/export/sale-items`
- `GET /api/export/expenses`
- `GET /api/export/users`
- `GET /api/export/stock`
- `GET /api/export/categories`
- `GET /api/export/brands`
- `GET /api/export/expense-categories`
- `GET /api/export/budgets`
- `GET /api/export/daily-report`
- `GET /api/export/monthly-report`
