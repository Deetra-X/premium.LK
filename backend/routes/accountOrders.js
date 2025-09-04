const express = require('express');
const router = express.Router();
const db = require('../../src/db'); // Path to the DB file in src folder
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/account-orders
 * Fetches all account orders with optional filtering
 * Query params:
 *   - status: 'active', 'expired', 'cancelled'
 *   - accountId: filter by specific account ID
 *   - salesId: filter by specific sales ID
 *   - startBefore, startAfter: filter by start date range
 *   - endBefore, endAfter: filter by end date range
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      accountId,
      salesId,
      startBefore,
      startAfter,
      endBefore,
      endAfter,
      limit = 100,
      offset = 0
    } = req.query;
    
    let whereClause = '';
    const queryParams = [];
    const conditions = [];
    
    // Build WHERE clause based on filters
    if (status) {
      conditions.push('ao.status = ?');
      queryParams.push(status);
    }
    
    if (accountId) {
      conditions.push('ao.account_id = ?');
      queryParams.push(accountId);
    }
    
    if (salesId) {
      conditions.push('ao.sales_id = ?');
      queryParams.push(salesId);
    }
    
    if (startBefore) {
      conditions.push('ao.start_date <= ?');
      queryParams.push(startBefore);
    }
    
    if (startAfter) {
      conditions.push('ao.start_date >= ?');
      queryParams.push(startAfter);
    }
    
    if (endBefore) {
      conditions.push('ao.end_date <= ?');
      queryParams.push(endBefore);
    }
    
    if (endAfter) {
      conditions.push('ao.end_date >= ?');
      queryParams.push(endAfter);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    const query = `
      SELECT 
        ao.*,
        a.product_name,
        a.label,
        a.service_type,
        a.subscription_type,
        s.customer_name,
        s.customer_email,
        s.order_number
      FROM account_orders ao
      LEFT JOIN accounts a ON ao.account_id = a.id
      LEFT JOIN sales s ON ao.sales_id = s.id
      ${whereClause}
      ORDER BY ao.created_at DESC
      LIMIT ${parseInt(offset, 10)}, ${parseInt(limit, 10)}
    `;
    
    const [accountOrders] = await db.query(query, queryParams);
    
    // Get credentials for each order
    const orderIds = accountOrders.map(order => order.id);
    
    if (orderIds.length > 0) {
      const [credentials] = await db.query(
        `SELECT * FROM account_credentials WHERE account_order_id IN (?)`,
        [orderIds]
      );
      
      // Map credentials to orders
      const credentialsMap = {};
      credentials.forEach(cred => {
        if (!credentialsMap[cred.account_order_id]) {
          credentialsMap[cred.account_order_id] = [];
        }
        credentialsMap[cred.account_order_id].push({
          id: cred.id,
          username: cred.username,
          password: cred.password,
          loginUrl: cred.login_url,
          additionalInfo: cred.additional_info,
          isActive: cred.is_active === 1
        });
      });
      
      // Add credentials to orders
      accountOrders.forEach(order => {
        order.credentials = credentialsMap[order.id] || [];
      });
    }
    
    res.json(accountOrders);
  } catch (err) {
    console.error('Error fetching account orders:', err);
    res.status(500).json({ error: 'Failed to fetch account orders', details: err.message });
  }
});

/**
 * GET /api/account-orders/:id
 * Fetches a single account order by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [accountOrders] = await db.query(
      `SELECT 
        ao.*,
        a.product_name,
        a.label,
        a.service_type,
        a.subscription_type,
        s.customer_name,
        s.customer_email,
        s.order_number
      FROM account_orders ao
      LEFT JOIN accounts a ON ao.account_id = a.id
      LEFT JOIN sales s ON ao.sales_id = s.id
      WHERE ao.id = ?`,
      [id]
    );
    
    if (accountOrders.length === 0) {
      return res.status(404).json({ error: 'Account order not found' });
    }
    
    const accountOrder = accountOrders[0];
    
    // Get credentials for this order
    const [credentials] = await db.query(
      'SELECT * FROM account_credentials WHERE account_order_id = ?',
      [id]
    );
    
    accountOrder.credentials = credentials.map(cred => ({
      id: cred.id,
      username: cred.username,
      password: cred.password,
      loginUrl: cred.login_url,
      additionalInfo: cred.additional_info,
      isActive: cred.is_active === 1
    }));
    
    res.json(accountOrder);
  } catch (err) {
    console.error('Error fetching account order:', err);
    res.status(500).json({ error: 'Failed to fetch account order', details: err.message });
  }
});

/**
 * POST /api/account-orders
 * Creates a new account order
 * Body: { salesId, accountId, startDate, endDate, quantity, unitPrice, ... }
 */
