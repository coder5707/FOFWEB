from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash
from database import get_db, query_db, execute_db
from auth_utils import (
    generate_token,
    verify_and_upgrade_password,
    login_required,
    admin_required
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or request.form.to_dict()
    login_type = data.get('login_type', 'admin')

    # If login_type is customer/user, no credentials required (matches original PHP login logic)
    if login_type == 'user':
        return jsonify({
            'success': True,
            'message': 'Logged in as Customer',
            'role': 'customer',
            'user': {'username': 'Customer', 'role': 'customer'}
        })

    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Enter username and password.'}), 400

    db = get_db()
    cur = db.execute("SELECT id, username, password, role FROM users WHERE username = ?", (username,))
    user = cur.fetchone()
    cur.close()

    if not user:
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

    user_dict = dict(user)
    if not verify_and_upgrade_password(db, user_dict, password):
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

    token = generate_token(user_dict)
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user_dict['id'],
            'username': user_dict['username'],
            'role': user_dict['role']
        }
    })

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'success': True,
        'user': g.current_user
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

# --- User Management (Admin Only) ---
@auth_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    users = query_db("SELECT id, username, role, created_at FROM users ORDER BY id ASC")
    return jsonify({'success': True, 'data': users})

@auth_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json(silent=True) or request.form.to_dict()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    role = data.get('role', 'staff')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    if role not in ('admin', 'staff'):
        return jsonify({'success': False, 'message': 'Invalid role. Must be admin or staff.'}), 400

    db = get_db()
    cur = db.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cur.fetchone():
        cur.close()
        return jsonify({'success': False, 'message': f'Username "{username}" is already taken.'}), 400
    cur.close()

    pw_hash = generate_password_hash(password)
    res = execute_db("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", (username, pw_hash, role))
    return jsonify({'success': True, 'message': 'User created successfully.', 'id': res['lastrowid']}), 201

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    data = request.get_json(silent=True) or request.form.to_dict()
    role = data.get('role')
    password = (data.get('password') or '').strip()

    db = get_db()
    cur = db.execute("SELECT id, username FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()
    cur.close()

    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    updates = []
    params = []
    if role and role in ('admin', 'staff'):
        updates.append("role = ?")
        params.append(role)
    if password:
        updates.append("password = ?")
        params.append(generate_password_hash(password))

    if updates:
        params.append(user_id)
        sql = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        execute_db(sql, params)

    return jsonify({'success': True, 'message': 'User updated successfully.'})

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    if g.current_user['id'] == user_id:
        return jsonify({'success': False, 'message': 'You cannot delete your own account.'}), 400

    res = execute_db("DELETE FROM users WHERE id = ?", (user_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    return jsonify({'success': True, 'message': 'User deleted successfully.'})
