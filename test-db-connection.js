const db = require('./src/db');

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connectivity
    const [testResult] = await db.query('SELECT 1 + 1 AS solution');
    console.log('✅ Database connection successful:', testResult[0].solution);
    
    // Check what tables exist
    const [tables] = await db.query('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Check accounts table structure
    try {
      const [accountsStructure] = await db.query('DESCRIBE accounts');
      console.log('📊 Accounts table structure:', accountsStructure.map(col => ({ Field: col.Field, Type: col.Type })));
      
      // Check if there's data in accounts
      const [accountCount] = await db.query('SELECT COUNT(*) as count FROM accounts');
      console.log('📈 Accounts count:', accountCount[0].count);
      
      // Sample account data
      const [sampleAccounts] = await db.query('SELECT id, product_name, is_active FROM accounts LIMIT 3');
      console.log('📝 Sample accounts:', sampleAccounts);
    } catch (accountsError) {
      console.error('❌ Error with accounts table:', accountsError.message);
    }
    
    // Check subscriptions table
    try {
      const [subscriptionsCount] = await db.query('SELECT COUNT(*) as count FROM subscriptions');
      console.log('📊 Subscriptions count:', subscriptionsCount[0].count);
    } catch (subscriptionsError) {
      console.error('❌ Error with subscriptions table:', subscriptionsError.message);
    }
    
    // Check transactions table
    try {
      const [transactionsCount] = await db.query('SELECT COUNT(*) as count FROM transactions');
      console.log('💰 Transactions count:', transactionsCount[0].count);
    } catch (transactionsError) {
      console.error('❌ Error with transactions table:', transactionsError.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('📋 Error details:', {
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    process.exit(0);
  }
}

testDatabaseConnection();
