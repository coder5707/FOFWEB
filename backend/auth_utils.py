import hashlib
from functools import wraps
from flask import request, jsonify, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from database import get_db

serializer = URLSafeTimedSerializer(Config.SECRET_KEY)

def generate_token(user):
    """Generates a secure token for an authenticated user."""
    payload = {
        'id': user['id'],
        'username': user['username'],
        'role': user['role']
    }
    return serializer.dumps(payload, salt='retail-auth-salt')

def verify_token(token, max_age=86400 * 7):
    """Verifies token and returns user payload or None."""
    try:
        data = serializer.loads(token, salt='retail-auth-salt', max_age=max_age)
        return data
    except (BadSignature, SignatureExpired):
        return None

def verify_and_upgrade_password(db, user, candidate_password):
    """Verifies password against modern hash or legacy MD5, upgrading if needed."""
    stored = user['password']
    # Check modern werkzeug hash
    if stored.startswith('pbkdf2:') or stored.startswith('scrypt:') or stored.startswith('$2b$'):
        return check_password_hash(stored, candidate_password)
    
    # Check legacy MD5 hash (32 hex characters)
    if len(stored) == 32:
        candidate_md5 = hashlib.md5(candidate_password.encode('utf-8')).hexdigest()
        if candidate_md5 == stored:
            # Upgrade password hash in SQLite
            new_hash = generate_password_hash(candidate_password)
            db.execute("UPDATE users SET password = ? WHERE id = ?", (new_hash, user['id']))
            db.commit()
            return True
            
    # Direct check if plaintext was ever saved
    if stored == candidate_password:
        new_hash = generate_password_hash(candidate_password)
        db.execute("UPDATE users SET password = ? WHERE id = ?", (new_hash, user['id']))
        db.commit()
        return True

    return False

def get_current_user_from_request():
    """Extracts bearer token from Authorization header or query param."""
    auth_header = request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    elif 'token' in request.args:
        token = request.args.get('token')

    if not token:
        return None

    payload = verify_token(token)
    if not payload:
        return None

    # Fetch fresh user info from database
    db = get_db()
    cur = db.execute("SELECT id, username, role FROM users WHERE id = ?", (payload['id'],))
    user = cur.fetchone()
    cur.close()
    if user:
        return dict(user)
    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({'success': False, 'message': 'Authentication required. Please log in.'}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({'success': False, 'message': 'Authentication required. Please log in.'}), 401
        if user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Access denied. Administrator privileges required.'}), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function