router.post('/', async (req, res) => {
  try {
    const {
      sales_id,
      account_id,
      start_date,
      end_date,
      quantity = 1,
      unit_price,
      status = 'active',
      credentials = []
    } = req.body;
    
    // Validate required fields
    if (!sales_id || !account_id || !start_date || !end_date || !unit_price) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sales_id', 'account_id', 'start_date', 'end_date', 'unit_price']
      });
    }
    
    // Calculate subtotal
    const subtotal = quantity * parseFloat(unit_price);
    
    // Generate unique ID
    const id = uuidv4();
    
    // Insert account order
    await db.query(
      `INSERT INTO account_orders (
        id, sales_id, account_id, start_date, end_date,
        quantity, unit_price, subtotal, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sales_id,
        account_id,
        start_date,
        end_date,
        quantity,
        unit_price,
        subtotal,
        status
      ]
    );
    
    // Insert credentials if provided
    if (credentials && credentials.length > 0) {
      const credentialsValues = credentials.map(cred => [
        uuidv4(),
        id,
        cred.username || null,
        cred.password || null,
        cred.loginUrl || null,
        cred.additionalInfo || null,
        cred.isActive === false ? 0 : 1
      ]);
      
      await db.query(
        `INSERT INTO account_credentials (
          id, account_order_id, username, password, login_url, additional_info, is_active
        ) VALUES ?`,
        [credentialsValues]
      );
    }
    
    // Return created account order
    const [accountOrders] = await db.query(
      `SELECT 
        ao.*,
        a.product_name,
        a.label,
        a.service_type,
        a.subscription_type,
        s.customer_name,
        s.customer_email,
        s.order_number
      FROM account_orders ao
      LEFT JOIN accounts a ON ao.account_id = a.id
      LEFT JOIN sales s ON ao.sales_id = s.id
      WHERE ao.id = ?`,
      [id]
    );
    
    // Get credentials for this order
    const [createdCredentials] = await db.query(
      'SELECT * FROM account_credentials WHERE account_order_id = ?',
      [id]
    );
    
    const accountOrder = accountOrders[0];
    accountOrder.credentials = createdCredentials.map(cred => ({
      id: cred.id,
      username: cred.username,
      password: cred.password,
      loginUrl: cred.login_url,
      additionalInfo: cred.additional_info,
      isActive: cred.is_active === 1
    }));
    
    res.status(201).json(accountOrder);
  } catch (err) {
    console.error('Error creating account order:', err);
    res.status(500).json({ error: 'Failed to create account order', details: err.message });
  }
});

/**
 * PUT /api/account-orders/:id
 * Updates an existing account order
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      quantity,
      unit_price,
      status,
      credentials
    } = req.body;
    
    // Check if the order exists
    const [existingOrders] = await db.query(
      'SELECT * FROM account_orders WHERE id = ?',
      [id]
    );
    
    if (existingOrders.length === 0) {
      return res.status(404).json({ error: 'Account order not found' });
    }
    
    const updates = [];
    const queryParams = [];
    
    // Build SET clause for updates
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      queryParams.push(start_date);
    }
    
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      queryParams.push(end_date);
    }
    
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      queryParams.push(quantity);
    }
    
    if (unit_price !== undefined) {
      updates.push('unit_price = ?');
      queryParams.push(unit_price);
    }
    
    if (status !== undefined) {
      updates.push('status = ?');
      queryParams.push(status);
    }
    
    // If both quantity and unit_price are provided, recalculate subtotal
    if (quantity !== undefined && unit_price !== undefined) {
      const subtotal = quantity * parseFloat(unit_price);
      updates.push('subtotal = ?');
      queryParams.push(subtotal);
    } else if (quantity !== undefined && unit_price === undefined) {
      // Recalculate with existing unit_price
      updates.push('subtotal = quantity * unit_price');
    } else if (unit_price !== undefined && quantity === undefined) {
      // Recalculate with existing quantity
      updates.push('subtotal = quantity * ?');
      queryParams.push(unit_price);
    }
    
    if (updates.length > 0) {
      queryParams.push(id);
      await db.query(
        `UPDATE account_orders SET ${updates.join(', ')} WHERE id = ?`,
        queryParams
      );
    }
    
    // Update credentials if provided
    if (credentials && Array.isArray(credentials)) {
      // Process each credential
      for (const cred of credentials) {
        if (cred.id) {
          // Update existing credential
          await db.query(
            `UPDATE account_credentials 
             SET username = ?, password = ?, login_url = ?, additional_info = ?, is_active = ?
             WHERE id = ? AND account_order_id = ?`,
            [
              cred.username || null,
              cred.password || null,
              cred.loginUrl || null,
              cred.additionalInfo || null,
              cred.isActive === false ? 0 : 1,
              cred.id,
              id
            ]
          );
        } else {
          // Add new credential
          await db.query(
            `INSERT INTO account_credentials (
              id, account_order_id, username, password, login_url, additional_info, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              id,
              cred.username || null,
              cred.password || null,
              cred.loginUrl || null,
              cred.additionalInfo || null,
              cred.isActive === false ? 0 : 1
            ]
          );
        }
      }
    }
    
    // Return updated account order
    const [accountOrders] = await db.query(
      `SELECT 
        ao.*,
        a.product_name,
        a.label,
        a.service_type,
        a.subscription_type,
        s.customer_name,
        s.customer_email,
        s.order_number
      FROM account_orders ao
      LEFT JOIN accounts a ON ao.account_id = a.id
      LEFT JOIN sales s ON ao.sales_id = s.id
      WHERE ao.id = ?`,
      [id]
    );
    
    // Get credentials for this order
    const [updatedCredentials] = await db.query(
      'SELECT * FROM account_credentials WHERE account_order_id = ?',
      [id]
    );
    
    const accountOrder = accountOrders[0];
    accountOrder.credentials = updatedCredentials.map(cred => ({
      id: cred.id,
      username: cred.username,
      password: cred.password,
      loginUrl: cred.login_url,
      additionalInfo: cred.additional_info,
      isActive: cred.is_active === 1
    }));
    
    res.json(accountOrder);
  } catch (err) {
    console.error('Error updating account order:', err);
    res.status(500).json({ error: 'Failed to update account order', details: err.message });
  }
});

