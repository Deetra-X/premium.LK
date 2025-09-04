// Test insert directly into the database
const mysql = require('mysql2/promise');

async function run() {
  console.log('===== DIRECT DATABASE INSERT TEST =====');
  
  let connection;
  try {
    // Connect to the database
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS',
      port: 3306
    });
    console.log('Connected successfully!');
    
    // Get current sales count
    const [initialSales] = await connection.execute('SELECT COUNT(*) AS count FROM sales');
    console.log(`Initial sales count: ${initialSales[0].count}`);
    
    // Create test data
    const timestamp = new Date().toISOString();
    const orderNumber = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const items = [
      {
        id: 77777,
        name: `Direct DB Test Item ${timestamp}`,
        price: 399,
        quantity: 2
      }
    ];
    
    // Insert directly into database
    console.log('\nInserting test sale directly into database...');
    const [result] = await connection.execute(`
      INSERT INTO sales (
        order_number, customer_name, customer_email,
        items, total_amount, payment_method, status, order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      `Direct DB Test ${timestamp}`,
      'direct.test@example.com',
      JSON.stringify(items),
      399 * 2,
      'card',
      'completed',
      new Date()
    ]);
    
    console.log('Insert result:', result);
    console.log(`Rows affected: ${result.affectedRows}`);
    console.log(`Insert ID: ${result.insertId}`);
    
    // Verify the record was inserted
    const [updatedSales] = await connection.execute('SELECT COUNT(*) AS count FROM sales');
    console.log(`Updated sales count: ${updatedSales[0].count}`);
    
    if (updatedSales[0].count > initialSales[0].count) {
      console.log('✅ SUCCESS: Record was inserted correctly!');
      
      // Retrieve the inserted record
      const [newSale] = await connection.execute('SELECT * FROM sales WHERE id = ?', [result.insertId]);
      
      if (newSale.length > 0) {
        console.log('\nInserted record:');
        console.log(JSON.stringify(newSale[0], null, 2));
      } else {
        console.log('❌ ERROR: Could not retrieve the inserted record by ID!');
      }
    } else {
      console.log('❌ ERROR: Record count did not increase after insert!');
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    if (connection) {
      console.log('Closing database connection...');
      await connection.end();
    }
  }
}

// Run the test
run();
