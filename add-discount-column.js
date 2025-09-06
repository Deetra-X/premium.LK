const mysql = require('mysql2/promise');

async function addDiscountAmountColumn() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'POS'
    });

    console.log('Adding discount_amount column to sales table...');
    
    // Add discount_amount column after discount_rate
    await connection.execute(`
      ALTER TABLE sales 
      ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00 
      AFTER discount_rate
    `);

    console.log('✅ Successfully added discount_amount column to sales table');

    // Verify the column was added
    console.log('\n=== UPDATED SALES TABLE STRUCTURE ===');
    const [columns] = await connection.execute('DESCRIBE sales');
    const relevantColumns = columns.filter(col => 
      ['total_amount', 'discount_rate', 'discount_amount'].includes(col.Field)
    );
    console.table(relevantColumns);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addDiscountAmountColumn();
