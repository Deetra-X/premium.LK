const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to format a JS date or date-like value to 'YYYY-MM-DD' for MySQL DATE columns
function toSqlDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/accounts
 * Fetches all accounts with optional filtering
 * Query params: 
 *   - status: 'active', 'inactive', 'all' (default: 'all')
 *   - category: category_id to filter by
 *   - limit: number of records to return
 *   - offset: for pagination
 * Returns array of account objects
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'all', category, limit, offset = 0 } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    
    // Build WHERE clause based on filters
    const conditions = [];
    
    if (status === 'active') {
      conditions.push('a.is_active = 1');
    } else if (status === 'inactive') {
      conditions.push('a.is_active = 0');
    }
    
    if (category) {
      conditions.push('a.category_id = ?');
      queryParams.push(category);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    // Build LIMIT clause
    let limitClause = '';
    if (limit) {
      limitClause = `LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;
    }
    
    const query = `
      SELECT 
        a.*,
        pc.name as category_name,
        pc.icon as category_icon,
        pc.color as category_color,
        COALESCE(s.sales_count, 0) as sales_count,
        COALESCE(s.total_revenue, 0) as total_revenue
      FROM accounts a
      LEFT JOIN product_categories pc ON a.category_id = pc.id
      LEFT JOIN (
        SELECT 
          JSON_UNQUOTE(JSON_EXTRACT(si.item, '$.productId')) as product_id,
          COUNT(*) as sales_count,
          SUM(JSON_UNQUOTE(JSON_EXTRACT(si.item, '$.price')) * JSON_UNQUOTE(JSON_EXTRACT(si.item, '$.quantity'))) as total_revenue
        FROM sales s
        CROSS JOIN JSON_TABLE(s.items, '$[*]' COLUMNS (item JSON PATH '$')) si
        WHERE s.status = 'completed'
        GROUP BY product_id
      ) s ON a.id = s.product_id
      ${whereClause}
      ORDER BY a.updated_at DESC
      ${limitClause}
    `;
    
    const [accounts] = await db.query(query, queryParams);
    
    // Parse JSON fields
    const processedAccounts = accounts.map(account => ({
      ...account,
      family_features: account.family_features ? JSON.parse(account.family_features) : [],
      usage_restrictions: account.usage_restrictions ? JSON.parse(account.usage_restrictions) : [],
      salesCount: account.sales_count || 0,
      totalRevenue: account.total_revenue || 0
    }));
    
    res.json(processedAccounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts', details: err.message });
  }
});

/**
 * GET /api/accounts/active
 * Fetches only active accounts
 * Returns array of active account objects
 */
router.get('/active', async (req, res) => {
  try {
    const [accounts] = await db.query(`
      SELECT 
        a.*,
        pc.name as category_name,
        pc.icon as category_icon,
        pc.color as category_color
      FROM accounts a
      LEFT JOIN product_categories pc ON a.category_id = pc.id
      WHERE a.is_active = 1
      ORDER BY a.updated_at DESC
    `);
    
    const processedAccounts = accounts.map(account => ({
      ...account,
      family_features: account.family_features ? JSON.parse(account.family_features) : [],
      usage_restrictions: account.usage_restrictions ? JSON.parse(account.usage_restrictions) : []
    }));
    
    res.json(processedAccounts);
  } catch (err) {
    console.error('Error fetching active accounts:', err);
    res.status(500).json({ error: 'Failed to fetch active accounts', details: err.message });
  }
});

/**
 * GET /api/accounts/expiring-soon
 * Fetches accounts expiring in the specified number of days
 * Query params: days (default: 7)
 * Returns array of account objects with renewal info
 */
router.get('/expiring-soon', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAhead = parseInt(days);
    
    const [accounts] = await db.query(`
      SELECT 
        a.*,
        pc.name as category_name,
        pc.icon as category_icon,
        pc.color as category_color,
        DATEDIFF(a.renewal_date, CURDATE()) as days_until_renewal
      FROM accounts a
      LEFT JOIN product_categories pc ON a.category_id = pc.id
      WHERE a.is_active = 1 
        AND a.renewal_date IS NOT NULL 
        AND a.renewal_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND a.renewal_status IN ('renewable', 'non-renewable')
      ORDER BY a.renewal_date ASC
    `, [daysAhead]);
    
    const processedAccounts = accounts.map(account => ({
      ...account,
      family_features: account.family_features ? JSON.parse(account.family_features) : [],
      usage_restrictions: account.usage_restrictions ? JSON.parse(account.usage_restrictions) : []
    }));
    
    res.json(processedAccounts);
  } catch (err) {
    console.error('Error fetching expiring accounts:', err);
    res.status(500).json({ error: 'Failed to fetch expiring accounts', details: err.message });
  }
});

/**
 * POST /api/accounts
 * Creates a new account
 * Body: { product_name, label, email, cost, service_type, subscription_type, renewal_date, category_id, ... }
 * Returns the created account object
 */
router.post('/', async (req, res) => {
  try {
    const {
      product_name,
      label,
      email,
      renewal_status,
      cost,
      description,
      service_type,
      subscription_type,
      renewal_date,
      category_id,
      brand,
      max_user_slots,
      available_slots,
      current_users,
      cost_per_additional_user,
      is_shared_account,
      is_active,
      family_features,
      usage_restrictions,
      primary_holder_name,
      primary_holder_email,
      primary_holder_phone
    } = req.body;
    
    // Validation
    if (!product_name || !cost || !service_type || !subscription_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: product_name, cost, service_type, subscription_type' 
      });
    }
    
    const accountId = require('crypto').randomUUID();
    const now = new Date();
    
    // Calculate days until renewal if renewal_date is provided
    let days_until_renewal = null;
    if (renewal_date) {
      const renewalDateObj = new Date(renewal_date);
      const diffTime = renewalDateObj - now;
      days_until_renewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    // Ensure proper SQL DATE string (YYYY-MM-DD)
    const renewal_date_sql = toSqlDate(renewal_date);
    
    // Derive a non-null email to satisfy NOT NULL constraint on accounts.email
    const emailValue = (typeof email === 'string' && email.trim() !== '')
      ? email.trim()
      : (typeof primary_holder_email === 'string' && primary_holder_email.trim() !== '')
        ? primary_holder_email.trim()
        : `${accountId}@no-email.local`;

    // Validate and normalize renewal status
    const allowedStatuses = ['renewable', 'non-renewable', 'expired'];
    const renewalStatusValue = allowedStatuses.includes(renewal_status) ? renewal_status : 'renewable';

    // Determine active flag (default true)
    const isActiveValue = typeof is_active === 'boolean' ? is_active : true;

    await db.query(`
      INSERT INTO accounts (
        id, product_name, label, email, renewal_status, days_until_renewal, cost, 
        description, created_at, updated_at, is_active, service_type, subscription_type, 
        renewal_date, category_id, brand, max_user_slots, available_slots, current_users, 
        cost_per_additional_user, is_shared_account, family_features, usage_restrictions, 
        primary_holder_name, primary_holder_email, primary_holder_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      accountId,
      product_name,
      label || null,
      emailValue,
      renewalStatusValue,
      days_until_renewal,
      cost,
      description || null,
      now,
      now,
      isActiveValue,
      service_type,
      subscription_type,
      renewal_date_sql,
      category_id || null,
      brand || null,
      max_user_slots || null,
      available_slots || null,
      current_users || 0,
      cost_per_additional_user || null,
      is_shared_account || false,
      family_features ? JSON.stringify(family_features) : null,
      usage_restrictions ? JSON.stringify(usage_restrictions) : null,
      primary_holder_name || null,
      primary_holder_email || null,
      primary_holder_phone || null
    ]);
    
    // Fetch and return created account
    const [createdAccount] = await db.query(`
      SELECT 
        a.*,
        pc.name as category_name,
        pc.icon as category_icon,
        pc.color as category_color
      FROM accounts a
      LEFT JOIN product_categories pc ON a.category_id = pc.id
      WHERE a.id = ?
    `, [accountId]);
    
    const account = {
      ...createdAccount[0],
      family_features: createdAccount[0].family_features ? JSON.parse(createdAccount[0].family_features) : [],
      usage_restrictions: createdAccount[0].usage_restrictions ? JSON.parse(createdAccount[0].usage_restrictions) : []
    };
    
    res.status(201).json(account);
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
});

