const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Sales API server is running!');
});

// Sales API endpoints
app.get('/api/sales', (req, res) => {
  console.log('GET /api/sales - returning empty array');
  res.json([]);
});

// Stats endpoint - MUST be defined before the :id route
app.get('/api/sales/stats', (req, res) => {
  console.log('GET /api/sales/stats - returning mock stats');
  res.json({ 
    success: true,
    message: "Stats endpoint is working",
    stats: {
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      monthly_revenue: 0
    }
  });
});

// Get by ID endpoint - must come after specific routes like /stats
app.get('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/sales/${id}`);
  
  // Special check for the 'stats' ID to prevent confusion
  if (id === 'stats') {
    return res.status(400).json({ 
      error: 'Invalid ID. To get stats, use /api/sales/stats (without an ID)' 
    });
  }
  
  res.json({ 
    id,
    orderNumber: `ORD-2023-${id.slice(0, 4)}`,
    message: "Get by ID endpoint is working"
  });
});

app.post('/api/sales', (req, res) => {
  const data = req.body;
  console.log('POST /api/sales - received data:', data);
  
  // Generate an ID and order number for the sale
  const saleId = `sale-${Date.now()}`;
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
  
  // Create a response with the new sale data
  const sale = {
    ...data,
    id: saleId,
    orderNumber,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('Created sale:', sale);
  res.status(201).json(sale);
});

app.put('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  console.log(`PUT /api/sales/${id} - received data:`, data);
  
  const sale = {
    ...data,
    id,
    updatedAt: new Date()
  };
  
  res.json(sale);
});

app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/sales/${id}`);
  res.json({ message: `Sale ${id} deleted successfully` });
});

// Start the server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Simple Sales API server running on port ${PORT}`);
});
