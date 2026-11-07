"""Create the MySQL schema and seed the initial admin/categories once."""
import os
from werkzeug.security import generate_password_hash
from config import Config
from database import get_direct_db_conn

SCHEMA = [
"""CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(191) NOT NULL UNIQUE,
 password VARCHAR(255) NOT NULL, role VARCHAR(30) DEFAULT 'staff',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
"""CREATE TABLE IF NOT EXISTS customers (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), phone VARCHAR(50), email VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
"""CREATE TABLE IF NOT EXISTS products (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, category VARCHAR(191),
 brand VARCHAR(191), size VARCHAR(100), color VARCHAR(100), image TEXT, publish_image TEXT,
 price DECIMAL(12,2) NOT NULL, stock INT NOT NULL DEFAULT 0, status TINYINT DEFAULT 1,
 publish_status TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
"""CREATE TABLE IF NOT EXISTS sales (
 id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NULL, sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
 total_amount DECIMAL(12,2) NOT NULL,
 CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
"""CREATE TABLE IF NOT EXISTS sale_items (
 id INT AUTO_INCREMENT PRIMARY KEY, sale_id INT NOT NULL, product_id INT NOT NULL,
 quantity INT NOT NULL, unit_price DECIMAL(12,2) NOT NULL,
 CONSTRAINT fk_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
 CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
"""CREATE TABLE IF NOT EXISTS expense_categories (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(191) NOT NULL, icon VARCHAR(50) DEFAULT '💰',
 budget DECIMAL(12,2) DEFAULT 0.00, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
"""CREATE TABLE IF NOT EXISTS expenses (
 id INT AUTO_INCREMENT PRIMARY KEY, category_id INT NOT NULL, title VARCHAR(255) NOT NULL,
 amount DECIMAL(12,2) NOT NULL, note TEXT, expense_date DATE NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"""
]

def init_db():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    db = get_direct_db_conn()
    try:
        for statement in SCHEMA:
            db.execute(statement).close()
        db.commit()
        # Create initial admin only if users table is empty.
        count = db.execute("SELECT COUNT(*) AS total FROM users").fetchone()['total']
        if count == 0:
            db.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                       ('admin', generate_password_hash('admin123'), 'admin')).close()
            db.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                       ('staff', generate_password_hash('staff123'), 'staff')).close()
        defaults = [
            ('Rent','🏠',15000), ('Electricity','💡',3000), ('Salaries','👷',20000),
            ('Inventory','📦',50000), ('Marketing','📢',5000), ('Maintenance','🔧',2000),
            ('Packaging','🛍️',3000), ('Transport','🚚',4000), ('Miscellaneous','🗂️',2000)
        ]
        for name, icon, budget in defaults:
            db.execute("INSERT INTO expense_categories (name, icon, budget) SELECT %s, %s, %s WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = %s)",
                       (name, icon, budget, name)).close()
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    init_db()
    print('MySQL schema initialized.')
