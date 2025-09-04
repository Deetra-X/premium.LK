// // Simple server endpoint test
// const express = require('express');
// const app = express();
// const db = require('./src/db');

// app.use(express.json());

// // Basic test endpoint
// app.get('/test', (req, res) => {
//   res.json({ message: 'Server is working!', timestamp: new Date() });
// });

// // Database connection test
// app.get('/test-db', async (req, res) => {
//   try {
//     console.log('Testing database connection...');
//     const [result] = await db.query('SELECT 1 + 1 AS solution, DATABASE() as current_db');
//     console.log('Database test successful:', result[0]);
//     res.json({ 
//       success: true, 
//       message: 'Database connection works!', 
//       result: result[0] 
//     });
//   } catch (error) {
//     console.error('Database test failed:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message,
//       code: error.code 
//     });
//   }
// });

// // Check if tables exist
// app.get('/test-tables', async (req, res) => {
//   try {
//     console.log('Checking database tables...');
    
//     // Switch to POS database
//     await db.query('USE POS');
    
//     // Get all tables
//     const [tables] = await db.query('SHOW TABLES');
//     console.log('Tables found:', tables);
    
//     const tableNames = tables.map(table => Object.values(table)[0]);
    
//     res.json({ 
//       success: true, 
//       database: 'POS',
//       tables: tableNames,
//       count: tableNames.length 
//     });
//   } catch (error) {
//     console.error('Table check failed:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message,
//       code: error.code 
//     });
//   }
// });

// // Test a simple accounts query
// app.get('/test-accounts', async (req, res) => {
//   try {
//     console.log('Testing accounts table...');
//     await db.query('USE POS');
    
//     const [result] = await db.query('SELECT COUNT(*) as count FROM accounts');
//     console.log('Accounts query successful:', result[0]);
    
//     res.json({ 
//       success: true, 
//       accounts_count: result[0].count 
//     });
//   } catch (error) {
//     console.error('Accounts test failed:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message,
//       code: error.code,
//       details: 'This usually means the accounts table does not exist'
//     });
//   }
// });

// const PORT = 3002; // Use different port to avoid conflicts
// app.listen(PORT, () => {
//   console.log(`🚀 Test server running on port ${PORT}`);
//   console.log(`📋 Test endpoints:`);
//   console.log(`   http://localhost:${PORT}/test`);
//   console.log(`   http://localhost:${PORT}/test-db`);
//   console.log(`   http://localhost:${PORT}/test-tables`);
//   console.log(`   http://localhost:${PORT}/test-accounts`);
// });
