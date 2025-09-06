// Test invoice creation directly to see the exact error
const testInvoiceCreation = async () => {
  console.log('🧾 Testing invoice creation...');
  
  // First, let's get a sale ID from the database to use for invoice creation
  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS'
    });

    console.log('✅ Database connected');

    // Get the latest sale that has a discount rate
    const [sales] = await connection.execute(
      'SELECT * FROM sales WHERE discount_rate > 0 ORDER BY id DESC LIMIT 1'
    );

    if (sales.length === 0) {
      console.log('❌ No sales with discount found');
      await connection.end();
      return;
    }

    const sale = sales[0];
    console.log('📊 Found sale with discount:', {
      id: sale.id,
      order_number: sale.order_number,
      customer_name: sale.customer_name,
      total_amount: sale.total_amount,
      discount_rate: sale.discount_rate,
      discount_amount: sale.discount_amount
    });

    await connection.end();

    // Now test the invoice creation API
    const invoiceData = {
      saleId: sale.id,
      customerInfo: {
        name: sale.customer_name,
        email: sale.customer_email,
        customerType: sale.customer_type || 'reseller'
      },
      paymentTerms: 'Payment due within 30 days',
      taxRate: 15,
      notes: 'Test invoice creation'
    };

    console.log('📤 Sending invoice creation request:', JSON.stringify(invoiceData, null, 2));

    const response = await fetch('http://localhost:3001/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Invoice created successfully:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Invoice creation failed:', errorText);
      
      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Parsed error details:', errorJson);
      } catch (parseError) {
        console.log('📋 Raw error text:', errorText);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testInvoiceCreation();
