// const express = require('express');
// const router = express.Router();
// const db = require('../db');

// /**
//  * GET /api/customers
//  * Fetches all customers with optional filtering and pagination
//  * Query params:
//  *   - type: 'standard', 'reseller', 'all' (default: 'all')
//  *   - limit: number of records to return
//  *   - offset: for pagination
//  *   - search: search term for name/email
//  * Returns array of customer objects
//  */
// router.get('/', async (req, res) => {
//   try {
//     const { type = 'all', limit, offset = 0, search } = req.query;
    
//     let whereClause = '';
//     let queryParams = [];
    
//     // Build WHERE clause based on filters
//     const conditions = [];
    
//     if (type === 'standard') {
//       conditions.push('customer_type = ?');
//       queryParams.push('standard');
//     } else if (type === 'reseller') {
//       conditions.push('customer_type = ?');
//       queryParams.push('reseller');
//     }
    
//     if (search) {
//       conditions.push('(name LIKE ? OR email LIKE ?)');
//       queryParams.push(`%${search}%`, `%${search}%`);
//     }
    
//     if (conditions.length > 0) {
//       whereClause = 'WHERE ' + conditions.join(' AND ');
//     }
    
//     // Build LIMIT clause
//     let limitClause = '';
//     if (limit) {
//       limitClause = `LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;
//     }
    
//     const query = `
//       SELECT c.*, c.preferred_products,
//         COALESCE(s.total_spent, 0) as calculated_total_spent,
//         COALESCE(s.total_orders, 0) as calculated_total_orders
//       FROM customers c
//       LEFT JOIN (
//         SELECT 
//           customer_id,
//           SUM(total_amount) as total_spent,
//           COUNT(*) as total_orders
//         FROM sales 
//         WHERE status = 'completed'
//         GROUP BY customer_id
//       ) s ON c.id = s.customer_id
//       ${whereClause}
//       ORDER BY c.created_at DESC
//       ${limitClause}
//     `;
    
//     const [customers] = await db.query(query, queryParams);
    
//     // Parse JSON fields and update calculated values
//     const processedCustomers = customers.map(customer => ({
//       ...customer,
//       preferred_products: customer.preferred_products ? JSON.parse(customer.preferred_products) : [],
//       totalSpent: customer.calculated_total_spent || customer.total_spent || 0,
//       totalOrders: customer.calculated_total_orders || customer.total_orders || 0
//     }));
    
//     res.json(processedCustomers);
//   } catch (err) {
//     console.error('Error fetching customers:', err);
//     res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
//   }
// });

// /**
//  * GET /api/customers/resellers
//  * Fetches all reseller customers
//  * Returns array of reseller customer objects
//  */
// router.get('/resellers', async (req, res) => {
//   try {
//     const [customers] = await db.query(`
//       SELECT * FROM customers 
//       WHERE customer_type = 'reseller'
//       ORDER BY created_at DESC
//     `);
    
//     const processedCustomers = customers.map(customer => ({
//       ...customer,
//       preferred_products: customer.preferred_products ? JSON.parse(customer.preferred_products) : []
//     }));
    
//     res.json(processedCustomers);
//   } catch (err) {
//     console.error('Error fetching reseller customers:', err);
//     res.status(500).json({ error: 'Failed to fetch reseller customers', details: err.message });
//   }
// });

// /**
//  * GET /api/customers/stats
//  * Fetches customer statistics
//  * Returns object with customer counts and metrics
//  */
// router.get('/stats', async (req, res) => {
//   try {
//     const [stats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_customers,
//         SUM(CASE WHEN customer_type = 'standard' THEN 1 ELSE 0 END) as standard_customers,
//         SUM(CASE WHEN customer_type = 'reseller' THEN 1 ELSE 0 END) as reseller_customers,
//         SUM(total_spent) as total_revenue,
//         AVG(total_spent) as avg_customer_value,
//         SUM(total_orders) as total_orders
//       FROM customers
//     `);
    
//     res.json(stats[0]);
//   } catch (err) {
//     console.error('Error fetching customer stats:', err);
//     res.status(500).json({ error: 'Failed to fetch customer stats', details: err.message });
//   }
// });

