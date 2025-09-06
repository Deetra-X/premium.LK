// Direct frontend to database test - bypass all intermediate processing
const testDirectDatabaseInsert = async () => {
  console.log('🔥 DIRECT DATABASE TEST - Frontend to Database');
  
  // Simulate exact frontend form data with 40% discount
  const frontendFormData = {
    customerName: "Frontend Test Customer",
    customerEmail: "frontend@test.com",
    customerPhone: "+94771234567",
    customerType: "reseller",
    discountRate: 40, // This is what user enters in frontend
    items: [{
      productId: "test-product-123",
      productName: "Test Product",
      price: 100,
      quantity: 1,
      email: "frontend@test.com"
    }],
    totalAmount: 100,
    paymentMethod: "cash",
    status: "completed"
  };

  console.log('📝 Frontend form data:', frontendFormData);
  console.log('💯 Discount rate from frontend:', frontendFormData.discountRate);

  // Calculate discount amount exactly as it should be
  const discountAmount = (frontendFormData.totalAmount * frontendFormData.discountRate) / 100;
  const finalAmount = frontendFormData.totalAmount - discountAmount;

  console.log('🧮 Calculated discount amount:', discountAmount);
  console.log('💰 Final amount after discount:', finalAmount);

  // Direct database insertion - exactly what should be stored
  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS'
    });

    console.log('✅ Database connected');

    // Generate order number
    const orderNumber = `#${Math.floor(10000 + Math.random() * 90000)}`;

    // Insert directly into sales table with correct discount data
    const insertQuery = `
      INSERT INTO sales (
        order_number, 
        customer_name, 
        customer_email, 
        customer_phone, 
        customer_type,
        items, 
        total_amount, 
        discount_rate, 
        discount_amount,
        payment_method, 
        status,
        order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      orderNumber,
      frontendFormData.customerName,
      frontendFormData.customerEmail,
      frontendFormData.customerPhone,
      frontendFormData.customerType,
      JSON.stringify(frontendFormData.items),
      finalAmount, // Store final amount after discount
      frontendFormData.discountRate, // Store the actual discount rate (40)
      discountAmount, // Store the calculated discount amount
      frontendFormData.paymentMethod,
      frontendFormData.status
    ];

    console.log('📤 Values being inserted:', values);

    const [result] = await connection.execute(insertQuery, values);
    console.log('✅ Direct database insert successful:', result);

    // Verify what was actually stored
    const [verifyRows] = await connection.execute(
      'SELECT order_number, customer_name, total_amount, discount_rate, discount_amount FROM sales WHERE order_number = ?',
      [orderNumber]
    );

    console.log('🔍 Verification - What was actually stored in database:');
    console.table(verifyRows);

    // Also create an invoice from this sale to test invoice creation
    if (verifyRows.length > 0) {
      const sale = verifyRows[0];
      
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceQuery = `
        INSERT INTO invoices (
          invoice_number,
          status,
          customer_name,
          customer_email,
          customer_type,
          issue_date,
          due_date,
          number_of_items,
          payment_method,
          subtotal,
          discount_amount,
          tax_amount,
          total_amount
        ) VALUES (?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, ?, ?, ?, ?, ?)
      `;

      const invoiceValues = [
        invoiceNumber,
        'pending',
        sale.customer_name,
        frontendFormData.customerEmail,
        'Reseller', // Invoice table expects 'Reseller' not 'reseller'
        frontendFormData.items.length,
        frontendFormData.paymentMethod,
        frontendFormData.totalAmount, // Original subtotal before discount
        sale.discount_amount, // Use stored discount amount
        0, // No tax for this test
        sale.total_amount // Final amount after discount
      ];

      const [invoiceResult] = await connection.execute(invoiceQuery, invoiceValues);
      console.log('✅ Invoice created:', invoiceResult);

      // Verify invoice
      const [invoiceRows] = await connection.execute(
        'SELECT invoice_number, customer_name, subtotal, discount_amount, total_amount FROM invoices WHERE invoice_number = ?',
        [invoiceNumber]
      );

      console.log('🧾 Invoice verification:');
      console.table(invoiceRows);
    }

    await connection.end();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Database error:', error);
  }
};

// Run the test
testDirectDatabaseInsert();
