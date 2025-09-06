const mysql = require('mysql2/promise');

async function checkInvoicesTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS'
    });

    console.log('=== INVOICES TABLE STRUCTURE ===');
    const [columns] = await connection.execute('DESCRIBE invoices');
    console.table(columns);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkInvoicesTable();