/**
 * PUT /api/accounts/:id
 * Updates an existing account
 * Body: account fields to update
 * Returns the updated account object
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Check if account exists
    const [existingAccount] = await db.query('SELECT id FROM accounts WHERE id = ?', [id]);
    if (existingAccount.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Build dynamic update query
    const fieldsToUpdate = [];
    const values = [];
    
    // List of allowed fields to update
    const allowedFields = [
      'product_name', 'label', 'email', 'renewal_status', 'days_until_renewal', 
      'cost', 'description', 'is_active', 'service_type', 'subscription_type', 
      'renewal_date', 'category_id', 'brand', 'max_user_slots', 'available_slots', 
      'current_users', 'cost_per_additional_user', 'is_shared_account', 
      'family_features', 'usage_restrictions', 'primary_holder_name', 
      'primary_holder_email', 'primary_holder_phone'
    ];
    
    Object.keys(updateFields).forEach(field => {
      if (allowedFields.includes(field)) {
        fieldsToUpdate.push(`${field} = ?`);
        if (field === 'family_features' || field === 'usage_restrictions') {
          values.push(Array.isArray(updateFields[field]) ? JSON.stringify(updateFields[field]) : updateFields[field]);
        } else if (field === 'renewal_date') {
          values.push(toSqlDate(updateFields[field]));
        } else {
          values.push(updateFields[field]);
        }
      }
    });
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add updated_at timestamp
    fieldsToUpdate.push('updated_at = ?');
    values.push(new Date());
    values.push(id);
    
    await db.query(`
      UPDATE accounts SET ${fieldsToUpdate.join(', ')} WHERE id = ?
    `, values);
    
    // Fetch and return updated account
    const [updatedAccount] = await db.query(`
      SELECT 
        a.*,
        pc.name as category_name,
        pc.icon as category_icon,
        pc.color as category_color
      FROM accounts a
      LEFT JOIN product_categories pc ON a.category_id = pc.id
      WHERE a.id = ?
    `, [id]);
    
    const account = {
      ...updatedAccount[0],
      family_features: updatedAccount[0].family_features ? JSON.parse(updatedAccount[0].family_features) : [],
      usage_restrictions: updatedAccount[0].usage_restrictions ? JSON.parse(updatedAccount[0].usage_restrictions) : []
    };
    
    res.json(account);
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ error: 'Failed to update account', details: err.message });
  }
});

/**
 * DELETE /api/accounts/:id
 * Permanently deletes an account from database
 * Returns success confirmation
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Permanently deleting account ${id}`);
    
    // Check if account exists
    const [existingAccount] = await db.query('SELECT id, product_name FROM accounts WHERE id = ?', [id]);
    if (existingAccount.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const accountName = existingAccount[0].product_name;
    
    // Perform HARD delete - completely remove from database
    const deleteResult = await db.query('DELETE FROM accounts WHERE id = ?', [id]);
    
    if (deleteResult[0].affectedRows === 0) {
      return res.status(500).json({ error: 'Account deletion failed - no rows affected' });
    }
    
    console.log(`✅ Account "${accountName}" permanently deleted from database`);
    res.json({ 
      success: true, 
      message: `Account "${accountName}" permanently deleted`,
      deletedId: id,
      deletedName: accountName
    });
  } catch (err) {
    console.error('❌ Error deleting account:', err);
    res.status(500).json({ 
      error: 'Failed to delete account', 
      details: err.message 
    });
  }
});

/**
 * GET /api/accounts/:id
 * Fetches a single account by ID
 * Returns account object with category details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [account] = await db.query(`
      SELECT 
        a.*,
        pc.name as category_name,
        pc.icon as category_icon,
        pc.color as category_color
      FROM accounts a
      LEFT JOIN product_categories pc ON a.category_id = pc.id
      WHERE a.id = ?
    `, [id]);
    
    if (account.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const accountData = {
  ...account[0],
  family_features: account[0].family_features ? JSON.parse(account[0].family_features) : [],
  usage_restrictions: account[0].usage_restrictions ? JSON.parse(account[0].usage_restrictions) : []
};
    
res.json(accountData);
} catch (err) {
  console.error('Error fetching account:', err);
  res.status(500).json({ error: 'Failed to fetch account', details: err.message });
}
});

module.exports = router;