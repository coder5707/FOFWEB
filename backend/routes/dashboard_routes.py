from datetime import datetime
from flask import Blueprint, jsonify, g
from database import get_db, query_db, execute_db
from auth_utils import login_required, admin_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/metrics', methods=['GET'])
@login_required
def get_metrics():
    # Product count and total stock (active products)
    prod_row = query_db("""
        SELECT COUNT(*) as count, COALESCE(SUM(stock), 0) as total_stock 
        FROM products WHERE status = 1
    """, one=True)
    total_products = prod_row['count'] if prod_row else 0
    total_stock = prod_row['total_stock'] if prod_row else 0

    # Today's sales
    today = datetime.now().strftime('%Y-%m-%d')
    today_row = query_db("""
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM sales WHERE date(sale_date) = ?
    """, (today,), one=True)
    today_sales = float(today_row['total']) if today_row else 0.0

    # Total bill count
    sales_cnt_row = query_db("SELECT COUNT(*) as count FROM sales", one=True)
    total_sales_count = sales_cnt_row['count'] if sales_cnt_row else 0

    # Gauge calculation (max capacity = 5000)
    max_capacity = 5000
    stock_percent = min(100, round((total_stock / max_capacity) * 100)) if total_stock > 0 else 0

    # Expense summary for current month
    current_month = datetime.now().strftime('%Y-%m')
    current_month_name = datetime.now().strftime('%B %Y')

    spent_row = query_db("""
        SELECT COALESCE(SUM(amount), 0) as spent 
        FROM expenses 
        WHERE DATE_FORMAT(expense_date, '%%Y-%%m') = ?
    """, (current_month,), one=True)
    exp_spent = float(spent_row['spent']) if spent_row else 0.0

    budget_row = query_db("SELECT COALESCE(SUM(budget), 0) as total_budget FROM expense_categories", one=True)
    exp_budget = float(budget_row['total_budget']) if budget_row else 0.0

    exp_pct = min(100, round((exp_spent / exp_budget) * 100)) if exp_budget > 0 else 0
    if exp_pct <= 80:
        exp_emoji = '😊'
        exp_color = '#27ae60'
        exp_label = 'Good'
    elif exp_pct <= 100:
        exp_emoji = '😐'
        exp_color = '#f39c12'
        exp_label = 'Warning'
    else:
        exp_emoji = '😟'
        exp_color = '#e74c3c'
        exp_label = 'Overspent'

    # Low stock items (< 15 units)
    low_stock_items = query_db("""
        SELECT id, name, category, brand, stock, price 
        FROM products 
        WHERE status = 1 AND stock < 15 
        ORDER BY stock ASC 
        LIMIT 5
    """)

    # Recent 5 sales
    recent_sales = query_db("""
        SELECT s.id, s.sale_date, s.total_amount, COALESCE(c.name, 'Walk-in') as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.sale_date DESC
        LIMIT 5
    """)

    return jsonify({
        'success': True,
        'metrics': {
            'total_products': total_products,
            'total_stock': total_stock,
            'today_sales': today_sales,
            'total_sales_count': total_sales_count,
            'stock_percent': stock_percent,
            'max_capacity': max_capacity,
            'expenses': {
                'month': current_month_name,
                'spent': exp_spent,
                'budget': exp_budget,
                'percent': exp_pct,
                'emoji': exp_emoji,
                'color': exp_color,
                'label': exp_label
            },
            'low_stock_items': low_stock_items,
            'recent_sales': recent_sales
        }
    })

@dashboard_bp.route('/clear-all', methods=['POST'])
@admin_required
def clear_all_data():
    db = get_db()
    # Disable foreign keys temporarily to truncate tables cleanly
    db.execute("SET FOREIGN_KEY_CHECKS = 0;")
    db.execute("DELETE FROM sale_items;")
    db.execute("DELETE FROM sales;")
    db.execute("DELETE FROM customers;")
    db.execute("DELETE FROM products;")
    # Reset autoincrement sequences
    db.execute("ALTER TABLE sale_items AUTO_INCREMENT = 1;")
    db.execute("ALTER TABLE sales AUTO_INCREMENT = 1;")
    db.execute("ALTER TABLE customers AUTO_INCREMENT = 1;")
    db.execute("ALTER TABLE products AUTO_INCREMENT = 1;")
    db.execute("SET FOREIGN_KEY_CHECKS = 1;")
    db.commit()
    return jsonify({'success': True, 'message': 'All transaction, product, and customer data cleared successfully!'})
