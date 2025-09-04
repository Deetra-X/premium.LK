const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// GET /api/account-orders - Get all account orders with optional filters
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
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        ao.*,
        s.order_number,
        s.customer_name,
        a.product_name as account_name,
        a.email as account_email
      FROM account_orders ao
      LEFT JOIN sales s ON ao.sales_id = s.id
      LEFT JOIN accounts a ON ao.account_id = a.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    if (status) {
      query += ' AND ao.status = ?';
      queryParams.push(status);
    }

    if (accountId) {
      query += ' AND ao.account_id = ?';
      queryParams.push(accountId);
    }

    if (salesId) {
      query += ' AND ao.sales_id = ?';
      queryParams.push(salesId);
    }

    if (startBefore) {
      query += ' AND ao.start_date <= ?';
      queryParams.push(startBefore);
    }

    if (startAfter) {
      query += ' AND ao.start_date >= ?';
      queryParams.push(startAfter);
    }

    if (endBefore) {
      query += ' AND ao.end_date <= ?';
      queryParams.push(endBefore);
    }

    if (endAfter) {
      query += ' AND ao.end_date >= ?';
      queryParams.push(endAfter);
    }

    query += ' ORDER BY ao.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, queryParams);
    
    // Get credentials for each account order
    for (const row of rows) {
      const [credentials] = await pool.execute(
        'SELECT * FROM account_credentials WHERE account_order_id = ?',
        [row.id]
      );
      row.credentials = credentials;
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching account orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/account-orders/:id - Get specific account order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT 
        ao.*,
        s.order_number,
        s.customer_name,
        a.product_name as account_name,
        a.email as account_email
      FROM account_orders ao
      LEFT JOIN sales s ON ao.sales_id = s.id
      LEFT JOIN accounts a ON ao.account_id = a.id
      WHERE ao.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Account order not found' });
    }

    const accountOrder = rows[0];

    // Get credentials
    const [credentials] = await pool.execute(
      'SELECT * FROM account_credentials WHERE account_order_id = ?',
      [id]
    );
    accountOrder.credentials = credentials;

    res.json(accountOrder);
  } catch (error) {
    console.error('Error fetching account order:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/account-orders - Create new account order
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

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
        error: 'Missing required fields: sales_id, account_id, start_date, end_date, unit_price' 
      });
    }

    const id = uuidv4();
    const subtotal = parseFloat(unit_price) * parseInt(quantity);

    // Insert account order
    await connection.execute(`
      INSERT INTO account_orders (
        id, sales_id, account_id, start_date, end_date, 
        quantity, unit_price, subtotal, status, activation_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      sales_id,
      account_id,
      start_date,
      end_date,
      quantity,
      unit_price,
      subtotal,
      status,
      status === 'active' ? new Date() : null
    ]);

    // Insert credentials if provided
    if (credentials && credentials.length > 0) {
      for (const cred of credentials) {
        const credId = uuidv4();
        await connection.execute(`
          INSERT INTO account_credentials (
            id, account_order_id, username, password, 
            login_url, additional_info, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          credId,
          id,
          cred.username || null,
          cred.password || null,
          cred.loginUrl || null,
          cred.additionalInfo || null,
          cred.isActive !== false
        ]);
      }
    }

    await connection.commit();

    // Fetch the created record
    const [newRecord] = await connection.execute(`
      SELECT 
        ao.*,
        s.order_number,
        s.customer_name,
        a.product_name as account_name,
        a.email as account_email
      FROM account_orders ao
      LEFT JOIN sales s ON ao.sales_id = s.id
      LEFT JOIN accounts a ON ao.account_id = a.id
      WHERE ao.id = ?
    `, [id]);

    const [newCredentials] = await connection.execute(
      'SELECT * FROM account_credentials WHERE account_order_id = ?',
      [id]
    );

    const result = { ...newRecord[0], credentials: newCredentials };

    res.status(201).json(result);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating account order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/account-orders/:id - Update account order
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      start_date,
      end_date,
      quantity,
      unit_price,
      status,
      credentials
    } = req.body;

    // Check if account order exists
    const [existing] = await connection.execute(
      'SELECT * FROM account_orders WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Account order not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(quantity);
    }
    if (unit_price !== undefined) {
      updates.push('unit_price = ?');
      values.push(unit_price);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'active' && existing[0].status !== 'active') {
        updates.push('activation_date = ?');
        values.push(new Date());
      }
    }

    // Recalculate subtotal if quantity or unit_price changed
    if (quantity !== undefined || unit_price !== undefined) {
      const newQuantity = quantity !== undefined ? quantity : existing[0].quantity;
      const newUnitPrice = unit_price !== undefined ? unit_price : existing[0].unit_price;
      updates.push('subtotal = ?');
      values.push(parseFloat(newUnitPrice) * parseInt(newQuantity));
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      await connection.execute(
        `UPDATE account_orders SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update credentials if provided
    if (credentials !== undefined) {
      // Delete existing credentials
      await connection.execute(
        'DELETE FROM account_credentials WHERE account_order_id = ?',
        [id]
      );

      // Insert new credentials
      if (credentials.length > 0) {
        for (const cred of credentials) {
          const credId = uuidv4();
          await connection.execute(`
            INSERT INTO account_credentials (
              id, account_order_id, username, password, 
              login_url, additional_info, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            credId,
            id,
            cred.username || null,
            cred.password || null,
            cred.loginUrl || null,
            cred.additionalInfo || null,
            cred.isActive !== false
          ]);
        }
      }
    }

    await connection.commit();

    // Fetch updated record
    const [updated] = await connection.execute(`
      SELECT 
        ao.*,
        s.order_number,
        s.customer_name,
        a.product_name as account_name,
        a.email as account_email
      FROM account_orders ao
      LEFT JOIN sales s ON ao.sales_id = s.id
      LEFT JOIN accounts a ON ao.account_id = a.id
      WHERE ao.id = ?
    `, [id]);

    const [updatedCredentials] = await connection.execute(
      'SELECT * FROM account_credentials WHERE account_order_id = ?',
      [id]
    );

    const result = { ...updated[0], credentials: updatedCredentials };

    res.json(result);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating account order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// DELETE /api/account-orders/:id - Delete account order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if account order exists
    const [existing] = await pool.execute(
      'SELECT * FROM account_orders WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Account order not found' });
    }

    // Delete account order (credentials will be deleted automatically due to CASCADE)
    await pool.execute('DELETE FROM account_orders WHERE id = ?', [id]);

    res.json({ message: 'Account order deleted successfully', id });
  } catch (error) {
    console.error('Error deleting account order:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/account-orders/credentials/:id - Delete specific credential
router.delete('/credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if credential exists
    const [existing] = await pool.execute(
      'SELECT * FROM account_credentials WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    await pool.execute('DELETE FROM account_credentials WHERE id = ?', [id]);

    res.json({ message: 'Credential deleted successfully', id });
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
