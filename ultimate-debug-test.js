// Ultimate debugging test
const http = require('http');
const { spawn } = require('child_process');

console.log('===== ULTIMATE SALES API DEBUGGING TEST =====');

// Helper function to run a database query
function runDbQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    const command = `
      const mysql = require('mysql2/promise');
      
      async function runQuery() {
        let connection;
        try {
          connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'POS'
          });
          
          console.log('Connected to database');
          const [results] = await connection.execute('${query}', ${JSON.stringify(params)});
          console.log(JSON.stringify(results));
          return results;
        } catch (error) {
          console.error('Database error:', error);
          throw error;
        } finally {
          if (connection) {
            await connection.end();
            console.log('Connection closed');
          }
        }
      }
      
      runQuery()
        .then(() => process.exit(0))
        .catch(err => {
          console.error('Fatal error:', err);
          process.exit(1);
        });
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
          // Extract the JSON part from the output
          const jsonStart = stdout.indexOf('[');
          const jsonEnd = stdout.lastIndexOf(']') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonStr = stdout.substring(jsonStart, jsonEnd);
            resolve(JSON.parse(jsonStr));
          } else {
            resolve([]);
          }
        } catch (err) {
          console.error('Error parsing DB result:', err);
          console.error('Raw output:', stdout);
          reject(err);
        }
      } else {
        console.error('DB query failed with code', code);
        console.error('stderr:', stderr);
        reject(new Error(`DB query failed: ${stderr}`));
      }
    });
  });
}

// Function to make an HTTP request
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
        const result = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData,
        };
        
        try {
          result.parsedBody = JSON.parse(responseData);
        } catch (e) {
          result.parsedBody = null;
        }
        
        resolve(result);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Main test function
async function runTest() {
  try {
    // Step 1: Check database connection and see current data
    console.log('\n1. Checking database connection and current sales data...');
    const initialSales = await runDbQuery('SELECT * FROM sales ORDER BY id DESC LIMIT 3');
    
    console.log(`Database has ${initialSales.length} existing sales records`);
    if (initialSales.length > 0) {
      console.log('Latest sale ID:', initialSales[0].id);
    }
    
    // Step 2: Create a test sale via API
    const timestamp = new Date().toISOString();
    const testSale = {
      customer_name: `DB Test ${timestamp}`,
      customer_email: 'db.test@example.com',
      items: [
        {
          id: 99999,
          name: `DB Test Product ${timestamp}`,
          price: 499,
          quantity: 3
        }
      ],
      payment_method: 'card',
      status: 'completed'
    };
    
    console.log('\n2. Creating a test sale via API...');
    console.log('Request data:', JSON.stringify(testSale, null, 2));
    
    const createResponse = await makeRequest('POST', '/api/sales', testSale);
    
    console.log('API Response status:', createResponse.statusCode);
    console.log('API Response body:', createResponse.body);
    
    // Step 3: Verify the sale was created in the database
    console.log('\n3. Checking database again to verify sale was created...');
    const updatedSales = await runDbQuery('SELECT * FROM sales ORDER BY id DESC LIMIT 3');
    
    console.log(`Database now has ${updatedSales.length} sales records`);
    
    if (updatedSales.length > 0) {
      console.log('New latest sale:');
      console.log(JSON.stringify(updatedSales[0], null, 2));
      
      if (updatedSales[0].customer_name.includes(timestamp)) {
        console.log('\n✅ SUCCESS: Sale was correctly saved to the database!');
        console.log('Sale ID:', updatedSales[0].id);
        console.log('Order Number:', updatedSales[0].order_number);
        
        // Test GET by ID endpoint
        console.log('\n4. Testing GET by ID endpoint...');
        const getResponse = await makeRequest('GET', `/api/sales/${updatedSales[0].id}`);
        
        console.log('GET Response status:', getResponse.statusCode);
        console.log('GET Response contains correct data:', 
          getResponse.parsedBody && getResponse.parsedBody.customer_name === updatedSales[0].customer_name);
      } else {
        console.log('\n❌ ERROR: New sale not found in database or customer name mismatch!');
      }
    }
    
    console.log('\nTEST COMPLETE');
    
  } catch (error) {
    console.error('\nTEST FAILED:', error);
  }
}

// Run the test
runTest();
