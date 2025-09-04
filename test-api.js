// const http = require('http');

// // Create a simple test client
// const testAPI = (path) => {
//   const options = {
//     hostname: 'localhost',
//     port: 3002,
//     path: path,
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     }
//   };

//   console.log(`Testing API endpoint: ${options.method} http://${options.hostname}:${options.port}${options.path}`);

//   const req = http.request(options, (res) => {
//     console.log(`STATUS: ${res.statusCode}`);
//     console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    
//     let data = '';
//     res.on('data', (chunk) => {
//       data += chunk;
//     });
    
//     res.on('end', () => {
//       console.log(`RESPONSE DATA: ${data}`);
//       console.log('----------------------------');
//     });
//   });

//   req.on('error', (error) => {
//     console.error(`ERROR: ${error.message}`);
//   });

//   req.end();
// };

// // Test multiple endpoints
// console.log('Starting API tests...');
// testAPI('/');
// setTimeout(() => testAPI('/api-status'), 500);
// setTimeout(() => testAPI('/api/sales'), 1000);

// // Test with POST
// setTimeout(() => {
//   const options = {
//     hostname: 'localhost',
//     port: 3002,
//     path: '/api/sales',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     }
//   };

//   console.log(`Testing POST: ${options.method} http://${options.hostname}:${options.port}${options.path}`);
  
//   const req = http.request(options, (res) => {
//     console.log(`STATUS: ${res.statusCode}`);
//     let data = '';
    
//     res.on('data', (chunk) => {
//       data += chunk;
//     });
    
//     res.on('end', () => {
//       console.log(`RESPONSE DATA: ${data}`);
//     });
//   });

//   req.on('error', (error) => {
//     console.error(`ERROR: ${error.message}`);
//   });

//   const postData = JSON.stringify({
//     customerName: 'Test Customer',
//     customerEmail: 'test@example.com',
//     items: [{
//       productName: 'Test Product',
//       price: 100,
//       quantity: 1
//     }],
//     totalAmount: 100,
//     paymentMethod: 'cash'
//   });

//   req.write(postData);
//   req.end();
// }, 1500);
