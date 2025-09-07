const express = require('express');
const router = express.Router();
const db = require('../db');

// Startup marker to confirm this version is loaded
console.log('📋 Invoices route loaded - DATABASE VERSION');

/**
 * GET /api/invoices
 * Fetches all invoices with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching invoices from database...');
    const { status, customer_type, search } = req.query;
    
    let query = `
      SELECT 
        invoice_number,
        customer_name,
        customer_email,
        customer_type,
        status,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        number_of_items,
        payment_method,
        payment_terms,
        reseller_id,
        issue_date,
        due_date,
        notes,
        created_at,
        updated_at
      FROM invoices
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (customer_type && customer_type !== 'all') {
      query += ' AND customer_type = ?';
      params.push(customer_type);
    }
    
    if (search) {
      query += ' AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR reseller_id LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params);
    
    console.log(`✅ Found ${rows.length} invoices`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching invoices:', err);
    res.status(500).json({ 
      error: 'Failed to fetch invoices', 
      details: err.message,
      code: 'INVOICES_FETCH_ERROR'
    });
  }
});

/**
 * GET /api/invoices/:invoiceNumber
 * Fetches a single invoice by invoice number
 */
router.get('/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    
    const [invoice] = await db.query(`
      SELECT * FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);
    
    if (invoice.length === 0) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    res.json(invoice[0]);
  } catch (err) {
    console.error('❌ Error fetching invoice:', err);
    res.status(500).json({ 
      error: 'Failed to fetch invoice', 
      details: err.message 
    });
  }
});

/**
 * POST /api/invoices
 * Creates a new invoice from sale data
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new invoice:', req.body);
    const {
      saleId,
      customerInfo,
      paymentTerms = 'Payment due within 30 days',
      taxRate = 15,
      notes
    } = req.body;
    
    // Validation
    if (!saleId) {
      return res.status(400).json({ 
        error: 'Sale ID is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (!customerInfo || !customerInfo.name) {
      return res.status(400).json({ 
        error: 'Customer information is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Fetch sale data
    const [saleRows] = await db.query(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `, [saleId]);
    
    if (saleRows.length === 0) {
      return res.status(404).json({
        error: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });
    }
    
    const sale = saleRows[0];
    
    // Fetch sale items
    const [itemRows] = await db.query(`
      SELECT 
        si.*,
        a.name as product_name,
        a.description
      FROM sale_items si
      LEFT JOIN accounts a ON si.account_id = a.id
      WHERE si.sale_id = ?
    `, [saleId]);
    
    // Generate invoice number
    const year = new Date().getFullYear();
    const [countResult] = await db.query(
      'SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) = ?',
      [year]
    );
    const nextNumber = countResult[0].count + 1;
    const invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
    
    // Calculate amounts
    let subtotal = 0;
    let discountAmount = 0;
    let numberOfItems = itemRows.length;
    
    // Calculate subtotal from sale items
    for (const item of itemRows) {
      const itemTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;
    }
    
    // Apply reseller discount if applicable
    if (customerInfo.customerType === 'reseller' && customerInfo.resellerInfo) {
      const discountRate = customerInfo.resellerInfo.discountRate || 0;
      discountAmount = subtotal * (discountRate / 100);
    }
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const totalAmount = taxableAmount + taxAmount;
    
    // Calculate due date (30 days from now)
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Insert invoice
    const insertResult = await db.query(`
      INSERT INTO invoices (
        invoice_number,
        customer_name,
        customer_email,
        customer_type,
        status,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        number_of_items,
        payment_method,
        payment_terms,
        reseller_id,
        issue_date,
        due_date,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber,
      customerInfo.name,
      customerInfo.email || sale.customer_email,
      customerInfo.customerType || 'Standard',
      'draft',
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      numberOfItems,
      sale.payment_method,
      paymentTerms,
      customerInfo.customerType === 'reseller' ? customerInfo.resellerInfo?.resellerId : null,
      issueDate,
      dueDate,
      notes
    ]);
    
    console.log('✅ Invoice created successfully:', invoiceNumber);
    
    // Return the created invoice
    const [createdInvoice] = await db.query(`
      SELECT * FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);
    
    res.status(201).json({
      success: true,
      invoice: createdInvoice[0],
      message: `Invoice ${invoiceNumber} created successfully`
    });
    
  } catch (err) {
    console.error('❌ Error creating invoice:', err);
    res.status(500).json({ 
      error: 'Failed to create invoice', 
      details: err.message,
      code: 'INVOICE_CREATION_ERROR'
    });
  }
});