// /**
//  * POST /api/customers
//  * Creates a new customer
//  * Body: { name, email, phone, customer_type, billing_address_*, ... }
//  * Returns the created customer object
//  */
// router.post('/', async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       customer_type = 'standard || reseller',
//       preferred_products = [],
//       billing_address_street,
//       billing_address_city,
//       billing_address_state,
//       billing_address_zip_code,
//       billing_address_country,
//       tax_id,
//       reseller_id,
//       reseller_discount_rate,
//       reseller_minimum_order_quantity,
//       reseller_special_terms,
//       reseller_credit_limit
//     } = req.body;
    
//     // Validation
//     if (!name || !email) {
//       return res.status(400).json({ error: 'Name and email are required' });
//     }
    
//     // Check if email already exists
//     const [existingCustomer] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
//     if (existingCustomer.length > 0) {
//       return res.status(400).json({ error: 'Customer with this email already exists' });
//     }
    
//     const customerId = require('crypto').randomUUID();
//     const now = new Date();
    
//     await db.query(`
//       INSERT INTO customers (
//         id, name, email, phone, accounts_count, total_spent, total_orders, 
//         created_at, last_order_date, preferred_products, billing_address_street, 
//         billing_address_city, billing_address_state, billing_address_zip_code, 
//         billing_address_country, tax_id, customer_type, reseller_id, 
//         reseller_discount_rate, reseller_minimum_order_quantity, 
//         reseller_special_terms, reseller_credit_limit
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       customerId,
//       name,
//       email,
//       phone || null,
//       0, // accounts_count
//       0, // total_spent
//       0, // total_orders
//       now,
//       null, // last_order_date
//       JSON.stringify(preferred_products),
//       billing_address_street || null,
//       billing_address_city || null,
//       billing_address_state || null,
//       billing_address_zip_code || null,
//       billing_address_country || null,
//       tax_id || null,
//       customer_type,
//       reseller_id || null,
//       reseller_discount_rate || null,
//       reseller_minimum_order_quantity || null,
//       reseller_special_terms || null,
//       reseller_credit_limit || null
//     ]);
    
//     // Fetch and return created customer
//     const [createdCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    
//     const customer = {
//       ...createdCustomer[0],
//       preferred_products: JSON.parse(createdCustomer[0].preferred_products)
//     };
    
//     res.status(201).json(customer);
//   } catch (err) {
//     console.error('Error creating customer:', err);
//     res.status(500).json({ error: 'Failed to create customer', details: err.message });
//   }
// });

// /**
//  * PUT /api/customers/:id
//  * Updates an existing customer
//  * Body: customer fields to update
//  * Returns the updated customer object
//  */
// router.put('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateFields = req.body;
    
//     // Check if customer exists
//     const [existingCustomer] = await db.query(`SELECT * FROM sales 
//    WHERE customer_name = ? 
//       OR customer_email = ? 
//       OR customer_phone = ?`,
//   [customer_name, customer_email, customer_phone]
// );
//     if (existingCustomer.length === 0) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     // Build dynamic update query
//     const fieldsToUpdate = [];
//     const values = [];
    
//     // List of allowed fields to update
//     const allowedFields = [
//       'name', 'email', 'phone', 'accounts_count', 'total_spent', 'total_orders',
//       'last_order_date', 'preferred_products', 'billing_address_street',
//       'billing_address_city', 'billing_address_state', 'billing_address_zip_code',
//       'billing_address_country', 'tax_id', 'customer_type', 'reseller_id',
//       'reseller_discount_rate', 'reseller_minimum_order_quantity',
//       'reseller_special_terms', 'reseller_credit_limit'
//     ];
    
//     Object.keys(updateFields).forEach(field => {
//       if (allowedFields.includes(field)) {
//         fieldsToUpdate.push(`${field} = ?`);
//         if (field === 'preferred_products') {
//           values.push(Array.isArray(updateFields[field]) ? JSON.stringify(updateFields[field]) : updateFields[field]);
//         } else {
//           values.push(updateFields[field]);
//         }
//       }
//     });
    
//     if (fieldsToUpdate.length === 0) {
//       return res.status(400).json({ error: 'No valid fields to update' });
//     }
    
//     values.push(id);
    
//     await db.query(`
//       UPDATE customers SET ${fieldsToUpdate.join(', ')} WHERE id = ?
//     `, values);
    
