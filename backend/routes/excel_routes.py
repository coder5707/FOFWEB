from datetime import datetime
from flask import Blueprint, request, send_file, jsonify
from database import query_db
from auth_utils import login_required, admin_required
from excel_service import build_excel_workbook

excel_bp = Blueprint('excel', __name__)

def make_excel_response(buffer, filename):
    return send_file(
        buffer,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename
    )

# 1. Products Export
@excel_bp.route('/products', methods=['GET'])
@login_required
def export_products():
    category = request.args.get('category', '').strip()
    brand = request.args.get('brand', '').strip()
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '1')

    sql = "SELECT id, name, category, brand, size, color, price, stock, status, publish_status, created_at FROM products WHERE 1=1"
    params = []
    if status_filter != 'all':
        sql += " AND status = ?"
        params.append(int(status_filter))
    if category:
        sql += " AND LOWER(category) = LOWER(?)"
        params.append(category)
    if brand:
        sql += " AND LOWER(brand) = LOWER(?)"
        params.append(brand)
    if search:
        search_like = f"%{search}%"
        sql += " AND (name LIKE ? OR category LIKE ? OR brand LIKE ? OR color LIKE ?)"
        params.extend([search_like, search_like, search_like, search_like])
    sql += " ORDER BY id DESC"

    products = query_db(sql, params)
    for p in products:
        p['status_label'] = 'Active' if p['status'] == 1 else 'Deleted'
        p['published_label'] = 'Published' if p['publish_status'] == 1 else 'Draft'

    columns = [
        {'header': 'Product ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Product Name', 'key': 'name', 'align': 'left', 'format': 'text'},
        {'header': 'Category', 'key': 'category', 'align': 'left', 'format': 'text'},
        {'header': 'Brand', 'key': 'brand', 'align': 'left', 'format': 'text'},
        {'header': 'Size', 'key': 'size', 'align': 'center', 'format': 'text'},
        {'header': 'Color', 'key': 'color', 'align': 'center', 'format': 'text'},
        {'header': 'Price', 'key': 'price', 'align': 'right', 'format': 'currency'},
        {'header': 'Stock Quantity', 'key': 'stock', 'align': 'right', 'format': 'number'},
        {'header': 'Status', 'key': 'status_label', 'align': 'center', 'format': 'text'},
        {'header': 'Customer Store', 'key': 'published_label', 'align': 'center', 'format': 'text'},
        {'header': 'Created Date', 'key': 'created_at', 'align': 'center', 'format': 'date'}
    ]

    filter_desc = []
    if category: filter_desc.append(f"Category: {category}")
    if brand: filter_desc.append(f"Brand: {brand}")
    if search: filter_desc.append(f"Search: '{search}'")

    buffer = build_excel_workbook(
        title="Products Catalog",
        columns=columns,
        rows=products,
        total_columns={'stock': 'sum'},
        filter_description=" | ".join(filter_desc) if filter_desc else None
    )
    return make_excel_response(buffer, "products_export.xlsx")

# 2. Customers Export
@excel_bp.route('/customers', methods=['GET'])
@login_required
def export_customers():
    search = request.args.get('search', '').strip()
    sql = """
        SELECT c.id, c.name, c.phone, c.email, c.created_at,
               COUNT(s.id) as total_bills,
               COALESCE(SUM(s.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        WHERE 1=1
    """
    params = []
    if search:
        search_like = f"%{search}%"
        sql += " AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)"
        params.extend([search_like, search_like, search_like])
    sql += " GROUP BY c.id ORDER BY c.id DESC"

    customers = query_db(sql, params)

    columns = [
        {'header': 'Customer ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Customer Name', 'key': 'name', 'align': 'left', 'format': 'text'},
        {'header': 'Phone Number', 'key': 'phone', 'align': 'left', 'format': 'text'},
        {'header': 'Email Address', 'key': 'email', 'align': 'left', 'format': 'text'},
        {'header': 'Total Bills', 'key': 'total_bills', 'align': 'right', 'format': 'number'},
        {'header': 'Total Purchased', 'key': 'total_spent', 'align': 'right', 'format': 'currency'},
        {'header': 'Registered On', 'key': 'created_at', 'align': 'center', 'format': 'date'}
    ]

    buffer = build_excel_workbook(
        title="Customer Directory",
        columns=columns,
        rows=customers,
        total_columns={'total_bills': 'sum', 'total_spent': 'sum'},
        filter_description=f"Search: '{search}'" if search else None
    )
    return make_excel_response(buffer, "customers_export.xlsx")

