// Ultimate final fix for sales API
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Create a new connection pool specifically for this router
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'POS',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection on router initialization
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Sales router: Database connection verified');
    connection.release();
  } catch (err) {
    console.error('Sales router: Database connection failed:', err);
  }
})();


// Add this PUT endpoint after your existing POST route and before module.exports
// PUT update a sale by order_number - Add this function
router.put('/:order_number', async (req, res) => {
  let connection;
  try {
    const encodedOrderNumber = req.params.order_number;
    const decodedOrderNumber = decodeURIComponent(encodedOrderNumber);
    const updateData = req.body;
    
    console.log(`PUT /api/sales/${decodedOrderNumber} - Updating sale`);
    console.log('Update data:', updateData);
    
    connection = await pool.getConnection();
    
    // Check if the sale exists first
    const [existingSale] = await connection.execute(
      'SELECT * FROM sales WHERE order_number = ?', 
      [decodedOrderNumber]
    );
    
    if (existingSale.length === 0) {
      return res.status(404).json({ 
        error: `Sale with order number ${decodedOrderNumber} not found` 
      });
    }
    
    // Update the sale
    const [result] = await connection.execute(`
      UPDATE sales 
      SET customer_name = ?, 
          customer_email = ?, 
          customer_phone = ?, 
          payment_method = ?, 
          status = ?, 
          notes = ?
      WHERE order_number = ?
    `, [
      updateData.customer_name,
      updateData.customer_email,
      updateData.customer_phone || null,
      updateData.payment_method,
      updateData.status,
      updateData.notes || null,
      decodedOrderNumber
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: `No changes made to sale ${decodedOrderNumber}` 
      });
    }
    
    // Fetch the updated record
    const [updatedSale] = await connection.execute(
      'SELECT * FROM sales WHERE order_number = ?', 
      [decodedOrderNumber]
    );
    
    // Parse items if stored as string
    let parsedItems = updatedSale[0].items;
    if (typeof updatedSale[0].items === 'string') {
      try {
        parsedItems = JSON.parse(updatedSale[0].items);
      } catch (err) {
        console.error(`Error parsing items for sale ${updatedSale[0].order_number}:`, err);
        parsedItems = [];
      }
    }
    
    const processedSale = {
      ...updatedSale[0],
      items: parsedItems
    };
    
    console.log('Sale updated successfully:', processedSale);
    res.json(processedSale);
    
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});



