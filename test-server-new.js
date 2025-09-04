const express = require('express');
const app = express();
const port = 3002; // Different port from the main app

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
// Root route
app.get('/api/sales', (req, res) => {
  res.json({ message: "Sales API is working - test server" });
});

// Stats route
app.get('/api/sales/stats', (req, res) => {
  res.json({ 
    message: "Stats endpoint working - test server",
    stats: {
      total_orders: 0,
      total_revenue: 0
    }
  });
});

// Get by ID route - MUST come AFTER specific routes like /stats
app.get('/api/sales/:id', (req, res) => {
  res.json({ message: "Get by ID working - test server", id: req.params.id });
});

// Create sale route
app.post('/api/sales', (req, res) => {
  res.status(201).json({ message: "Create sale working - test server", data: req.body });
});

// Update sale route
app.put('/api/sales/:id', (req, res) => {
  res.json({ message: "Update sale working - test server", id: req.params.id, data: req.body });
});

// Delete sale route
app.delete('/api/sales/:id', (req, res) => {
  res.json({ message: "Delete sale working - test server", id: req.params.id });
});

// Start server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
