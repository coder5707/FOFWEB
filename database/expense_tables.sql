-- ==============================
-- EXPENSE TRACKER TABLES
-- ==============================
USE retail_shop;

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '💰',
    budget DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Categories
INSERT INTO expense_categories (name, icon, budget) VALUES
('Rent',         '🏠', 15000.00),
('Electricity',  '💡',  3000.00),
('Salaries',     '👷',  20000.00),
('Inventory',    '📦',  50000.00),
('Marketing',    '📢',  5000.00),
('Maintenance',  '🔧',  2000.00),
('Packaging',    '🛍️',  3000.00),
('Transport',    '🚚',  4000.00),
('Miscellaneous','🗂️',  2000.00);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note TEXT,
    expense_date DATE NOT NULL DEFAULT (CURDATE()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE CASCADE
);
