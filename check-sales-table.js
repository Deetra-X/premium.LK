const mysql = require('mysql2/promise');

async function checkSalesTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS'
    });

    console.log('=== SALES TABLE STRUCTURE ===');
    const [columns] = await connection.execute('DESCRIBE sales');
    console.table(columns);

    console.log('\n=== SAMPLE SALES DATA ===');
    const [sales] = await connection.execute('SELECT order_number, customer_name, total_amount, discount_rate FROM sales LIMIT 5');
    console.table(sales);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSalesTable();
