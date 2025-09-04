const express = require('express');
const app = express();
const port = 3005; // A different port from other servers

// Basic middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Final test server is running!');
});

// Sales routes in the correct order
app.get('/api/sales', (req, res) => {
  console.log('GET /api/sales endpoint called');
  res.json({ success: true, message: "Sales API is working" });
});

app.get('/api/sales/stats', (req, res) => {
  console.log('GET /api/sales/stats endpoint called');
  res.json({ 
    success: true,
    message: "Stats endpoint is working",
    stats: {
      total_orders: 10,
      completed_orders: 8,
      pending_orders: 1,
      cancelled_orders: 1,
      total_revenue: 1500,
      avg_order_value: 150,
      monthly_revenue: 1000
    }
  });
});

app.get('/api/sales/:id', (req, res) => {
  console.log(`GET /api/sales/${req.params.id} endpoint called`);
  res.json({ success: true, message: "Get by ID endpoint is working", id: req.params.id });
});

// Start the server
app.listen(port, () => {
  console.log(`Final test server running on port ${port}`);
  console.log(`Try these endpoints:`);
  console.log(`  GET http://localhost:${port}/api/sales`);
  console.log(`  GET http://localhost:${port}/api/sales/stats`);
  console.log(`  GET http://localhost:${port}/api/sales/123`);
});
