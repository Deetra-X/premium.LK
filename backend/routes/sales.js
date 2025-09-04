const express = require('express');
const router = express.Router();

// Debug logging
console.log('Sales router loaded with proper route ordering');

/**
 * IMPORTANT: Route order matters in Express!
 * More specific routes (like /stats) must come BEFORE
 * parameterized routes (like /:id) to prevent conflicts
 */

// GET all sales - root route
router.get('/', (req, res) => {
  console.log('GET /sales endpoint called');
  res.json({ 
    success: true, 
    message: "Sales API is working",
    data: [] // You would fetch actual data here
  });
});

// GET sales statistics - specific route BEFORE /:id
router.get('/stats', (req, res) => {
  console.log('GET /sales/stats endpoint called');
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

// GET sale by ID - parameterized route AFTER specific routes
router.get('/:id', (req, res) => {
  console.log(`GET /sales/${req.params.id} endpoint called`);
  res.json({ 
    success: true, 
    message: "Get by ID endpoint is working", 
    id: req.params.id 
  });
});

// Create sale route
router.post('/', (req, res) => {
  res.status(201).json({ 
    success: true, 
    message: "Create sale endpoint is working", 
    data: req.body 
  });
});

// Update sale route
router.put('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: "Update sale endpoint is working", 
    id: req.params.id,
    data: req.body
  });
});

// Delete sale route
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: "Delete sale endpoint is working",
    id: req.params.id
  });
});

// Export router
module.exports = router;