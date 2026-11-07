-- ==============================
-- CREATE DATABASE
-- ==============================
CREATE DATABASE IF NOT EXISTS retail_shop;
USE retail_shop;

-- ==============================
-- USERS TABLE (ADMIN / STAFF)
-- ==============================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEFAULT ADMIN ACCOUNT
INSERT INTO users (username, password, role)
VALUES ('admin', MD5('admin123'), 'admin');

-- ==============================
-- PRODUCTS TABLE
-- ==============================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    brand VARCHAR(50),
    size VARCHAR(20),
    color VARCHAR(30),

    image VARCHAR(255),              -- product image
    publish_image VARCHAR(255),      -- published image for customer page

    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,

    status TINYINT(1) DEFAULT 1,     -- 1 = active, 0 = deleted
    publish_status TINYINT(1) DEFAULT 0, -- 1 = published to customer

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- CUSTOMERS TABLE
-- ==============================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- SALES (BILL MASTER)
-- ==============================
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL
);

-- ==============================
-- SALE ITEMS (BILL DETAILS)
-- ==============================
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
);

