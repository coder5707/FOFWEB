import os
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    BASE_DIR = BASE_DIR
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-secret-key-in-production')
    # Render/MySQL connection settings. Prefer MYSQL_URL; otherwise individual vars.
    MYSQL_URL = os.environ.get('MYSQL_URL')
    MYSQL_HOST = os.environ.get('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', '3306'))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'retail_shop')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'products')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    CORS_HEADERS = 'Content-Type'
