// Comprehensive Database Connection and Table Verification Test
const db = require('./src/db');

console.log('🔍 Starting comprehensive database test...\n');

async function testDatabase() {
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic database connection...');
    const [basicTest] = await db.query('SELECT 1 + 1 AS result, DATABASE() AS current_db, NOW() AS timestamp');
    console.log('✅ Connection successful!');
    console.log('   Current database:', basicTest[0].current_db);
    console.log('   Test result:', basicTest[0].result);
    console.log('   Timestamp:', basicTest[0].timestamp);
    console.log('');

    // Test 2: Show all databases
    console.log('2️⃣ Checking available databases...');
    const [databases] = await db.query('SHOW DATABASES');
    console.log('📋 Available databases:');
    databases.forEach((db, index) => {
      const dbName = Object.values(db)[0];
      console.log(`   ${index + 1}. ${dbName} ${dbName === 'POS' ? '← Target Database' : ''}`);
    });
    console.log('');

    // Test 3: Use POS database and show tables
    console.log('3️⃣ Checking tables in POS database...');
    await db.query('USE POS');
    const [tables] = await db.query('SHOW TABLES');
    
    const expectedTables = [
      'customers',
      'accounts', 
      'user_slots',
      'product_categories',
      'sales',
      'invoices',
      'transactions',
      'subscriptions'
    ];

    console.log(`📊 Found ${tables.length} tables in POS database:`);
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found! Database structure needs to be created.');
      return false;
    }

    const existingTables = tables.map(table => Object.values(table)[0]);
    
    existingTables.forEach((tableName, index) => {
      const isExpected = expectedTables.includes(tableName);
      console.log(`   ${index + 1}. ${tableName} ${isExpected ? '✅' : '❓'}`);
    });

    // Test 4: Check for missing tables
    console.log('');
    console.log('4️⃣ Checking for missing required tables...');
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('✅ All required tables exist!');
    }

    // Test 5: Test each table structure
    console.log('');
    console.log('5️⃣ Testing table structures...');
    
    for (const tableName of existingTables) {
      try {
        const [columns] = await db.query(`DESCRIBE ${tableName}`);
        console.log(`   📋 ${tableName}: ${columns.length} columns`);
        
        // Test if we can read from the table
        const [count] = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`      📊 Records: ${count[0].count}`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: Error - ${error.message}`);
      }
    }

    console.log('');
    console.log('🎉 Database connection test completed successfully!');
    return true;

  } catch (error) {
    console.error('');
    console.error('❌ Database test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Solution: Make sure MySQL server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   💡 Solution: Check username/password in db.js');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   💡 Solution: Create the POS database first');
    }
    
    return false;
  }
}

// Run the test
testDatabase()
  .then((success) => {
    if (success) {
      console.log('');
      console.log('🚀 Your database is ready for the application!');
      console.log('   Next step: Start the Express server with "node src\\app.cjs"');
    } else {
      console.log('');
      console.log('🔧 Database setup needed. Please:');
      console.log('   1. Ensure MySQL is running');
      console.log('   2. Create the POS database');
      console.log('   3. Run the SQL commands from database.txt');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
