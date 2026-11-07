import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from database import close_db
from init_db import init_db

# Route blueprints
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.product_routes import product_bp
from routes.customer_routes import customer_bp
from routes.sales_routes import sales_bp
from routes.expense_routes import expense_bp
from routes.report_routes import report_bp
from routes.excel_routes import excel_bp

def create_app():
    dist_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    app = Flask(__name__, static_folder=dist_folder)
    app.config.from_object(Config)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/uploads/*": {"origins": "*"}})

    # Teardown database connections
    app.teardown_appcontext(close_db)

    # Initialize MySQL schema
    with app.app_context():
        init_db()

    # Serve uploaded images statically
    @app.route('/uploads/products/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'Retail Shop Management System API',
            'database': 'MySQL'
        })

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(product_bp, url_prefix='/api/products')
    app.register_blueprint(customer_bp, url_prefix='/api/customers')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(expense_bp, url_prefix='/api/expenses')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    app.register_blueprint(excel_bp, url_prefix='/api/export')

    # Serve Frontend Single Page Application (SPA)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/') or path.startswith('uploads/'):
            return jsonify({'success': False, 'message': 'API endpoint not found.'}), 404
        if os.path.exists(dist_folder):
            target_file = os.path.join(dist_folder, path)
            if path != "" and os.path.exists(target_file):
                return send_from_directory(dist_folder, path)
            return send_from_directory(dist_folder, 'index.html')
        return jsonify({
            'service': 'Retail Shop Management Backend API',
            'status': 'running',
            'note': 'Frontend dist directory not found. Run "npm run build" in frontend folder.'
        })

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Resource not found.'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error occurred.'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Retail Shop Backend running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
