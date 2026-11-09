from datetime import datetime
from flask import Blueprint, request, jsonify
from database import query_db
from auth_utils import login_required

report_bp = Blueprint('reports', __name__)

@report_bp.route('/daily', methods=['GET'])
@login_required
def daily_report():
    date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))

    sales = query_db("""
        SELECT s.id, s.sale_date, s.total_amount, 
               COALESCE(c.name, 'Walk-in') as customer_name,
               c.phone as customer_phone
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE date(s.sale_date) = ?
        ORDER BY s.sale_date DESC
    """, (date_str,))

    total_row = query_db("""
        SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
        FROM sales 
        WHERE date(sale_date) = ?
    """, (date_str,), one=True)

    day_total = float(total_row['total']) if total_row else 0.0
    bill_count = int(total_row['count']) if total_row else 0

    return jsonify({
        'success': True,
        'date': date_str,
        'sales': sales,
        'day_total': day_total,
        'bill_count': bill_count
    })

@report_bp.route('/monthly', methods=['GET'])
@login_required
def monthly_report():
    now = datetime.now()
    year = int(request.args.get('year', now.year))
    month = int(request.args.get('month', now.month))
    month_str = f"{year:04d}-{month:02d}"

    # Group by date
    daily_breakdown = query_db("""
        SELECT date(sale_date) as date, 
               SUM(total_amount) as total,
               COUNT(*) as bill_count
        FROM sales
        WHERE DATE_FORMAT(sale_date, '%Y-%m') = ?
        GROUP BY date(sale_date)
        ORDER BY date(sale_date) ASC
    """, (month_str,))

    total_row = query_db("""
        SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
        FROM sales
        WHERE DATE_FORMAT(sale_date, '%Y-%m') = ?
    """, (month_str,), one=True)

    month_total = float(total_row['total']) if total_row else 0.0
    total_bills = int(total_row['count']) if total_row else 0

    return jsonify({
        'success': True,
        'year': year,
        'month': month,
        'month_str': month_str,
        'daily_breakdown': daily_breakdown,
        'month_total': month_total,
        'total_bills': total_bills
    })

@report_bp.route('/stock', methods=['GET'])
@login_required
def stock_report():
    category = request.args.get('category', '').strip()
    brand = request.args.get('brand', '').strip()
    status_filter = request.args.get('status', '1')

    sql = """
        SELECT id, name, category, brand, size, color, price, stock,
               (price * stock) as inventory_value,
               status, publish_status
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

    total_units = sum(p['stock'] for p in products)
    total_value = sum(p['inventory_value'] for p in products)
    low_stock_count = sum(1 for p in products if p['stock'] < 15)

    return jsonify({
        'success': True,
        'products': products,
        'summary': {
            'total_items': len(products),
            'total_units': total_units,
            'total_inventory_value': total_value,
            'low_stock_count': low_stock_count
        }
    })
