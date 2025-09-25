-- POS Database Schema
-- Run this script in MySQL 8.0+ to create the database and all tables

-- 1) Create database and select it
CREATE DATABASE IF NOT EXISTS POS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE POS;

-- Use InnoDB for FK support
SET default_storage_engine=INNODB;

-- 2) Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(100),
  service_types JSON,
  created_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  billing_address_street VARCHAR(255),
  billing_address_city VARCHAR(100),
  billing_address_state VARCHAR(100),
  billing_address_zip_code VARCHAR(20),
  billing_address_country VARCHAR(100),
  customer_type ENUM('standard','reseller') DEFAULT 'standard',
  created_at DATETIME,
  last_order_date DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Accounts (products)
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(40) PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  label VARCHAR(100),
  email VARCHAR(100),
  renewal_status VARCHAR(20),
  days_until_renewal INT,
  cost DECIMAL(10,2),
  description TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  service_type VARCHAR(50),
  subscription_type VARCHAR(50),
  renewal_date DATE,
  category_id VARCHAR(40),
  brand VARCHAR(100),
  max_user_slots INT DEFAULT 1,
  available_slots INT DEFAULT 0,
  current_users INT DEFAULT 0,
  cost_per_additional_user DECIMAL(10,2) NULL,
  is_shared_account BOOLEAN DEFAULT FALSE,
  family_features JSON,
  usage_restrictions JSON,
  primary_holder_name VARCHAR(100),
  primary_holder_email VARCHAR(100),
  primary_holder_phone VARCHAR(20),
  CONSTRAINT fk_accounts_category
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_category ON accounts(category_id);

-- 5) Sales
-- NOTE: id is AUTO_INCREMENT INT because app expects insertId
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  customer_id VARCHAR(40),
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_type VARCHAR(20) DEFAULT 'standard',
  items JSON NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  order_date DATETIME,
  end_date DATE,
  days_until_renewal INT,
  created_at DATETIME,
  updated_at DATETIME,
  CONSTRAINT fk_sales_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX uq_sales_order_number ON sales(order_number);
CREATE INDEX idx_sales_customer_email ON sales(customer_email);

-- 6) Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(40) PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  sale_id INT,
  customer_id VARCHAR(40),
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  billing_address TEXT,
  items JSON NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  issue_date DATETIME,
  due_date DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  CONSTRAINT fk_invoices_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_invoices_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX uq_invoices_invoice_number ON invoices(invoice_number);

-- 7) Account Orders (for delivering credentials per sale)
CREATE TABLE IF NOT EXISTS account_orders (
  id VARCHAR(40) PRIMARY KEY,
  sales_id INT NOT NULL,
  account_id VARCHAR(40) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_account_orders_sale
    FOREIGN KEY (sales_id) REFERENCES sales(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_account_orders_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_account_orders_sales_id ON account_orders(sales_id);
CREATE INDEX idx_account_orders_account_id ON account_orders(account_id);

-- 8) Account Credentials (credentials attached to an account_order)
CREATE TABLE IF NOT EXISTS account_credentials (
  id VARCHAR(40) PRIMARY KEY,
  account_order_id VARCHAR(40) NOT NULL,
  username VARCHAR(150),
  password VARCHAR(150),
  login_url VARCHAR(255),
  additional_info TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_credentials_order
    FOREIGN KEY (account_order_id) REFERENCES account_orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_account_credentials_order_id ON account_credentials(account_order_id);
CREATE INDEX idx_account_credentials_active ON account_credentials(is_active);

-- 9) Subscriptions (supporting sample-data.sql)
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(40) PRIMARY KEY,
  customer_id VARCHAR(40),
  account_id VARCHAR(40) NULL,
  customer_name VARCHAR(100),
  product_name VARCHAR(100),
  duration INT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20),
  price DECIMAL(10,2),
  created_at DATETIME,
  CONSTRAINT fk_subscriptions_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10) Transactions (supporting sample-data.sql)
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(40) PRIMARY KEY,
  subscription_id VARCHAR(40),
  customer_id VARCHAR(40) NULL,
  customer_name VARCHAR(100),
  product_name VARCHAR(100),
  date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10,2),
  type VARCHAR(20),
  status VARCHAR(20),
  CONSTRAINT fk_transactions_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_transactions_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Helpful views or constraints can be added here as needed.
-- End of schema
