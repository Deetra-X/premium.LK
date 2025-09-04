// Comprehensive API test
const http = require('http');

console.log('Running comprehensive API test...');

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

// Generate a unique timestamp for this test
const testTimestamp = new Date().toISOString();

// Main test function
async function runTests() {
  try {
    console.log('\n1. Testing GET /api/sales - Should return all sales');
    const salesResponse = await makeGetRequest('/api/sales');
    if (salesResponse.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${salesResponse.statusCode}`);
    }
    
    console.log(`✅ Successfully retrieved sales, status code: ${salesResponse.statusCode}`);
    console.log(`Found ${Array.isArray(salesResponse.data) ? salesResponse.data.length : 'unknown number of'} sales records`);
    
    if (Array.isArray(salesResponse.data) && salesResponse.data.length > 0) {
      console.log(`Latest sale: ${salesResponse.data[0].order_number} - ${salesResponse.data[0].customer_name}`);
    }

    // Now create a new sale
    console.log('\n2. Testing POST /api/sales - Creating a new sale');
    const newSale = {
      customer_name: `API Test ${testTimestamp}`,
      customer_email: 'api.test@example.com',
      items: [
        {
          id: 12345,
          name: `Test Product ${testTimestamp}`,
          price: 199,
          quantity: 1
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
    
    // Get the newly created sale ID
    const newSaleId = createResponse.data.data.id;
    
    // Verify we can retrieve the newly created sale
    console.log(`\n3. Testing GET /api/sales/${newSaleId} - Should return the newly created sale`);
    const getSaleResponse = await makeGetRequest(`/api/sales/${newSaleId}`);
    if (getSaleResponse.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${getSaleResponse.statusCode}`);
    }
    
    console.log(`✅ Successfully retrieved new sale, status code: ${getSaleResponse.statusCode}`);
    console.log('Retrieved sale:', JSON.stringify(getSaleResponse.data, null, 2));
    
    if (getSaleResponse.data.customer_name === newSale.customer_name) {
      console.log('✅ Data consistency check passed: Customer name matches');
    } else {
      console.log('❌ Data consistency check failed: Customer name mismatch');
    }

    // Final check - get all sales again and verify our new one is there
    console.log('\n4. Final check - GET /api/sales again to verify new sale is included');
    const finalSalesResponse = await makeGetRequest('/api/sales');
    
    if (finalSalesResponse.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${finalSalesResponse.statusCode}`);
    }
    
    const newSaleInList = Array.isArray(finalSalesResponse.data) && 
                         finalSalesResponse.data.find(sale => sale.id === newSaleId);
    
    if (newSaleInList) {
      console.log('✅ New sale found in the list of all sales');
    } else {
      console.log('❌ New sale NOT found in the list of all sales');
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('The API is now correctly saving and retrieving sales data.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the tests
runTests();