/**
 * PUT /api/invoices/:invoiceNumber
 * Updates an existing invoice
 */
router.put('/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const { status, notes, payment_method } = req.body;
    
    console.log(`📝 Updating invoice ${invoiceNumber}`);
    
    // Check if invoice exists
    const [existingInvoice] = await db.query(
      'SELECT invoice_number FROM invoices WHERE invoice_number = ?',
      [invoiceNumber]
    );
    
    if (existingInvoice.length === 0) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    if (payment_method) {
      updates.push('payment_method = ?');
      params.push(payment_method);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Add updated_at and invoice_number to params
    updates.push('updated_at = NOW()');
    params.push(invoiceNumber);
    
    const updateResult = await db.query(`
      UPDATE invoices 
      SET ${updates.join(', ')}
      WHERE invoice_number = ?
    `, params);
    
    console.log('✅ Invoice updated successfully');
    
    // Return updated invoice
    const [updatedInvoice] = await db.query(`
      SELECT * FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);
    
    res.json({
      success: true,
      invoice: updatedInvoice[0],
      message: `Invoice ${invoiceNumber} updated successfully`
    });
    
  } catch (err) {
    console.error('❌ Error updating invoice:', err);
    res.status(500).json({ 
      error: 'Failed to update invoice', 
      details: err.message,
      code: 'INVOICE_UPDATE_ERROR'
    });
  }
});

/**
 * DELETE /api/invoices/:invoiceNumber
 * Deletes an invoice (only if status is draft)
 */
router.delete('/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    
    console.log(`🗑️ Deleting invoice ${invoiceNumber}`);
    
    // Check if invoice exists and is deletable
    const [existingInvoice] = await db.query(`
      SELECT invoice_number, status FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);
    
    if (existingInvoice.length === 0) {
      return res.status(404).json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }
    
    if (existingInvoice[0].status !== 'draft') {
      return res.status(400).json({
        error: 'Only draft invoices can be deleted',
        code: 'INVOICE_NOT_DELETABLE'
      });
    }
    
    // Delete the invoice
    const deleteResult = await db.query(`
      DELETE FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);
    
    console.log('✅ Invoice deleted successfully');
    
    res.json({
      success: true,
      message: `Invoice ${invoiceNumber} deleted successfully`
    });
    
  } catch (err) {
    console.error('❌ Error deleting invoice:', err);
    res.status(500).json({ 
      error: 'Failed to delete invoice', 
      details: err.message,
      code: 'INVOICE_DELETE_ERROR'
    });
  }
});

/**
 * GET /api/invoices/stats/summary
 * Get invoice statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'sent' THEN total_amount ELSE 0 END) as pending_amount,
        COUNT(CASE WHEN status = 'overdue' OR (status != 'paid' AND due_date < CURDATE()) THEN 1 END) as overdue_count,
        COUNT(CASE WHEN customer_type = 'Reseller' THEN 1 END) as reseller_invoices
      FROM invoices
    `);
    
    res.json(stats[0]);
  } catch (err) {
    console.error('❌ Error fetching invoice stats:', err);
    res.status(500).json({ 
      error: 'Failed to fetch invoice statistics', 
      details: err.message 
    });
  }
});

module.exports = router;