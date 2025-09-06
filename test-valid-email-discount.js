// Test discount rate with valid email from accounts table
const testWithValidEmail = async () => {
  console.log('🔥 Testing Discount Rate with Valid Email...');
  
  const testData = {
    customer_name: "Valid Email Test",
    customer_email: "ghj@gmail.com", // Using actual email from accounts table
    customer_phone: "+94771234567",
    customer_type: "reseller",
    items: [{
      product_id: "valid-email-test",
      product_name: "Valid Email Test Product", 
      price: 100,
      quantity: 1,
      email: "ghj@gmail.com",
      total: 100
    }],
    total_amount: 100,
    discount_rate: 40, // 40% discount - this is what we're testing!
    payment_method: "cash",
    status: "completed"
  };

  console.log('📋 Test Details:');
  console.log('- Customer Email: ghj@gmail.com (exists in accounts table)');
  console.log('- Customer Type: reseller');
  console.log('- Original Amount: $100');
  console.log('- Discount Rate: 40%');
  console.log('- Expected Discount Amount: $40');
  console.log('- Expected Final Amount: $60');
  console.log('');

  try {
    console.log('📤 Sending POST request to /api/sales...');
    
    const response = await fetch('http://localhost:3001/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 HTTP Status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ SALE CREATED SUCCESSFULLY!');
      console.log('Full Response:', JSON.stringify(result, null, 2));
      
      if (result.data) {
        console.log('\n🎯 CRITICAL DISCOUNT DATA:');
        console.log('Order Number:', result.data.order_number);
        console.log('Discount Rate Received by Backend:', result.data.discountRate);
        console.log('Total Amount Stored:', result.data.total_amount);
        console.log('Customer Type:', result.data.customer_type);
        
        // Verify discount calculation
        const sentDiscountRate = 40;
        const originalAmount = 100;
        const expectedDiscountAmount = (originalAmount * sentDiscountRate) / 100;
        const expectedFinalAmount = originalAmount - expectedDiscountAmount;
        
        console.log('\n🧮 DISCOUNT VERIFICATION:');
        console.log('Sent Discount Rate:', sentDiscountRate + '%');
        console.log('Stored Discount Rate:', (result.data.discountRate || 'MISSING') + '%');
        console.log('Expected Final Amount: $' + expectedFinalAmount);
        console.log('Actual Stored Amount: $' + result.data.total_amount);
        
        if (result.data.discountRate == sentDiscountRate) {
          console.log('✅ DISCOUNT RATE: CORRECTLY STORED!');
        } else {
          console.log('❌ DISCOUNT RATE: LOST OR CHANGED!');
          console.log('   🔍 This means the backend is not properly receiving or storing the discount_rate');
        }
        
        if (parseFloat(result.data.total_amount) == expectedFinalAmount) {
          console.log('✅ AMOUNT CALCULATION: CORRECT!');
        } else {
          console.log('❌ AMOUNT CALCULATION: INCORRECT!');
        }
      }
    } else {
      const errorText = await response.text();
      console.error('❌ REQUEST FAILED!');
      console.error('Status:', response.status);
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error.message);
  }
};

testWithValidEmail();