/**
 * DELETE /api/account-orders/:id
 * Deletes an account order
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the order exists
    const [existingOrders] = await db.query(
      'SELECT * FROM account_orders WHERE id = ?',
      [id]
    );
    
    if (existingOrders.length === 0) {
      return res.status(404).json({ error: 'Account order not found' });
    }
    
    // Delete the account order (associated credentials will be deleted due to CASCADE)
    await db.query('DELETE FROM account_orders WHERE id = ?', [id]);
    
    res.json({ message: 'Account order deleted successfully', id });
  } catch (err) {
    console.error('Error deleting account order:', err);
    res.status(500).json({ error: 'Failed to delete account order', details: err.message });
  }
});

/**
 * DELETE /api/account-orders/credentials/:id
 * Deletes a specific credential
 */
router.delete('/credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the credential exists
    const [existingCredentials] = await db.query(
      'SELECT * FROM account_credentials WHERE id = ?',
      [id]
    );
    
    if (existingCredentials.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    // Delete the credential
    await db.query('DELETE FROM account_credentials WHERE id = ?', [id]);
    
    res.json({ message: 'Credential deleted successfully', id });
  } catch (err) {
    console.error('Error deleting credential:', err);
    res.status(500).json({ error: 'Failed to delete credential', details: err.message });
  }
});

module.exports = router;