# 3. Sales Records Export
@excel_bp.route('/sales', methods=['GET'])
@login_required
def export_sales():
    search = request.args.get('search', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()

    sql = """
        SELECT s.id, s.sale_date, s.total_amount,
               COALESCE(c.name, 'Walk-in') as customer_name,
               c.phone as customer_phone,
               (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE 1=1
    """
    params = []
    if search:
        if search.isdigit():
            sql += " AND (s.id = ? OR c.name LIKE ?)"
            params.extend([int(search), f"%{search}%"])
        else:
            sql += " AND c.name LIKE ?"
            params.append(f"%{search}%")
    if start_date:
        sql += " AND date(s.sale_date) >= ?"
        params.append(start_date)
    if end_date:
        sql += " AND date(s.sale_date) <= ?"
        params.append(end_date)
    sql += " ORDER BY s.sale_date DESC, s.id DESC"

    sales = query_db(sql, params)

    columns = [
        {'header': 'Bill ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Date & Time', 'key': 'sale_date', 'align': 'center', 'format': 'date'},
        {'header': 'Customer Name', 'key': 'customer_name', 'align': 'left', 'format': 'text'},
        {'header': 'Customer Phone', 'key': 'customer_phone', 'align': 'left', 'format': 'text'},
        {'header': 'Items Count', 'key': 'item_count', 'align': 'right', 'format': 'number'},
        {'header': 'Total Bill Amount', 'key': 'total_amount', 'align': 'right', 'format': 'currency'}
    ]

    filter_desc = []
    if start_date: filter_desc.append(f"From: {start_date}")
    if end_date: filter_desc.append(f"To: {end_date}")
    if search: filter_desc.append(f"Search: '{search}'")

    buffer = build_excel_workbook(
        title="Sales Invoices Master",
        columns=columns,
        rows=sales,
        total_columns={'total_amount': 'sum', 'item_count': 'sum'},
        filter_description=" | ".join(filter_desc) if filter_desc else None
    )
    return make_excel_response(buffer, "sales_export.xlsx")

# 4. Sales Item Details Export
@excel_bp.route('/sale-items', methods=['GET'])
@login_required
def export_sale_items():
    search = request.args.get('search', '').strip()
    sql = """
        SELECT si.id, si.sale_id, s.sale_date,
               p.name as product_name, p.category, p.brand,
               si.quantity, si.unit_price, (si.quantity * si.unit_price) as line_total,
               COALESCE(c.name, 'Walk-in') as customer_name
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE 1=1
    """
    params = []
    if search:
        search_like = f"%{search}%"
        sql += " AND (p.name LIKE ? OR p.category LIKE ? OR p.brand LIKE ? OR c.name LIKE ?)"
        params.extend([search_like, search_like, search_like, search_like])
    sql += " ORDER BY s.sale_date DESC, si.id DESC"

    items = query_db(sql, params)

    columns = [
        {'header': 'Item Entry ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Bill ID', 'key': 'sale_id', 'align': 'center', 'format': 'number'},
        {'header': 'Date & Time', 'key': 'sale_date', 'align': 'center', 'format': 'date'},
        {'header': 'Customer', 'key': 'customer_name', 'align': 'left', 'format': 'text'},
        {'header': 'Product Name', 'key': 'product_name', 'align': 'left', 'format': 'text'},
        {'header': 'Category', 'key': 'category', 'align': 'left', 'format': 'text'},
        {'header': 'Brand', 'key': 'brand', 'align': 'left', 'format': 'text'},
        {'header': 'Quantity Sold', 'key': 'quantity', 'align': 'right', 'format': 'number'},
        {'header': 'Unit Price', 'key': 'unit_price', 'align': 'right', 'format': 'currency'},
        {'header': 'Line Total', 'key': 'line_total', 'align': 'right', 'format': 'currency'}
    ]

    buffer = build_excel_workbook(
        title="Sales Line Items Detail",
        columns=columns,
        rows=items,
        total_columns={'quantity': 'sum', 'line_total': 'sum'},
        filter_description=f"Search: '{search}'" if search else None
    )
    return make_excel_response(buffer, "sale_items_export.xlsx")

# 5. Expenses Export
@excel_bp.route('/expenses', methods=['GET'])
@login_required
def export_expenses():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    search = request.args.get('search', '').strip()
    category_id = request.args.get('category_id')

    sql = """
        SELECT e.id, e.expense_date, ec.name as category_name, ec.icon as category_icon,
               e.title, e.amount, e.note, ec.budget as category_budget
        FROM expenses e
        JOIN expense_categories ec ON e.category_id = ec.id
        WHERE DATE_FORMAT(e.expense_date, '%%Y-%%m') = ?
    """
    params = [month]
    if category_id:
        sql += " AND e.category_id = ?"
        params.append(int(category_id))
    if search:
        search_like = f"%{search}%"
        sql += " AND (e.title LIKE ? OR ec.name LIKE ? OR e.note LIKE ?)"
        params.extend([search_like, search_like, search_like])
    sql += " ORDER BY e.expense_date DESC, e.id DESC"

    expenses = query_db(sql, params)
    for ex in expenses:
        ex['category_display'] = f"{ex['category_icon']} {ex['category_name']}"

    columns = [
        {'header': 'Expense ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Expense Date', 'key': 'expense_date', 'align': 'center', 'format': 'date'},
        {'header': 'Category', 'key': 'category_display', 'align': 'left', 'format': 'text'},
        {'header': 'Title / Description', 'key': 'title', 'align': 'left', 'format': 'text'},
        {'header': 'Amount Spent', 'key': 'amount', 'align': 'right', 'format': 'currency'},
        {'header': 'Category Budget', 'key': 'category_budget', 'align': 'right', 'format': 'currency'},
        {'header': 'Remarks / Notes', 'key': 'note', 'align': 'left', 'format': 'text'}
    ]

    buffer = build_excel_workbook(
        title=f"Expenses Log — {month}",
        columns=columns,
        rows=expenses,
        total_columns={'amount': 'sum'},
        filter_description=f"Month: {month}" + (f" | Search: '{search}'" if search else "")
    )
    return make_excel_response(buffer, "expenses_export.xlsx")

# 6. Staff & Users Export (NEVER export passwords or sensitive auth data)
@excel_bp.route('/users', methods=['GET'])
@admin_required
def export_users():
    users = query_db("SELECT id, username, role, created_at FROM users ORDER BY id ASC")
    for u in users:
        u['role_title'] = u['role'].capitalize()

    columns = [
        {'header': 'User ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Username', 'key': 'username', 'align': 'left', 'format': 'text'},
        {'header': 'Assigned Role', 'key': 'role_title', 'align': 'center', 'format': 'text'},
        {'header': 'Account Created', 'key': 'created_at', 'align': 'center', 'format': 'date'}
    ]

    buffer = build_excel_workbook(
        title="Staff and System Users",
        columns=columns,
        rows=users
    )
    return make_excel_response(buffer, "users_export.xlsx")

# 7. Stock Records Export
@excel_bp.route('/stock', methods=['GET'])
@login_required
def export_stock():
    category = request.args.get('category', '').strip()
    brand = request.args.get('brand', '').strip()
    status_filter = request.args.get('status', '1')

    sql = """
        SELECT id, name, category, brand, size, color, price, stock,
               (price * stock) as inventory_value,
               CASE WHEN stock < 15 THEN 'Low Stock' ELSE 'Normal' END as stock_status
        FROM products
        WHERE 1=1
    """
    params = []
    if status_filter != 'all':
        sql += " AND status = ?"
        params.append(int(status_filter))
    if category:
        sql += " AND LOWER(category) = LOWER(?)"
        params.append(category)
    if brand:
        sql += " AND LOWER(brand) = LOWER(?)"
        params.append(brand)
    sql += " ORDER BY stock ASC, name ASC"

    products = query_db(sql, params)

    columns = [
        {'header': 'Product ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Product Name', 'key': 'name', 'align': 'left', 'format': 'text'},
        {'header': 'Category', 'key': 'category', 'align': 'left', 'format': 'text'},
        {'header': 'Brand', 'key': 'brand', 'align': 'left', 'format': 'text'},
        {'header': 'Size', 'key': 'size', 'align': 'center', 'format': 'text'},
        {'header': 'Color', 'key': 'color', 'align': 'center', 'format': 'text'},
        {'header': 'Unit Price', 'key': 'price', 'align': 'right', 'format': 'currency'},
        {'header': 'Current Stock', 'key': 'stock', 'align': 'right', 'format': 'number'},
        {'header': 'Total Inventory Value', 'key': 'inventory_value', 'align': 'right', 'format': 'currency'},
        {'header': 'Stock Health', 'key': 'stock_status', 'align': 'center', 'format': 'text'}
    ]

    buffer = build_excel_workbook(
        title="Product Stock Report",
        columns=columns,
        rows=products,
        total_columns={'stock': 'sum', 'inventory_value': 'sum'},
        filter_description=f"Category: {category}" if category else None
    )
    return make_excel_response(buffer, "stock_export.xlsx")

# 8. Product Categories Export
@excel_bp.route('/categories', methods=['GET'])
@login_required
def export_categories():
    categories = query_db("""
        SELECT category, 
               COUNT(*) as product_count,
               SUM(stock) as total_units,
               SUM(price * stock) as total_value
        FROM products
        WHERE status = 1 AND category IS NOT NULL AND TRIM(category) != ''
        GROUP BY category
        ORDER BY category ASC
    """)

    columns = [
        {'header': 'Category Name', 'key': 'category', 'align': 'left', 'format': 'text'},
        {'header': 'Active Products', 'key': 'product_count', 'align': 'right', 'format': 'number'},
        {'header': 'Total Stock Units', 'key': 'total_units', 'align': 'right', 'format': 'number'},
        {'header': 'Total Stock Value', 'key': 'total_value', 'align': 'right', 'format': 'currency'}
    ]

    buffer = build_excel_workbook(
        title="Product Categories Summary",
        columns=columns,
        rows=categories,
        total_columns={'product_count': 'sum', 'total_units': 'sum', 'total_value': 'sum'}
    )
    return make_excel_response(buffer, "product_categories_export.xlsx")

# 9. Product Brands Export
@excel_bp.route('/brands', methods=['GET'])
@login_required
def export_brands():
    brands = query_db("""
        SELECT brand, 
               COUNT(*) as product_count,
               SUM(stock) as total_units,
               SUM(price * stock) as total_value
        FROM products
        WHERE status = 1 AND brand IS NOT NULL AND TRIM(brand) != ''
        GROUP BY brand
        ORDER BY brand ASC
    """)

    columns = [
        {'header': 'Brand Name', 'key': 'brand', 'align': 'left', 'format': 'text'},
        {'header': 'Active Products', 'key': 'product_count', 'align': 'right', 'format': 'number'},
        {'header': 'Total Stock Units', 'key': 'total_units', 'align': 'right', 'format': 'number'},
        {'header': 'Total Stock Value', 'key': 'total_value', 'align': 'right', 'format': 'currency'}
    ]

    buffer = build_excel_workbook(
        title="Product Brands Summary",
        columns=columns,
        rows=brands,
        total_columns={'product_count': 'sum', 'total_units': 'sum', 'total_value': 'sum'}
    )
    return make_excel_response(buffer, "product_brands_export.xlsx")

# 10. Expense Categories Export
@excel_bp.route('/expense-categories', methods=['GET'])
@login_required
def export_expense_categories():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    categories = query_db("""
        SELECT ec.id, ec.name, ec.icon, ec.budget,
               COALESCE(SUM(e.amount), 0) as spent_this_month,
               (ec.budget - COALESCE(SUM(e.amount), 0)) as remaining,
               COUNT(e.id) as expense_count
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id AND DATE_FORMAT(e.expense_date, '%%Y-%%m') = ?
        GROUP BY ec.id
        ORDER BY ec.name ASC
    """, (month,))

    for c in categories:
        c['name_with_icon'] = f"{c['icon']} {c['name']}"
        spent = c['spent_this_month']
        bud = c['budget']
        if bud <= 0:
            c['status'] = 'No Budget'
        elif spent <= bud * 0.8:
            c['status'] = 'Under Budget'
        elif spent <= bud:
            c['status'] = 'Near Budget'
        else:
            c['status'] = 'Over Budget'

    columns = [
        {'header': 'Category ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Category', 'key': 'name_with_icon', 'align': 'left', 'format': 'text'},
        {'header': 'Monthly Budget', 'key': 'budget', 'align': 'right', 'format': 'currency'},
        {'header': 'Spent This Month', 'key': 'spent_this_month', 'align': 'right', 'format': 'currency'},
        {'header': 'Remaining Balance', 'key': 'remaining', 'align': 'right', 'format': 'currency'},
        {'header': 'Total Expenses Logged', 'key': 'expense_count', 'align': 'right', 'format': 'number'},
        {'header': 'Budget Status', 'key': 'status', 'align': 'center', 'format': 'text'}
    ]

    buffer = build_excel_workbook(
        title=f"Expense Categories — {month}",
        columns=columns,
        rows=categories,
        total_columns={'budget': 'sum', 'spent_this_month': 'sum', 'remaining': 'sum', 'expense_count': 'sum'}
    )
    return make_excel_response(buffer, "expense_categories_export.xlsx")

# 11. Budget Records Export
@excel_bp.route('/budgets', methods=['GET'])
@login_required
def export_budgets():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    categories = query_db("""
        SELECT ec.id, ec.name, ec.icon, ec.budget,
               COALESCE(SUM(e.amount), 0) as spent,
               (ec.budget - COALESCE(SUM(e.amount), 0)) as variance
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id AND DATE_FORMAT(e.expense_date, '%%Y-%%m') = ?
        GROUP BY ec.id
        ORDER BY ec.budget DESC
    """, (month,))

    for c in categories:
        c['category'] = f"{c['icon']} {c['name']}"
        b = c['budget']
        s = c['spent']
        c['utilization'] = f"{round((s / b) * 100)}%" if b > 0 else 'N/A'

    columns = [
        {'header': 'Category ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Expense Category', 'key': 'category', 'align': 'left', 'format': 'text'},
        {'header': 'Allocated Budget', 'key': 'budget', 'align': 'right', 'format': 'currency'},
        {'header': 'Actual Spent', 'key': 'spent', 'align': 'right', 'format': 'currency'},
        {'header': 'Variance / Remaining', 'key': 'variance', 'align': 'right', 'format': 'currency'},
        {'header': 'Budget Utilization', 'key': 'utilization', 'align': 'center', 'format': 'text'}
    ]

    buffer = build_excel_workbook(
        title=f"Monthly Budget Plan — {month}",
        columns=columns,
        rows=categories,
        total_columns={'budget': 'sum', 'spent': 'sum', 'variance': 'sum'}
    )
    return make_excel_response(buffer, "budgets_export.xlsx")

# 12. Daily Report Export
@excel_bp.route('/daily-report', methods=['GET'])
@login_required
def export_daily_report():
    date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    sales = query_db("""
        SELECT s.id, s.sale_date, s.total_amount,
               COALESCE(c.name, 'Walk-in') as customer_name,
               c.phone as customer_phone,
               (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE date(s.sale_date) = ?
        ORDER BY s.sale_date DESC
    """, (date_str,))

    columns = [
        {'header': 'Bill ID', 'key': 'id', 'align': 'center', 'format': 'number'},
        {'header': 'Bill Time', 'key': 'sale_date', 'align': 'center', 'format': 'date'},
        {'header': 'Customer Name', 'key': 'customer_name', 'align': 'left', 'format': 'text'},
        {'header': 'Phone Number', 'key': 'customer_phone', 'align': 'left', 'format': 'text'},
        {'header': 'Items Sold', 'key': 'item_count', 'align': 'right', 'format': 'number'},
        {'header': 'Bill Amount', 'key': 'total_amount', 'align': 'right', 'format': 'currency'}
    ]

    buffer = build_excel_workbook(
        title=f"Daily Sales Report — {date_str}",
        columns=columns,
        rows=sales,
        total_columns={'total_amount': 'sum', 'item_count': 'sum'},
        filter_description=f"Date: {date_str}"
    )
    return make_excel_response(buffer, f"daily_report_{date_str}.xlsx")

# 13. Monthly Report Export
@excel_bp.route('/monthly-report', methods=['GET'])
@login_required
def export_monthly_report():
    now = datetime.now()
    year = int(request.args.get('year', now.year))
    month = int(request.args.get('month', now.month))
    month_str = f"{year:04d}-{month:02d}"

    breakdown = query_db("""
        SELECT date(sale_date) as date, 
               COUNT(*) as bill_count,
               SUM(total_amount) as total
        FROM sales
        WHERE DATE_FORMAT(sale_date, '%%Y-%%m')= ?
        GROUP BY date(sale_date)
        ORDER BY date(sale_date) ASC
    """, (month_str,))

    columns = [
        {'header': 'Sales Date', 'key': 'date', 'align': 'center', 'format': 'date'},
        {'header': 'Total Bills Generated', 'key': 'bill_count', 'align': 'right', 'format': 'number'},
        {'header': 'Daily Sales Total', 'key': 'total', 'align': 'right', 'format': 'currency'}
    ]

    buffer = build_excel_workbook(
        title=f"Monthly Sales Report — {month_str}",
        columns=columns,
        rows=breakdown,
        total_columns={'bill_count': 'sum', 'total': 'sum'},
        filter_description=f"Month: {month_str}"
    )
    return make_excel_response(buffer, f"monthly_report_{month_str}.xlsx")
