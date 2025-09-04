// Final test script for sales API
const http = require('http');

// Create a test sale object
const testSale = {
  customer_name: "FINAL API TEST",
  customer_email: "final-api@example.com",
  items: [
    {
      id: 1000,
      name: "Final API Test Product",
      price: 500,
      quantity: 1
    }
  ],
  payment_method: "card"
};

console.log('Making final test request with data:');
console.log(JSON.stringify(testSale, null, 2));

// Make the request
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sales',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`\nResponse status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
      
      // If successful, verify by checking the database
      if (res.statusCode === 201) {
        console.log('\nChecking database to confirm record was saved...');
        const db = require('./src/db');
        
        // Wait a moment to ensure database write is complete
        setTimeout(async () => {
          try {
            const [records] = await db.query('SELECT * FROM sales ORDER BY id DESC LIMIT 1');
            
            if (records.length > 0) {
              const latestRecord = records[0];
              console.log('\nLatest record in database:');
              console.log(`- ID: ${latestRecord.id}`);
              console.log(`- Order: ${latestRecord.order_number}`);
              console.log(`- Customer: ${latestRecord.customer_name}`);
              console.log(`- Email: ${latestRecord.customer_email}`);
              console.log(`- Amount: ${latestRecord.total_amount}`);
              
              // Check if this is our record
              if (latestRecord.customer_name === testSale.customer_name && 
                  latestRecord.customer_email === testSale.customer_email) {
                console.log('\n✅ SUCCESS! The record was saved to the database correctly.');
              } else {
                console.log('\n❓ The latest record does not match our test data.');
              }
            } else {
              console.log('\n❌ No records found in the database!');
            }
            
            process.exit(0);
          } catch (dbError) {
            console.error('\nError checking database:', dbError);
            process.exit(1);
          }
        }, 500);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Send the request body
req.write(JSON.stringify(testSale));
req.end();
