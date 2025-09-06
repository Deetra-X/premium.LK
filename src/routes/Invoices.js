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
        s.*
      FROM sales s
      WHERE s.id = ?
    `, [saleId]);
    
    if (saleRows.length === 0) {
      return res.status(404).json({
        error: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });
    }
    
    const sale = saleRows[0];
    console.log('📊 Found sale:', sale);
    
    // Parse items from JSON if it exists
    let saleItems = [];
    try {
      if (sale.items) {
        saleItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
      } else {
        // If no items JSON, create from single product data
        saleItems = [{
          productId: sale.id.toString(),
          productName: sale.product_name || 'Product',
          price: parseFloat(sale.total_amount) || 0,
          quantity: sale.quantity || 1
        }];
      }
    } catch (parseError) {
      console.error('Error parsing sale items:', parseError);
      // Fallback to basic item structure
      saleItems = [{
        productId: sale.id.toString(),
        productName: sale.product_name || 'Product',
        price: parseFloat(sale.total_amount) || 0,
        quantity: sale.quantity || 1
      }];
    }
    
    console.log('📦 Sale items:', saleItems);
    
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
    let discountRate = 0; // Declare discountRate at function scope
    let numberOfItems = saleItems.length;
    
    // Calculate subtotal from sale items
    for (const item of saleItems) {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;
    }
    
    // If subtotal is 0, use the total_amount from sales table and reverse-calculate subtotal
    if (subtotal === 0) {
      numberOfItems = sale.quantity || 1;
      // Use the stored discount_amount from sales table if available
      if (sale.discount_amount && parseFloat(sale.discount_amount) > 0) {
        discountAmount = parseFloat(sale.discount_amount);
        subtotal = parseFloat(sale.total_amount) + discountAmount; // Reverse-calculate original subtotal
        console.log('📊 Using stored discount from sales table:', {
          discountAmount,
          totalAmount: sale.total_amount,
          calculatedSubtotal: subtotal
        });
      } else {
        subtotal = parseFloat(sale.total_amount) || 0;
        console.log('📊 No stored discount found, using total as subtotal');
      }
    } else {
      // We calculated subtotal from items, now use stored discount amount if available
      if (sale.discount_amount && parseFloat(sale.discount_amount) > 0) {
        discountAmount = parseFloat(sale.discount_amount);
        console.log('📊 Using stored discount amount from sales table:', discountAmount);
      } else {
        // Fallback to calculating discount if not stored
        
        // Check for discount rate from multiple sources
        if (customerInfo.customerType === 'reseller' && customerInfo.resellerInfo && customerInfo.resellerInfo.discountRate) {
          discountRate = customerInfo.resellerInfo.discountRate;
          console.log('📊 Using reseller discount from customerInfo:', discountRate + '%');
        } else if (sale.discount_rate && parseFloat(sale.discount_rate) > 0) {
          discountRate = parseFloat(sale.discount_rate);
          console.log('📊 Using discount from sale data:', discountRate + '%');
        } else if (sale.customer_type === 'reseller' && customerInfo.resellerInfo && customerInfo.resellerInfo.discountRate) {
          discountRate = customerInfo.resellerInfo.discountRate;
          console.log('📊 Using reseller discount for reseller customer type:', discountRate + '%');
        } else if (sale.customer_type === 'reseller' && discountRate === 0) {
          // 🔧 FALLBACK: Apply default reseller discount if none is set
          discountRate = 15; // Default 15% discount for resellers
          console.log('📊 Applying default reseller discount (15%) as fallback');
        }
        
        // Apply discount if we have a rate
        if (discountRate > 0) {
          discountAmount = subtotal * (discountRate / 100);
          console.log('💰 Calculated discount:', {
            discountRate: discountRate + '%',
            subtotal,
            discountAmount
          });
        } else {
          console.log('💰 No discount applied');
        }
      }
    }
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const totalAmount = taxableAmount + taxAmount;
    
    // Calculate due date (30 days from now)
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Use customer info from customerInfo parameter or fallback to sale data
    const finalCustomerName = customerInfo.name || sale.customer_name;
    const finalCustomerEmail = customerInfo.email || sale.customer_email;
    const finalCustomerType = customerInfo.customerType || sale.customer_type || 'Standard';
    
    console.log('💰 Calculated amounts:', {
      subtotal,
      discountRate: discountRate + '%',
      discountAmount,
      taxAmount,
      totalAmount,
      numberOfItems,
      saleDiscountRate: sale.discount_rate,
      customerType: finalCustomerType,
      resellerDiscountRate: customerInfo.resellerInfo?.discountRate
    });
    
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
      finalCustomerName,
      finalCustomerEmail,
      finalCustomerType,
      'draft',
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      numberOfItems,
      sale.payment_method || 'cash',
      paymentTerms,
      customerInfo.customerType === 'reseller' && customerInfo.resellerInfo ? customerInfo.resellerInfo.resellerId : null,
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

/**
 * GET /api/invoices/debug/:saleId
 * Debug endpoint to check discount calculation for a sale
 */
router.get('/debug/:saleId', async (req, res) => {
  try {
    const { saleId } = req.params;
    
    // Fetch sale data
    const [saleRows] = await db.query(`
      SELECT * FROM sales WHERE id = ?
    `, [saleId]);
    
    if (saleRows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    const sale = saleRows[0];
    
    // Parse items
    let saleItems = [];
    try {
      if (sale.items) {
        saleItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
      }
    } catch (e) {
      saleItems = [];
    }
    
    // Calculate subtotal
    let subtotal = 0;
    for (const item of saleItems) {
      subtotal += (item.price || 0) * (item.quantity || 1);
    }
    if (subtotal === 0) {
      subtotal = parseFloat(sale.total_amount) || 0;
    }
    
    // Check discount
    const saleDiscountRate = parseFloat(sale.discount_rate) || 0;
    const calculatedDiscountAmount = subtotal * (saleDiscountRate / 100);
    
    res.json({
      sale: {
        id: sale.id,
        customer_name: sale.customer_name,
        customer_type: sale.customer_type,
        discount_rate: sale.discount_rate,
        total_amount: sale.total_amount
      },
      calculations: {
        subtotal,
        saleDiscountRate,
        calculatedDiscountAmount,
        saleItems
      }
    });
  } catch (err) {
    console.error('❌ Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;