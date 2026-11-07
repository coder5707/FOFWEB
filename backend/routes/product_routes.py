import os
import time
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from database import get_db, query_db, execute_db
from auth_utils import login_required, admin_required
from config import Config

product_bp = Blueprint('products', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_uploaded_image(file_storage):
    if not file_storage or not file_storage.filename:
        return None
    if not allowed_file(file_storage.filename):
        return None
    ext = file_storage.filename.rsplit('.', 1)[1].lower()
    clean_base = secure_filename(file_storage.filename.rsplit('.', 1)[0])
    filename = f"{int(time.time())}_{clean_base}.{ext}"
    target_path = os.path.join(Config.UPLOAD_FOLDER, filename)
    file_storage.save(target_path)
    return filename

@product_bp.route('', methods=['GET'])
@login_required
def list_products():
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    brand = request.args.get('brand', '').strip()
    status_filter = request.args.get('status', '1')  # '1', '0', 'all'
    publish_filter = request.args.get('publish_status', 'all')

    sql = "SELECT * FROM products WHERE 1=1"
    params = []

    if status_filter != 'all':
        sql += " AND status = ?"
        params.append(int(status_filter))

    if publish_filter != 'all':
        sql += " AND publish_status = ?"
        params.append(int(publish_filter))

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
    return jsonify({'success': True, 'data': products, 'count': len(products)})

@product_bp.route('/<int:product_id>', methods=['GET'])
@login_required
def get_product(product_id):
    product = query_db("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found.'}), 404
    return jsonify({'success': True, 'data': product})

@product_bp.route('', methods=['POST'])
@login_required
def add_product():
    # Supports JSON and multipart form data
    if request.is_json:
        data = request.get_json()
        image_name = data.get('image')
    else:
        data = request.form.to_dict()
        image_file = request.files.get('image')
        image_name = save_uploaded_image(image_file) if image_file else None

    name = (data.get('name') or '').strip()
    category = (data.get('category') or '').strip()
    brand = (data.get('brand') or '').strip()
    size = (data.get('size') or '').strip()
    color = (data.get('color') or '').strip()
    
    try:
        price = float(data.get('price', 0))
        stock = int(data.get('stock', 0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Price and stock must be valid numbers.'}), 400

    if not name:
        return jsonify({'success': False, 'message': 'Product name is required.'}), 400
    if price < 0:
        return jsonify({'success': False, 'message': 'Price cannot be negative.'}), 400
    if stock < 0:
        return jsonify({'success': False, 'message': 'Stock cannot be negative.'}), 400

    res = execute_db("""
        INSERT INTO products (name, category, brand, size, color, image, price, stock, status, publish_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    """, (name, category, brand, size, color, image_name, price, stock))

    return jsonify({
        'success': True,
        'message': 'Product added successfully.',
        'id': res['lastrowid']
    }), 201

@product_bp.route('/<int:product_id>', methods=['PUT', 'POST'])
@login_required
def update_product(product_id):
    existing = query_db("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Product not found.'}), 404

    if request.is_json:
        data = request.get_json()
        image_name = data.get('image', existing['image'])
    else:
        data = request.form.to_dict()
        image_file = request.files.get('image')
        image_name = save_uploaded_image(image_file) if image_file else existing['image']

    name = (data.get('name') or existing['name']).strip()
    category = data.get('category', existing['category'])
    brand = data.get('brand', existing['brand'])
    size = data.get('size', existing['size'])
    color = data.get('color', existing['color'])

    try:
        price = float(data.get('price', existing['price']))
        stock = int(data.get('stock', existing['stock']))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Price and stock must be numbers.'}), 400

    if not name:
        return jsonify({'success': False, 'message': 'Product name cannot be empty.'}), 400
    if price < 0 or stock < 0:
        return jsonify({'success': False, 'message': 'Price and stock cannot be negative.'}), 400

    execute_db("""
        UPDATE products 
        SET name=?, category=?, brand=?, size=?, color=?, image=?, price=?, stock=? 
        WHERE id=?
    """, (name, category, brand, size, color, image_name, price, stock, product_id))

    return jsonify({'success': True, 'message': 'Product updated successfully.'})

@product_bp.route('/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    # Soft delete (status = 0) matching original PHP logic
    res = execute_db("UPDATE products SET status = 0 WHERE id = ?", (product_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Product not found.'}), 404
    return jsonify({'success': True, 'message': 'Product deleted successfully.'})

@product_bp.route('/<int:product_id>/restore', methods=['POST'])
@login_required
def restore_product(product_id):
    res = execute_db("UPDATE products SET status = 1 WHERE id = ?", (product_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Product not found.'}), 404
    return jsonify({'success': True, 'message': 'Product restored successfully.'})

@product_bp.route('/<int:product_id>/publish', methods=['POST'])
@admin_required
def publish_product(product_id):
    product = query_db("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found.'}), 404

    image_name = product['publish_image']
    if 'publish_image' in request.files:
        uploaded = save_uploaded_image(request.files['publish_image'])
        if uploaded:
            image_name = uploaded

    execute_db("""
        UPDATE products 
        SET publish_status = 1, publish_image = ? 
        WHERE id = ?
    """, (image_name, product_id))

    return jsonify({'success': True, 'message': 'Product published successfully to customer store!'})

@product_bp.route('/<int:product_id>/unpublish', methods=['POST'])
@admin_required
def unpublish_product(product_id):
    res = execute_db("UPDATE products SET publish_status = 0 WHERE id = ?", (product_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Product not found.'}), 404
    return jsonify({'success': True, 'message': 'Product unpublished successfully.'})

@product_bp.route('/categories', methods=['GET'])
@login_required
def get_categories():
    rows = query_db("""
        SELECT DISTINCT category, COUNT(*) as product_count 
        FROM products 
        WHERE status = 1 AND category IS NOT NULL AND TRIM(category) != ''
        GROUP BY category 
        ORDER BY category ASC
    """)
    return jsonify({'success': True, 'data': rows})

@product_bp.route('/brands', methods=['GET'])
@login_required
def get_brands():
    rows = query_db("""
        SELECT DISTINCT brand, COUNT(*) as product_count 
        FROM products 
        WHERE status = 1 AND brand IS NOT NULL AND TRIM(brand) != ''
        GROUP BY brand 
        ORDER BY brand ASC
    """)
    return jsonify({'success': True, 'data': rows})

# Public Customer Storefront API
@product_bp.route('/storefront', methods=['GET'])
def get_storefront_products():
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()

    sql = "SELECT id, name, category, brand, size, color, price, stock, publish_image FROM products WHERE status = 1 AND publish_status = 1"
    params = []

    if category:
        sql += " AND LOWER(category) = LOWER(?)"
        params.append(category)

    if search:
        search_like = f"%{search}%"
        sql += " AND (name LIKE ? OR category LIKE ? OR brand LIKE ?)"
        params.extend([search_like, search_like, search_like])

    sql += " ORDER BY id DESC"
    products = query_db(sql, params)
    return jsonify({'success': True, 'data': products, 'count': len(products)})
