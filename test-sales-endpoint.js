// Test script to validate sales data is being saved correctly
const http = require('http');

// Create a new sale record
const newSale = {
  customer_name: "Final Test Customer",
  customer_email: "final-test@example.com",
  items: [
    {
      id: 777,
      name: "Test Product",
      price: 99.99,
      quantity: 2
    }
  ],
  payment_method: "card",
  status: "completed"
};

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sales',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Sending request to create a new sale:');
console.log(JSON.stringify(newSale, null, 2));

// Make the HTTP request
const req = http.request(options, (res) => {
  let data = '';
  
  // Collect response data
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process the complete response
  res.on('end', () => {
    console.log(`\nStatus Code: ${res.statusCode}`);
    
    if (res.statusCode === 201) {
      console.log('✅ Success! Sale was created');
      
      try {
        const response = JSON.parse(data);
        console.log('\nResponse data:');
        console.log(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error parsing response:', error);
        console.log('Raw response:', data);
      }
    } else {
      console.log('❌ Failed to create sale');
      console.log('Response:', data);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Request error:', error);
});

// Send the request body
req.write(JSON.stringify(newSale));
req.end();