//     // Fetch and return updated customer
//     const [updatedCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    
//     const customer = {
//       ...updatedCustomer[0],
//       preferred_products: updatedCustomer[0].preferred_products ? JSON.parse(updatedCustomer[0].preferred_products) : []
//     };
    
//     res.json(customer);
//   } catch (err) {
//     console.error('Error updating customer:', err);
//     res.status(500).json({ error: 'Failed to update customer', details: err.message });
//   }
// });

// /**
//  * DELETE /api/customers/:id
//  * Deletes a customer (hard delete, use with caution)
//  * Returns success confirmation
//  */
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Check if customer exists
//     const [existingCustomer] = await db.query('SELECT id FROM customers WHERE id = ?', [id]);
//     if (existingCustomer.length === 0) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     // Check if customer has active orders/subscriptions
//     const [activeOrders] = await db.query(`
//       SELECT COUNT(*) as count FROM subscriptions 
//       WHERE customer_id = ? AND status = 'active'
//     `, [id]);
    
//     if (activeOrders[0].count > 0) {
//       return res.status(400).json({ 
//         error: 'Cannot delete customer with active subscriptions',
//         activeOrders: activeOrders[0].count
//       });
//     }
    
//     // Delete customer
//     await db.query('DELETE FROM customers WHERE id = ?', [id]);
    
//     res.json({ success: true, message: 'Customer deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting customer:', err);
//     res.status(500).json({ error: 'Failed to delete customer', details: err.message });
//   }
// });

// /**
//  * GET /api/customers/:id
//  * Fetches a single customer by ID
//  * Returns customer object with all details
//  */
// router.get('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const [customer] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    
//     if (customer.length === 0) {
//       return res.status(404).json({ error: 'Customer not found' });
//     }
    
//     const customerData = {
//       ...customer[0],
//       preferred_products: customer[0].preferred_products ? JSON.parse(customer[0].preferred_products) : []
//     };
    
//     res.json(customerData);
//   } catch (err) {
//     console.error('Error fetching customer:', err);
//     res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * NOTE:
 * Since we only have the `sales` table with embedded customer info,
 * we treat unique customers by grouping sales by customer_email (or customer_name + phone as fallback).
 * Some fields like preferred_products, billing addresses, tax_id, reseller fields don't exist in sales table.
 * They are commented or omitted accordingly.
 */

/**
 * GET /api/customers
 * Fetches all unique customers with optional filtering and pagination extracted from sales
 * Query params:
 *   - type: 'standard', 'reseller', 'all' (default: 'all')
 *   - limit: number of records to return
 *   - offset: for pagination
 *   - search: search term matching customer_name or customer_email
 * Returns array of customer objects with aggregated data from sales
 */
