const db = require('./src/db');

async function testInsert() {
  try {
    console.log('DIAGNOSTIC TEST: Checking current records before insert...');
    
    // Check current records first
    let [beforeRecords] = await db.query('SELECT COUNT(*) as count FROM sales');
    console.log(`Current record count: ${beforeRecords[0].count}`);
    
    console.log('\nTesting direct insert with explicit values...');
    
    const now = new Date();
    const orderNumber = `#${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Insert a test record with explicit values for debugging
    console.log('Attempting insert with these values:');
    console.log('- Order Number:', orderNumber);
    console.log('- Customer:', 'Diagnostic Test');
    console.log('- Email:', 'diagnostic@test.com');
    console.log('- Total Amount:', 25);
    
    const [result] = await db.query(`
      INSERT INTO sales (
        order_number, customer_name, customer_email, items, 
        total_amount, payment_method, status, order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      'Diagnostic Test',
      'diagnostic@test.com',
      JSON.stringify([{id: 999, name: 'Diagnostic Item', price: 25, quantity: 1}]),
      25,
      'cash',
      'completed',
      now
    ]);
    
    console.log('\nInsert result:', result);
    console.log('Insert successful, insertId:', result.insertId);
    
    // Verify the insert by checking record count
    let [afterRecords] = await db.query('SELECT COUNT(*) as count FROM sales');
    console.log(`\nRecord count after insert: ${afterRecords[0].count}`);
    
    if (afterRecords[0].count > beforeRecords[0].count) {
      console.log('✅ SUCCESS: New record was saved to database!');
    } else {
      console.log('❌ ERROR: Record count did not increase, insert may have failed');
    }
    
    // Query the records to see if our insert worked - using id DESC instead of created_at
    const [records] = await db.query('SELECT * FROM sales ORDER BY id DESC LIMIT 3');
    console.log('\nMost recent records:');
    console.log(JSON.stringify(records, null, 2));
    
    // Check for our specific record
    const [specificRecord] = await db.query('SELECT * FROM sales WHERE customer_email = ?', ['diagnostic@test.com']);
    console.log('\nOur specific record:');
    console.log(JSON.stringify(specificRecord, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Insert error:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    process.exit(1);
  }
}

// Run the test
console.log('Starting database diagnostic test...');
testInsert();
