from flask import Blueprint, request, jsonify
from database import query_db, execute_db
from auth_utils import login_required

customer_bp = Blueprint('customers', __name__)

@customer_bp.route('', methods=['GET'])
@login_required
def list_customers():
    search = request.args.get('search', '').strip()
    sql = """
        SELECT c.*, 
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
    return jsonify({'success': True, 'data': customers, 'count': len(customers)})

@customer_bp.route('/<int:customer_id>', methods=['GET'])
@login_required
def get_customer(customer_id):
    customer = query_db("SELECT * FROM customers WHERE id = ?", (customer_id,), one=True)
    if not customer:
        return jsonify({'success': False, 'message': 'Customer not found.'}), 404

    # Fetch purchases
    purchases = query_db("""
        SELECT id, sale_date, total_amount 
        FROM sales 
        WHERE customer_id = ? 
        ORDER BY sale_date DESC
    """, (customer_id,))

    return jsonify({
        'success': True,
        'data': customer,
        'purchases': purchases
    })

@customer_bp.route('', methods=['POST'])
@login_required
def add_customer():
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Customer name is required.'}), 400

    res = execute_db("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)", (name, phone, email))
    return jsonify({
        'success': True,
        'message': 'Customer added successfully.',
        'id': res['lastrowid']
    }), 201

@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@login_required
def update_customer(customer_id):
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Customer name is required.'}), 400

    res = execute_db("UPDATE customers SET name=?, phone=?, email=? WHERE id=?", (name, phone, email, customer_id))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Customer not found.'}), 404

    return jsonify({'success': True, 'message': 'Customer updated successfully.'})

@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
@login_required
def delete_customer(customer_id):
    res = execute_db("DELETE FROM customers WHERE id=?", (customer_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Customer not found.'}), 404
    return jsonify({'success': True, 'message': 'Customer deleted successfully.'})
