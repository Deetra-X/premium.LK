const mysql = require('mysql2/promise');

async function testXAMPPConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // XAMPP default (empty password)
      port: 3310    // Your custom port
    });

    console.log('✅ Connected to XAMPP MySQL successfully!');

    // Check if POS database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const posExists = databases.some(db => db.Database === 'POS');
    
    if (posExists) {
      console.log('✅ POS database found!');
      
      // Connect to POS database and check tables
      await connection.execute('USE POS');
      const [tables] = await connection.execute('SHOW TABLES');
      
      console.log('📊 Tables in POS database:');
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
      
      // Check if there's any data
      try {
        const [customers] = await connection.execute('SELECT COUNT(*) as count FROM customers');
        const [accounts] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
        console.log(`👥 Customers: ${customers[0].count}`);
        console.log(`💳 Accounts: ${accounts[0].count}`);
      } catch (error) {
        console.log('ℹ️  No data found in tables (this is normal if you haven\'t inserted sample data yet)');
      }
    } else {
      console.log('❌ POS database not found. Please create it in phpMyAdmin.');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ XAMPP Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure XAMPP MySQL service is running');
    console.log('2. Check if MySQL is running on port 3306');
    console.log('3. Verify XAMPP MySQL uses empty password for root user');
  }
}

testXAMPPConnection();
