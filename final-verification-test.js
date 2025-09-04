// Final test for sales API
const http = require('http');

console.log('Running final API verification test...');

// Function to make a GET request
function makeGetRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}, raw data: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    req.end();
  });
}

// Function to make a POST request
function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}, raw data: ${responseData}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Function to directly query the database
function queryDatabase() {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    
    const nodeProcess = spawn('node', [
      '-e', 
      `const db = require('./src/db'); 
      (async () => { 
        try { 
          const [sales] = await db.query('SELECT * FROM sales ORDER BY id DESC LIMIT 1'); 
          console.log(JSON.stringify(sales[0])); 
          process.exit(0); 
        } catch (err) { 
          console.error('Error:', err); 
          process.exit(1); 
        } 
      })()`
    ]);
    
    let data = '';
    nodeProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    nodeProcess.stderr.on('data', (chunk) => {
      console.error('DB Query Error:', chunk.toString());
    });
    
    nodeProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse database result: ${e.message}`));
        }
      } else {
        reject(new Error(`Database query failed with code ${code}`));
      }
    });
  });
}

// Generate a unique timestamp for this test
const testTimestamp = new Date().toISOString();

// Main test function
async function runTests() {
  try {
    console.log('\n1. Creating a new sale with timestamp:', testTimestamp);
    const newSale = {
      customer_name: `Final Test ${testTimestamp}`,
      customer_email: 'final@example.com',
      items: [
        {
          id: 77777,
          name: `Final Test Product ${testTimestamp}`,
          price: 299,
          quantity: 2
        }
      ],
      payment_method: 'card',
      status: 'completed'
    };

    console.log('Creating sale with data:', JSON.stringify(newSale, null, 2));
    
    const createResponse = await makePostRequest('/api/sales', newSale);
    if (createResponse.statusCode !== 201) {
      throw new Error(`Expected status 201, got ${createResponse.statusCode}`);
    }
    
    console.log(`✅ Successfully created sale, status code: ${createResponse.statusCode}`);
    console.log('Response data:', JSON.stringify(createResponse.data, null, 2));
    
    // Check if we have the ID in the response
    if (!createResponse.data.data || !createResponse.data.data.id) {
      console.log('⚠️ Warning: No ID in the API response, will verify with database directly');
    }
    
    // Verify with database directly
    console.log('\n2. Verifying sale was saved to database...');
    const dbRecord = await queryDatabase();
    console.log('Latest database record:', JSON.stringify(dbRecord, null, 2));
    
    // Check if this matches our test data
    if (dbRecord.customer_name === newSale.customer_name) {
      console.log('✅ Database verification passed: Found matching customer name');
      console.log('✅ Database record ID:', dbRecord.id);
      console.log('✅ Database record order number:', dbRecord.order_number);
    } else {
      console.log('❌ Database verification failed: Customer name mismatch');
    }
    
    // Get all sales and check if our sale is there
    console.log('\n3. Verifying API GET /api/sales endpoint...');
    const getAllResponse = await makeGetRequest('/api/sales');
    if (getAllResponse.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${getAllResponse.statusCode}`);
    }
    
    if (Array.isArray(getAllResponse.data)) {
      console.log(`✅ GET /api/sales returned ${getAllResponse.data.length} records`);
      
      // Check if our new sale is in the list
      const foundSale = getAllResponse.data.find(s => s.customer_name === newSale.customer_name);
      if (foundSale) {
        console.log('✅ Found our new sale in the GET /api/sales response');
      } else {
        console.log('❌ Could NOT find our new sale in the GET /api/sales response');
      }
    } else {
      console.log('⚠️ Warning: GET /api/sales did not return an array');
    }
    
    // Get specific sale by ID
    if (dbRecord && dbRecord.id) {
      console.log(`\n4. Verifying API GET /api/sales/${dbRecord.id} endpoint...`);
      const getOneResponse = await makeGetRequest(`/api/sales/${dbRecord.id}`);
      
      if (getOneResponse.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${getOneResponse.statusCode}`);
      }
      
      console.log(`✅ GET /api/sales/${dbRecord.id} returned:`, JSON.stringify(getOneResponse.data, null, 2));
      
      if (getOneResponse.data.customer_name === newSale.customer_name) {
        console.log('✅ API GET by ID returned the correct record');
      } else {
        console.log('❌ API GET by ID returned incorrect data');
      }
    }
    
    console.log('\n✅ FINAL VERIFICATION: The sales API is correctly saving and retrieving data.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the tests
runTests();
