from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db, query_db, execute_db
from auth_utils import login_required, admin_required

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('', methods=['GET'])
@login_required
def list_sales():
    search = request.args.get('search', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()

    sql = """
        SELECT s.id, s.sale_date, s.total_amount, 
               COALESCE(c.name, 'Walk-in') as customer_name,
               c.phone as customer_phone,
               c.email as customer_email,
               (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE 1=1
    """
    params = []

    if search:
        if search.isdigit():
            sql += " AND (s.id = ? OR c.name LIKE ? OR c.phone LIKE ?)"
            params.extend([int(search), f"%{search}%", f"%{search}%"])
        else:
            search_like = f"%{search}%"
            sql += " AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)"
            params.extend([search_like, search_like, search_like])

    if start_date:
        sql += " AND date(s.sale_date) >= ?"
        params.append(start_date)

    if end_date:
        sql += " AND date(s.sale_date) <= ?"
        params.append(end_date)

    sql += " ORDER BY s.sale_date DESC, s.id DESC"
    sales = query_db(sql, params)
    return jsonify({'success': True, 'data': sales, 'count': len(sales)})

@sales_bp.route('/<int:sale_id>', methods=['GET'])
@login_required
def get_sale(sale_id):
    sale = query_db("""
        SELECT s.*, 
               COALESCE(c.name, 'Walk-in') as customer_name,
               c.phone as customer_phone,
               c.email as customer_email
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
    """, (sale_id,), one=True)

    if not sale:
        return jsonify({'success': False, 'message': 'Sale record not found.'}), 404

    items = query_db("""
        SELECT si.*, p.name as product_name, p.category, p.brand, p.size, p.color,
               (si.quantity * si.unit_price) as line_total
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
    """, (sale_id,))

    return jsonify({
        'success': True,
        'data': {
            'sale': sale,
            'items': items
        }
    })

@sales_bp.route('', methods=['POST'])
@login_required
def create_sale():
    data = request.get_json(silent=True) or request.form.to_dict()
    items = data.get('items', [])
    customer_id = data.get('customer_id')
    customer_name = (data.get('customer_name') or '').strip()
    customer_phone = (data.get('customer_phone') or '').strip()
    customer_email = (data.get('customer_email') or '').strip()

    if not items or len(items) == 0:
        return jsonify({'success': False, 'message': 'Bill must contain at least one item.'}), 400

    db = get_db()
    try:
        # 1. Handle Customer
        if not customer_id and (customer_name or customer_phone or customer_email):
            # Check if customer already exists by phone or name
            existing_c = None
            if customer_phone:
                cur = db.execute("SELECT id FROM customers WHERE phone = ?", (customer_phone,))
                existing_c = cur.fetchone()
                cur.close()

            if existing_c:
                customer_id = existing_c['id']
            else:
                cur = db.execute(
                    "INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)",
                    (customer_name or 'Walk-in Customer', customer_phone, customer_email)
                )
                customer_id = cur.lastrowid
                cur.close()

        # 2. Validate Items and Check Stock
        grand_total = 0.0
        validated_items = []

        for it in items:
            try:
                pid = int(it.get('product_id', 0))
                qty = int(it.get('quantity', 0))
                prc = float(it.get('unit_price', it.get('price', 0)))
            except (ValueError, TypeError):
                return jsonify({'success': False, 'message': 'Invalid product or quantity input.'}), 400

            if pid <= 0 or qty <= 0 or prc < 0:
                return jsonify({'success': False, 'message': 'Product ID and quantity must be positive, price non-negative.'}), 400

            # Lock and check current product stock
            cur = db.execute("SELECT id, name, stock, price FROM products WHERE id = ?", (pid,))
            prod = cur.fetchone()
            cur.close()

            if not prod:
                return jsonify({'success': False, 'message': f'Product with ID {pid} does not exist.'}), 404

            if prod['stock'] < qty:
                return jsonify({
                    'success': False,
                    'message': f'Insufficient stock for "{prod["name"]}". Available: {prod["stock"]}, Requested: {qty}.'
                }), 400

            line_total = qty * prc
            grand_total += line_total
            validated_items.append({
                'product_id': pid,
                'name': prod['name'],
                'quantity': qty,
                'unit_price': prc,
                'line_total': line_total,
                'current_stock': prod['stock']
            })

        if grand_total <= 0:
            return jsonify({'success': False, 'message': 'Total amount cannot be zero.'}), 400

        # 3. Perform Transaction (Atomic)
        # SQLite transaction begins automatically on first execute
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Insert sale
        cur_sale = db.execute(
            "INSERT INTO sales (customer_id, sale_date, total_amount) VALUES (?, ?, ?)",
            (customer_id, now_str, grand_total)
        )
        sale_id = cur_sale.lastrowid
        cur_sale.close()

        # Insert sale items and deduct stock
        for v in validated_items:
            db.execute(
                "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                (sale_id, v['product_id'], v['quantity'], v['unit_price'])
            )
            # Deduct stock
            db.execute(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                (v['quantity'], v['product_id'])
            )

        db.commit()

        return jsonify({
            'success': True,
            'message': 'Sale completed and stock deducted successfully.',
            'sale_id': sale_id,
            'total_amount': grand_total
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': f'Transaction failed: {str(e)}'}), 500

@sales_bp.route('/items', methods=['GET'])
@login_required
def list_sale_items():
    search = request.args.get('search', '').strip()
    sql = """
        SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price,
               (si.quantity * si.unit_price) as line_total,
               s.sale_date,
               p.name as product_name, p.category, p.brand,
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
    return jsonify({'success': True, 'data': items, 'count': len(items)})

@sales_bp.route('/<int:sale_id>', methods=['DELETE'])
@admin_required
def delete_sale(sale_id):
    db = get_db()
    # Check if sale exists
    sale = query_db("SELECT id FROM sales WHERE id = ?", (sale_id,), one=True)
    if not sale:
        return jsonify({'success': False, 'message': 'Sale not found.'}), 404

    # Sale items will be cascaded by foreign key
    db.execute("DELETE FROM sales WHERE id = ?", (sale_id,))
    db.commit()
    return jsonify({'success': True, 'message': 'Sale record deleted successfully.'})
