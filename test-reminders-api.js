// Test script to verify reminders page functionality
const testRemindersAPI = async () => {
  console.log('🔔 Testing Reminders API functionality...');
  
  try {
    // Test the dashboard API endpoint that reminders uses
    console.log('📡 Testing expiring accounts API...');
    const response = await fetch('http://localhost:3001/api/dashboard/expiring-accounts?days=7');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Expiring accounts API works:', data);
      console.log('📊 Found', data.length, 'expiring accounts');
    } else {
      console.log('❌ Expiring accounts API failed:', response.status, response.statusText);
    }
    
    // Test accounts endpoint
    console.log('📡 Testing accounts endpoint...');
    const accountsResponse = await fetch('http://localhost:3001/api/accounts/expiring-soon?days=7');
    
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      console.log('✅ Accounts expiring soon API works:', accountsData);
      console.log('📊 Found', accountsData.length, 'accounts expiring soon');
    } else {
      console.log('❌ Accounts expiring soon API failed:', accountsResponse.status, accountsResponse.statusText);
    }
    
    // Test sales data for renewals
    console.log('📡 Testing sales data for renewals...');
    const salesResponse = await fetch('http://localhost:3001/api/sales');
    
    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      console.log('✅ Sales API works for renewals');
      console.log('📊 Total sales found:', salesData.length || 'Unknown count');
      
      // Check for completed sales that could be renewed
      if (Array.isArray(salesData)) {
        const completedSales = salesData.filter(sale => sale.status === 'completed');
        console.log('📊 Completed sales (potential renewals):', completedSales.length);
      }
    } else {
      console.log('❌ Sales API failed:', salesResponse.status, salesResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testRemindersAPI();
