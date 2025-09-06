// Simple API test using Node.js fetch to test discount rate
const testDiscountAPI = async () => {
  console.log('🚀 Testing Discount Rate API directly...');
  
  // Test data with 40% discount
  const testData = {
    customer_name: "API Test Customer",
    customer_email: "api@test.com",
    customer_phone: "+94771234567",
    customer_type: "reseller",
    items: [{
      product_id: "api-test-product",
      product_name: "API Test Product",
      price: 100,
      quantity: 1,
      email: "api@test.com",
      total: 100
    }],
    total_amount: 100,
    discount_rate: 40, // 40% discount
    payment_method: "cash",
    status: "completed"
  };

  console.log('📤 Sending to API:', JSON.stringify(testData, null, 2));
  console.log('🎯 Focus: discount_rate =', testData.discount_rate);

  try {
    const response = await fetch('http://localhost:3001/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Full Response:', JSON.stringify(result, null, 2));
      
      if (result.data) {
        console.log('\n🔍 KEY RESULTS:');
        console.log('Order Number:', result.data.order_number);
        console.log('Discount Rate Stored:', result.data.discountRate || 'NOT FOUND');
        console.log('Total Amount:', result.data.total_amount);
        console.log('Customer Type:', result.data.customer_type);
        
        // Check if discount was applied correctly
        const expectedDiscountAmount = (100 * 40) / 100; // 40
        const expectedFinalAmount = 100 - expectedDiscountAmount; // 60
        
        console.log('\n🧮 EXPECTED vs ACTUAL:');
        console.log('Expected Discount Amount: $' + expectedDiscountAmount);
        console.log('Expected Final Amount: $' + expectedFinalAmount);
        console.log('Actual Final Amount: $' + result.data.total_amount);
        
        if (parseFloat(result.data.total_amount) === expectedFinalAmount) {
          console.log('✅ DISCOUNT CALCULATION: CORRECT!');
        } else {
          console.log('❌ DISCOUNT CALCULATION: WRONG!');
        }
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
};

// Also test what happens with 0% discount for comparison
const testZeroDiscount = async () => {
  console.log('\n🔄 Testing 0% discount for comparison...');
  
  const testData = {
    customer_name: "Zero Discount Test",
    customer_email: "zero@test.com", 
    customer_phone: "+94771234567",
    customer_type: "standard",
    items: [{
      product_id: "zero-test-product",
      product_name: "Zero Test Product",
      price: 100,
      quantity: 1,
      email: "zero@test.com",
      total: 100
    }],
    total_amount: 100,
    discount_rate: 0, // 0% discount
    payment_method: "cash",
    status: "completed"
  };

  try {
    const response = await fetch('http://localhost:3001/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📊 0% Discount Result - Total Amount:', result.data?.total_amount);
      console.log('📊 0% Discount Result - Discount Rate:', result.data?.discountRate || 'NOT FOUND');
    }
  } catch (error) {
    console.error('❌ Zero discount test failed:', error.message);
  }
};

// Run both tests
const runAllTests = async () => {
  await testDiscountAPI();
  await testZeroDiscount();
  
  console.log('\n✅ All tests completed!');
  console.log('💡 If discount_rate shows as 0 despite sending 40, the issue is in the backend API processing.');
  console.log('💡 If discount_rate shows as 40, the issue is in your React frontend state management.');
};

runAllTests();