router.get('/', async (req, res) => {
  try {
    const { type = 'all', limit, offset = 0, search } = req.query;

    const whereConditions = [];
    const queryParams = [];

    // Filter by customer_type from sales table
    if (type === 'standard') {
      whereConditions.push('customer_type = ?');
      queryParams.push('standard');
    } else if (type === 'reseller') {
      whereConditions.push('customer_type = ?');
      queryParams.push('reseller');
    }

    // Search by name or email
    if (search) {
      whereConditions.push('(customer_name LIKE ? OR customer_email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build query to get unique customers grouped by email (assuming email uniquely identifies customer)
    // Aggregate total spent and total orders from sales
    // We use LIMIT with OFFSET for pagination

    // Important: 'LIMIT ? OFFSET ?' preferred for safer params
    const limitClause = limit ? `LIMIT ? OFFSET ?` : '';

    if (limit) {
      queryParams.push(parseInt(limit), parseInt(offset));
    }

    // Query to group sales by customer_email (key unique customer identifier)
    const query = `
      SELECT 
    customer_name,
    customer_email,
    customer_phone,
    customer_type,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_spent,
    MAX(order_date) AS last_order_date,
    MIN(order_date) AS first_order_date
  FROM sales
  WHERE status = 'completed'
  ${whereClause}
  GROUP BY customer_email, customer_name, customer_phone, customer_type
  ORDER BY MAX(order_date) DESC
  ${limitClause}
`;

    const [customers] = await db.query(query, queryParams);

    // Since preferred_products etc. do not exist, we skip parsing them or set empty defaults
    const processedCustomers = customers.map(cust => ({
      ...cust,
      total_spent: parseFloat(cust.total_spent) || 0,
      total_orders: parseInt(cust.total_orders) || 0,
      last_order_date: cust.last_order_date,
      first_order_date: cust.first_order_date,
      preferred_products: [],
    }));

    res.json(processedCustomers);
  } catch (err) {
    console.error('Error fetching customers from sales:', err);
    res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
});

/**
 * GET /api/customers/resellers
 * Fetches unique reseller customers extracted from sales table
 */
router.get('/resellers', async (req, res) => {
  try {
    const query = `
      SELECT 
        customer_name,
        customer_email,
        customer_phone,
        customer_type,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_spent
      FROM sales
      WHERE customer_type = 'reseller'
      GROUP BY customer_email, customer_name, customer_phone, customer_type
      ORDER BY MAX(order_date) DESC
    `;

    const [customers] = await db.query(query);

    const processedCustomers = customers.map(cust => ({
      ...cust,
      preferred_products: [], // not in sales
      billing_address_street: null,
      billing_address_city: null,
      billing_address_state: null,
      billing_address_zip_code: null,
      billing_address_country: null,
      tax_id: null,
      reseller_id: null,
      reseller_discount_rate: null,
      reseller_minimum_order_quantity: null,
      reseller_special_terms: null,
      reseller_credit_limit: null
    }));

    res.json(processedCustomers);
  } catch (err) {
    console.error('Error fetching reseller customers:', err);
    res.status(500).json({ error: 'Failed to fetch reseller customers', details: err.message });
  }
});

/**
 * GET /api/customers/stats
 * Fetches aggregated customer statistics from sales table
 */
router.get('/stats', async (req, res) => {
  try {
    // Counting unique customers by email and type
    // Summing total spent and total orders across all sales
    const query = `
      SELECT 
        COUNT(DISTINCT customer_email) AS total_customers,
        COUNT(DISTINCT CASE WHEN customer_type = 'standard' THEN customer_email END) AS standard_customers,
        COUNT(DISTINCT CASE WHEN customer_type = 'reseller' THEN customer_email END) AS reseller_customers,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value,
        COUNT(*) AS total_orders
      FROM sales
      WHERE status = 'completed'
    `;

    const [stats] = await db.query(query);

    res.json(stats[0]);
  } catch (err) {
    console.error('Error fetching customer stats from sales:', err);
    res.status(500).json({ error: 'Failed to fetch customer stats', details: err.message });
  }
});

/**
 * POST /api/customers
 * Creating customers is NOT supported because sales table is immutable records.
 * COMMENTED OUT - You can only create sales records.
 * 
 * You might want to create a separate customers table for that.
 */
router.post('/', (req, res) => {
  res.status(405).json({ error: 'Creating individual customers is not supported. Please create sales records instead.' });
});

/**
 * PUT /api/customers/:id
 * Updating customer info is NOT supported because sales are immutable records of orders.
 * COMMENTED OUT.
 */
router.put('/:id', (req, res) => {
  res.status(405).json({ error: 'Updating customers is not supported in sales table.' });
});

/**
 * DELETE /api/customers/:id
 * Deleting customers is NOT supported because all customer info resides inside sales orders.
 * COMMENTED OUT.
 */
router.delete('/:id', (req, res) => {
  res.status(405).json({ error: 'Deleting customers is not supported in sales table.' });
});

/**
 * GET /api/customers/:id
 * Fetch single customer identified by email (id param here treated as email)
 * Return aggregated info from sales table
 */
router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email;

    // Get aggregated info for a specific customer email
    const query = `
      SELECT 
        customer_name,
        customer_email,
        customer_phone,
        customer_type,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_spent
      FROM sales
      WHERE customer_email = ?
      GROUP BY customer_email, customer_name, customer_phone, customer_type
      LIMIT 1
    `;

    const [customer] = await db.query(query, [email]);

    if (!customer.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const cust = {
      ...customer[0],
      preferred_products: [], // not available
      billing_address_street: null,
      billing_address_city: null,
      billing_address_state: null,
      billing_address_zip_code: null,
      billing_address_country: null,
      tax_id: null,
      reseller_id: null,
      reseller_discount_rate: null,
      reseller_minimum_order_quantity: null,
      reseller_special_terms: null,
      reseller_credit_limit: null
    };

    res.json(cust);
  } catch (err) {
    console.error('Error fetching customer by email:', err);
    res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
  }
});

module.exports = router;
