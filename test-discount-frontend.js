// Test script to verify discount rate is properly sent from frontend to backend
const testDiscountRate = async () => {
  console.log('Testing discount rate functionality...');
  
  // Simulate the order data that would be sent from the frontend
  const orderData = {
    customerName: "Test Customer",
    customerEmail: "test@example.com", 
    customerPhone: "+94771234567",
    customerType: "reseller",
    items: [{
      productId: "test-product-id",
      productName: "Test Product",
      price: 100,
      quantity: 1,
      email: "test@example.com"
    }],
    totalAmount: 100,
    discountRate: 40, // This should be 40, not 0
    paymentMethod: "cash",
    status: "completed"
  };

  console.log('Order data to be sent:', JSON.stringify(orderData, null, 2));
  console.log('Discount rate in order data:', orderData.discountRate);

  try {
    const response = await fetch('http://localhost:3001/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        customer_type: orderData.customerType,
        items: orderData.items.map(item => ({
          product_id: item.productId,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity,
          email: item.email,
          total: item.price * item.quantity
        })),
        total_amount: orderData.totalAmount,
        discount_rate: orderData.discountRate, // This should be 40
        payment_method: orderData.paymentMethod,
        status: orderData.status
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sale created successfully:', result);
      console.log('📊 Discount rate in response:', result.data?.discountRate);
      
      // Check if discount amount was calculated correctly
      const expectedDiscountAmount = (orderData.totalAmount * orderData.discountRate) / 100;
      console.log('📈 Expected discount amount:', expectedDiscountAmount);
      console.log('💰 Actual total after discount:', result.data?.total_amount);
      
    } else {
      console.error('❌ Failed to create sale:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run the test
testDiscountRate();
