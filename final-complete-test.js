// Final comprehensive test creating a new sale, then verifying it in the database
const http = require('http');
const { spawn } = require('child_process');

// Function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`Making ${method} request to ${path}`);
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData,
          };
          
          try {
            result.parsedBody = JSON.parse(responseData);
          } catch (e) {
            // Handle non-JSON response
            result.parsedBody = null;
          }
          
          resolve(result);
        } catch (e) {
          reject(new Error(`Error processing response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to query database directly
function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    const command = `
      const db = require('./src/db');
      (async () => {
        try {
          const [results] = await db.query('${sql}', ${JSON.stringify(params)});
          console.log(JSON.stringify(results));
          process.exit(0);
        } catch (err) {
          console.error('Error:', err);
          process.exit(1);
        }
      })()
    `;
    
    const nodeProcess = spawn('node', ['-e', command]);
    
    let stdout = '';
    let stderr = '';
    
    nodeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    nodeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    nodeProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (err) {
          reject(new Error(`Failed to parse DB result: ${err.message}`));
        }
      } else {
        reject(new Error(`DB query failed: ${stderr}`));
      }
    });
  });
}

// Main function
async function run() {
  try {
    console.log('===== FINAL SALES API VERIFICATION TEST =====');
    
    // Create a unique timestamp for this test
    const timestamp = new Date().toISOString();
    console.log(`\nUsing timestamp: ${timestamp}`);
    
    // Create a new test sale
    const testSale = {
      customer_name: `Final Test ${timestamp}`,
      customer_email: 'final.test@example.com',
      items: [
        {
          id: 12345,
          name: `Test Product ${timestamp}`,
          price: 599,
          quantity: 2
        }
      ],
      payment_method: 'card',
      status: 'completed'
    };
    
    console.log('\n1. Creating a new sale via API...');
    console.log('Request data:', JSON.stringify(testSale, null, 2));
    
    const createResult = await makeRequest('POST', '/api/sales', testSale);
    console.log(`Response status: ${createResult.statusCode}`);
    console.log(`Response body: ${createResult.body}`);
    
    if (createResult.statusCode !== 201) {
      throw new Error(`Expected 201 status code but got ${createResult.statusCode}`);
    }
    
    // Check database directly to verify the new sale
    console.log('\n2. Checking database for newly created sale...');
    const latestSales = await queryDatabase('SELECT * FROM sales ORDER BY id DESC LIMIT 1');
    
    if (!latestSales || latestSales.length === 0) {
      console.log('❌ ERROR: No sales found in database');
    } else {
      const latestSale = latestSales[0];
      console.log('Latest sale in database:');
      console.log(JSON.stringify(latestSale, null, 2));
      
      // Check if this is our test sale
      if (latestSale.customer_name.includes(timestamp)) {
        console.log('\n✅ SUCCESS: Found our test sale in the database with ID', latestSale.id);
        console.log('The sales API is correctly saving data to the database.');
        
        // Now test retrieval
        console.log('\n3. Testing API retrieval of the newly created sale...');
        const getResult = await makeRequest('GET', `/api/sales/${latestSale.id}`);
        console.log(`GET by ID response status: ${getResult.statusCode}`);
        
        if (getResult.statusCode === 200) {
          console.log('✅ SUCCESS: API correctly returned the sale by ID');
          console.log('Retrieved data:', getResult.body.substring(0, 100) + '...');
        } else {
          console.log('❌ ERROR: API failed to return the sale by ID');
        }
      } else {
        console.log('❌ ERROR: Latest sale in database does not match our test data');
      }
    }
    
    console.log('\nTEST COMPLETE');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
run();