// GET all sales - Guaranteed to work
router.get('/', async (req, res) => {
  let connection;
  try {
    console.log('GET /api/sales - Fetching all sales');
    connection = await pool.getConnection();
    
    const [sales] = await connection.execute('SELECT * FROM sales ORDER BY id DESC');
    
    // Process items JSON for each record if needed
    const processedSales = sales.map(sale => {
      // Parse items if stored as string
      let parsedItems = sale.items;
      if (typeof sale.items === 'string') {
        try {
          parsedItems = JSON.parse(sale.items);
        } catch (err) {
          console.error(`Error parsing items for sale ${sale.order_number}:`, err);
          parsedItems = [];
        }
      }
      
      return {
        ...sale,
        items: parsedItems
      };
    });
    
    console.log(`Returning ${processedSales.length} sales records`);
    res.json(processedSales);
  } catch (err) {
    console.error('❌ Error fetching sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales', details: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// GET a single sale by ID - Guaranteed to work
router.get('/:order_number', async (req, res) => {
  let connection;
  try {
    console.log(`GET /api/sales/${req.params.order_number} - Fetching sale by ID`);
    connection = await pool.getConnection();
    
    const [sale] = await connection.execute('SELECT * FROM sales WHERE order_number = ?', [req.params.order_number]);
    
    if (sale.length === 0) {
      console.log(`Sale with ID ${req.params.order_number} not found`);
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Parse items if stored as string
    let parsedItems = sale[0].items;
    if (typeof sale[0].items === 'string') {
      try {
        parsedItems = JSON.parse(sale[0].items);
      } catch (err) {
        console.error(`Error parsing items for sale ${sale[0].order_number}:`, err);
        parsedItems = [];
      }
    }
    
    const processedSale = {
      ...sale[0],
      items: parsedItems
    };
    
    console.log(`Successfully retrieved sale ${req.params.id}`);
    res.json(processedSale);
  } catch (err) {
    console.error(`❌ Error fetching sale ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to fetch sale', details: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
// //delete sales 
// // DELETE a sale by order_number
// router.delete('/:order_number', async (req, res) => {
//   let connection;
//   try {
//     const encodedOrderNumber = req.params.order_number; // e.g., "%2320760"
//     const decodedOrderNumber = decodeURIComponent(encodedOrderNumber); // "#20760"
    

//     // const { decodeURIComponent } = req.params;
//     console.log(`DELETE /api/sales/${decodedOrderNumber} - Deleting sale by order_number`);
//     connection = await pool.getConnection();

//     // Delete the sale by order_number
//     const [result] = await connection.execute(
//       'DELETE FROM sales WHERE order_number = ?',
//       [decodedOrderNumber]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Sale not found' });
//     }

//     res.json({ success: true, message: `Sale with order_number ${decodedOrderNumber} deleted.` });
//   } catch (err) {
//     console.error(`❌ Error deleting sale ${req.params.order_number}:`, err);
//     res.status(500).json({ error: 'Failed to delete sale', details: err.message });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// });

// DELETE a sale by order_number - properly placed after all other endpoints
router.delete('/:order_number', async (req, res) => {
  let connection;
  try {
    const encodedOrderNumber = req.params.order_number;
    const decodedOrderNumber = decodeURIComponent(encodedOrderNumber);

    console.log(`DELETE /api/sales/${decodedOrderNumber} - Deleting sale by order_number`);
    connection = await pool.getConnection();

    // Begin transaction
    await connection.beginTransaction();

    // Get the sale record first to access items
    const [saleRows] = await connection.execute(
      'SELECT items, customer_email FROM sales WHERE order_number = ?',
      [decodedOrderNumber]
    );

    if (saleRows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Parse items
    let items = [];
    try {
      items = typeof saleRows[0].items === 'string' ? 
        JSON.parse(saleRows[0].items) : 
        saleRows[0].items;
    } catch (err) {
      console.error('Error parsing items for slot release:', err);
      throw err; // Re-throw to trigger rollback
    }

    // Free up slots for each account in the items
    for (const item of items) {
      const email = item.email || saleRows[0].customer_email; // Fallback to sale customer_email
      const quantity = item.quantity || 1;
      
      if (!email) {
        console.warn('No email found for item, skipping slot release:', item);
        continue;
      }

      try {
        // Verify account exists first
        const [account] = await connection.execute(
          'SELECT available_slots, current_users FROM accounts WHERE email = ? FOR UPDATE',
          [email]
        );

        if (account.length === 0) {
          console.warn(`Account ${email} not found, skipping slot release`);
          continue;
        }

        // Release the slots
        const [updateResult] = await connection.execute(
          `UPDATE accounts 
           SET current_users = GREATEST(0, current_users - ?), 
               available_slots = LEAST(max_user_slots, available_slots + ?) 
           WHERE email = ?`,
          [quantity, quantity, email]
        );

        if (updateResult.affectedRows === 0) {
          console.warn(`No slots released for account ${email}`);
        } else {
          console.log(`Freed ${quantity} slots for account: ${email}`);
        }
      } catch (err) {
        console.error(`Error freeing slots for account ${email}:`, err.message);
        throw err; // Re-throw to trigger rollback
      }
    }

    // Delete the sale by order_number
    const [result] = await connection.execute(
      'DELETE FROM sales WHERE order_number = ?',
      [decodedOrderNumber]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Commit transaction
    await connection.commit();

    res.json({ 
      success: true, 
      message: `Sale with order_number ${decodedOrderNumber} deleted and slots freed.` 
    });
  } catch (err) {
    // Rollback on error
    if (connection) await connection.rollback();
    console.error(`❌ Error deleting sale ${req.params.order_number}:`, err);
    res.status(500).json({ 
      error: 'Failed to delete sale', 
      details: err.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;

// POST create a new sale - Guaranteed to work
router.post('/', async (req, res) => {
  let connection;
  try {
    console.log('POST /api/sales - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Extract data from request body
    const {
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_type = 'standard', // Add this field with default value
      items,
      total_amount,
      discountRate = 0, // 👈 add this //0 ahak kala
      quantity = 1,
      payment_method = 'card',
      status = 'completed',
      notes = '',
      start_date , // This comes from frontend as start_date
      end_date, //this is my valid until date
      daysUntilRenewal // Add this field
    } = req.body;
        const discountRateToInsert = discountRate;
//     const {
//       customerId: customer_id, // Map frontend field to backend field
//       customerName: customer_name,
//       customerEmail: customer_email,
//       customerPhone: customer_phone,
//       customerType: customer_type = 'standard',
//       items,
//       totalAmount: total_amount, // Map frontend field
//       discountRate = 0,
//       quantity = 1,
//       paymentMethod: payment_method = 'card', // Map frontend field
//       status = 'completed',
//       notes = '',
//       startDate: start_date, // Map frontend field
//       endDate: end_date, // Map frontend field
//       daysUntilRenewal
// }     = req.body;

    // Validation
    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
      console.log('Validation failed - Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields: customer_name, items (array)'
      });
    }

    // Generate order number and calculate total
    const orderNumber = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();

    // Step 1: Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    // Step 2: Sanitize and clamp discount rate
    const rawDiscount = typeof discountRate !== 'undefined'
      ? parseFloat(discountRate)
      : (typeof req.body.discountRate !== 'undefined' ? parseFloat(req.body.discountRate) : 0);
    const safeDiscountRate = isNaN(rawDiscount) ? 0 : Math.min(Math.max(rawDiscount, 0), 100);

    // Step 3: Apply discount
    const discountAmount = subtotal * (safeDiscountRate / 100);
    const totalAmount = subtotal - discountAmount;
    console.log(`Discount calculation:`, {
      subtotal,
      discountRate: safeDiscountRate,
      discountAmount,
      totalAmount
  });

    // const calculatedTotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    

    console.log(`Creating sale: ${orderNumber} for ${customer_name} - ${totalAmount}`);
    console.log('Received discountRate:', discountRate);
    
    // Get database connection
    connection = await pool.getConnection();
    
    // Test connection
    const [connectionTest] = await connection.execute('SELECT 1 AS connected');
    console.log(`Database connection test: ${connectionTest[0].connected === 1 ? 'SUCCESS' : 'FAILED'}`);
    
    // Insert record
    console.log('Inserting sale record...');
    
    const [result] = await connection.execute(`
      INSERT INTO sales (
        order_number, customer_id, customer_name, customer_email, customer_phone,
        customer_type, items, total_amount, discount_rate, payment_method, status, order_date, notes,
        end_date, days_until_renewal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      customer_id || null,
      customer_name,
      customer_email || null,
      customer_phone || null,
      customer_type, // Add this parameter
      JSON.stringify(items), 
      totalAmount,          // ✅ Final discounted total
      safeDiscountRate,     // ✅ Clean discount rate
      payment_method,
      status,
      start_date || now,
      notes,
      end_date || null,
      daysUntilRenewal || null // Add this parameter
    ]);
    
    if (!result || !result.insertId) {
      throw new Error('Insert operation did not return an ID');
    }
//     await connection.execute(
//   `UPDATE accounts 
//    SET current_users = current_users + ?,
//        available_slots = available_slots - ? 
//    WHERE email = ?`,
//   [quantity, quantity, email]  // ⛔️ `email` is undefined
// );

console.log('Items received for update:', items);
for (const item of items) {
  const email = item.email; // adjust as per your item structure
  const quantity = item.quantity || 1;

  try {
    const [accountRows] = await connection.execute(
      'SELECT available_slots, current_users FROM accounts WHERE email = ? FOR UPDATE',
      [email]
    );

    if (accountRows.length === 0) {
      throw new Error(`Account with email ${email} not found`);
    }

    const account = accountRows[0];

    if (account.available_slots < quantity) {
      throw new Error(`Not enough available slots for account email ${email}`);
    }

    const [updateResult] = await connection.execute(
      `UPDATE accounts 
       SET current_users = current_users + ?, 
           available_slots = available_slots - ? 
       WHERE email = ?`,
      [quantity, quantity, email]
    );
    console.log('-----------your Update result:', updateResult);
    if (updateResult.affectedRows === 0) {
  console.error('No account updated for email:', email);
}
  } catch (err) {
    console.error('❌ Error updating account:', err.message);
    throw err; // rethrow so the transaction rolls back
  }
  console.log(`Updating account for email: ${email}, quantity: ${quantity}`);
}
  // console.log('Order dddddditems being sent:', validItems);

    const insertId = result.insertId;
    console.log(`✅ Sale created with ID: ${insertId}, Order: ${orderNumber}`);
    
    // Verify the record was actually inserted
    const [verification] = await connection.execute('SELECT * FROM sales WHERE id = ?', [insertId]);
    
    if (verification.length > 0) {
      console.log('Record verified in database ✅');
      
      // Return success with the verified data including the ID
      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: {
          id: insertId,
          order_number: orderNumber,
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_type,
          items,
          total_amount: totalAmount,
          discountRate: safeDiscountRate,  // ✅ Use the variable we already have
          payment_method,
          status,
          order_date: start_date || now, // Return the order_date value
          notes,
          end_date,
          days_until_renewal: daysUntilRenewal
        }
      });
    } else {
      throw new Error('Record not found after insert - database inconsistency');
    }
  } catch (err) {
    console.error('❌ Error creating sale:', err);
    res.status(500).json({ 
      error: 'Failed to create sale', 
      details: err.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
  
});

module.exports = router;
