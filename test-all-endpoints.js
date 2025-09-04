const express = require('express');
const db = require('./src/db');

// Simple test to check if database connection and basic queries work
async function testEndpoints() {
  console.log('🔍 Testing database endpoints...\n');

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    await db.query('SELECT 1 as test');
    console.log('✅ Database connection successful\n');

    // Test categories endpoint functionality
    console.log('2️⃣ Testing categories table...');
    const [categories] = await db.query('SELECT COUNT(*) as count FROM product_categories WHERE is_active = 1');
    console.log(`✅ Categories table accessible, ${categories[0].count} active categories\n`);

    // Test accounts endpoint functionality
    console.log('3️⃣ Testing accounts table...');
    const [accounts] = await db.query('SELECT COUNT(*) as count FROM accounts WHERE is_active = 1');
    console.log(`✅ Accounts table accessible, ${accounts[0].count} active accounts\n`);

    // Test dashboard metrics
    console.log('4️⃣ Testing dashboard metrics...');
    const [metrics] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM accounts WHERE is_active = 1) as activeAccounts,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as activeSales,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'sale' AND status = 'completed') as totalRevenue
    `);
    console.log(`✅ Dashboard metrics: ${metrics[0].activeAccounts} accounts, ${metrics[0].activeSales} sales, $${metrics[0].totalRevenue} revenue\n`);

    console.log('🎉 All database tests passed!');
    console.log('💡 You can now start your Express server with: node src/app.cjs');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure MySQL service is running');
    console.log('2. Check database connection settings in src/db.js');
    console.log('3. Ensure POS database exists');
    console.log('4. Run the database schema: mysql -u root -p POS < database.txt');
    console.log('5. Insert sample data: mysql -u root -p POS < sample-data.sql');
  } finally {
    process.exit(0);
  }
}

testEndpoints();
