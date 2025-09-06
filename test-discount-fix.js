const mysql = require('mysql2/promise');

async function testDiscountFix() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS'
    });

    console.log('=== TESTING DISCOUNT AMOUNT FIX ===\n');

    // 1. Create a test sale with discount
    console.log('1. Creating a test reseller sale with discount...');
    
    const testSale = {
      customer_name: 'Test Reseller Customer',
      customer_email: 'test@reseller.com',
      customer_phone: '1234567890',
      customer_type: 'reseller',
      items: [
        { product_id: 1, product_name: 'Test Product', price: 100, quantity: 2, email: 'ghj@gmail.com' }
      ],
      total_amount: 100, // This should be calculated
      discount_rate: 15, // 15% discount
      payment_method: 'card',
      status: 'completed'
    };

    const response = await fetch('http://localhost:3001/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSale)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sale created successfully:', result.order_number);
      
      // 2. Check the sales table for discount amount
      console.log('\n2. Checking sales table for discount amount...');
      const [salesRows] = await connection.execute(
        'SELECT order_number, customer_name, total_amount, discount_rate, discount_amount FROM sales WHERE order_number = ?',
        [result.order_number]
      );
      
      if (salesRows.length > 0) {
        console.table(salesRows);
        
        const sale = salesRows[0];
        const expectedDiscountAmount = 200 * 0.15; // 15% of $200 (2 * $100)
        const actualDiscountAmount = parseFloat(sale.discount_amount);
        
        console.log(`\n💰 Discount Calculation Check:`);
        console.log(`Expected discount amount: $${expectedDiscountAmount}`);
        console.log(`Actual discount amount: $${actualDiscountAmount}`);
        console.log(`Match: ${Math.abs(expectedDiscountAmount - actualDiscountAmount) < 0.01 ? '✅' : '❌'}`);
      } else {
        console.log('❌ Sale not found in database');
      }
    } else {
      const error = await response.text();
      console.log('❌ Failed to create sale:', error);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDiscountFix();
