const db = require('./src/db');

// Simple script to insert a sale record directly into the database
async function insertSale() {
  try {
    console.log('Starting direct database insert...');
    
    const orderNumber = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const items = [{ id: 888, name: "Final Test Item", price: 150, quantity: 1 }];
    
    console.log('Inserting sale with order number:', orderNumber);
    
    const [result] = await db.query(`
      INSERT INTO sales (
        order_number, customer_name, customer_email, items,
        total_amount, payment_method, status, order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      'Final Direct Test',
      'final@example.com',
      JSON.stringify(items),
      150,
      'card',
      'completed',
      new Date()
    ]);
    
    console.log('Insert result:', result);
    console.log(`✅ Sale inserted with ID: ${result.insertId}`);
    
    // Verify by retrieving the record
    const [records] = await db.query('SELECT * FROM sales WHERE id = ?', [result.insertId]);
    
    if (records.length > 0) {
      console.log('✅ Successfully verified record in database:');
      console.log(JSON.stringify(records[0], null, 2));
    } else {
      console.log('❌ Failed to retrieve the inserted record!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inserting sale:', err);
    process.exit(1);
  }
}

insertSale();
