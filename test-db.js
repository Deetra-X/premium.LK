// Simple database connection test
console.log('Testing database connection...');

try {
  const db = require('./src/db');
  console.log('Database module loaded successfully');
  
  // Test the connection
  db.query('SELECT 1 + 1 AS solution')
    .then(([rows]) => {
      console.log('✅ Database connection successful!');
      console.log('Test query result:', rows[0]);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database connection failed:');
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      console.error('Error SQL state:', error.sqlState);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Failed to load database module:');
  console.error(error.message);
  process.exit(1);
}
