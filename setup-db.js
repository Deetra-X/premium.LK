/**
 * Database initialization script
 * Ensures the database and required tables exist
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// First connection to create the database if it doesn't exist
const bootstrapDB = async () => {
  try {
    console.log('Attempting to connect to MySQL server...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      port: 3306
    });

    console.log('Connected to MySQL server. Checking if POS database exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS POS');
    console.log('Database POS is available.');
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Failed to connect to MySQL server:', error.message);
    return false;
  }
};

// Setup the tables
const setupTables = async () => {
  try {
    console.log('Connecting to POS database...');
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS',
      port: 3306
    });

    console.log('Creating tables if they don\'t exist...');
    
    // Create customers table
    await db.query(`
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
        customer_type ENUM('standard', 'reseller') DEFAULT 'standard',
        created_at DATETIME,
        last_order_date DATETIME
      )
    `);
    console.log('Customers table is ready.');

    // Create product_categories table
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id VARCHAR(40) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(20),
        color VARCHAR(100),
        service_types JSON,
        created_at DATETIME,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('Product categories table is ready.');

    // Create accounts table
    await db.query(`
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
        is_shared_account BOOLEAN DEFAULT FALSE,
        family_features JSON,
        primary_holder_name VARCHAR(100),
        primary_holder_email VARCHAR(100),
        primary_holder_phone VARCHAR(20),
        FOREIGN KEY (category_id) REFERENCES product_categories(id)
      )
    `);
    console.log('Accounts table is ready.');

    // Create sales table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(40) PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL,
        customer_id VARCHAR(40),
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        items JSON NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) DEFAULT 'cash',
        status VARCHAR(20) DEFAULT 'completed',
        notes TEXT,
        order_date DATETIME,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);
    console.log('Sales table is ready.');

    // Create invoices table
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(40) PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL,
        sale_id VARCHAR(40),
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
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);
    console.log('Invoices table is ready.');

    // Create sample data using the sample-data.sql file if it exists
    const sampleDataPath = path.join(__dirname, 'sample-data.sql');
    if (fs.existsSync(sampleDataPath)) {
      console.log('Sample data file found. Loading sample data...');
      
      try {
        const sampleDataSql = fs.readFileSync(sampleDataPath, 'utf8');
        // Split by semicolon to execute each statement separately
        const statements = sampleDataSql.split(';');
        
        for (let statement of statements) {
          statement = statement.trim();
          if (statement) {
            await db.query(statement);
          }
        }
        console.log('Sample data loaded successfully.');
      } catch (sampleDataError) {
        console.error('Error loading sample data:', sampleDataError.message);
      }
    }

    await db.end();
    console.log('Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up tables:', error.message);
    return false;
  }
};

// Run the initialization
(async () => {
  const dbCreated = await bootstrapDB();
  if (dbCreated) {
    const tablesCreated = await setupTables();
    if (tablesCreated) {
      console.log('Database initialization complete! You can now start the server.');
    } else {
      console.error('Failed to set up tables. Check the error message above.');
    }
  } else {
    console.error('Failed to create/connect to the database. Check if MySQL is running and credentials are correct.');
  }
})();
