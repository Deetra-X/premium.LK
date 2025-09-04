// Quick database connection test
const db = require('./src/db');

console.log('🔍 Testing database connection...');

db.query('SELECT 1 + 1 AS result, "POS" AS database_name, NOW() AS current_time')
  .then(([rows]) => {
    console.log('✅ Database connection successful!');
    console.log('📊 Test results:', rows[0]);
    
    // Test if we can see any tables
    return db.query('SHOW TABLES');
  })
  .then(([tables]) => {
    console.log('📋 Tables in POS database:', tables.length);
    if (tables.length > 0) {
      console.log('📄 Available tables:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
      });
    } else {
      console.log('⚠️  No tables found in the database');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    if (error.sqlState) {
      console.error('   SQL State:', error.sqlState);
    }
    process.exit(1);
  });
