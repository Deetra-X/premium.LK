const express = require('express');
const router = express.Router();

// Debug logging
console.log('Simple sales router loaded and initialized');

// 1. Root route
router.get('/', (req, res) => {
  res.json({ message: "Sales API is working - new version" });
});

// 2. Stats route - must come BEFORE the :id route
router.get('/stats', (req, res) => {
  res.json({ 
    message: "Stats endpoint working - new version",
    stats: {
      total_orders: 0,
      total_revenue: 0
    }
  });
});

// 3. Get by ID route
router.get('/:id', (req, res) => {
  res.json({ message: "Get by ID working - new version", id: req.params.id });
});

// 4. Create sale route
router.post('/', (req, res) => {
  res.status(201).json({ message: "Create sale working - new version", data: req.body });
});

// 5. Update sale route
router.put('/:id', (req, res) => {
  res.json({ message: "Update sale working - new version", id: req.params.id, data: req.body });
});

// 6. Delete sale route
router.delete('/:id', (req, res) => {
  res.json({ message: "Delete sale working - new version", id: req.params.id });
});

module.exports = router;
