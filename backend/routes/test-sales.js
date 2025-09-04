const express = require('express');
const router = express.Router();
const db = require('../../src/db'); // Path to the DB file in src folder
const { randomUUID } = require('crypto');

// Add logging to debug
console.log('Sales router loaded and initialized');

// Test route to verify router is working
router.get('/', async (req, res) => {
  try {
    // For debugging - return simple response
    res.json({ message: "Test sales route is working", items: [] });
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales', details: err.message });
  }
});

// Stats route - must be defined BEFORE the :id route
router.get('/stats', async (req, res) => {
  try {
    // For debugging - return mock stats
    res.json({ 
      message: "Stats endpoint working",
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      monthly_revenue: 0
    });
  } catch (err) {
    console.error('Error fetching sales stats:', err);
    res.status(500).json({ error: 'Failed to fetch sales stats', details: err.message });
  }
});

// Get sale by ID route
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // For debugging
    if (id === 'stats') {
      return res.status(400).json({ error: 'This should never happen - stats endpoint should be handled separately' });
    }
    
    // Return mock data
    res.json({
      id: id,
      orderNumber: `ORD-2023-0001`,
      message: "Get by ID route working"
    });
  } catch (err) {
    console.error('Error fetching sale:', err);
    res.status(500).json({ error: 'Failed to fetch sale', details: err.message });
  }
});

// Create sale route
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      items
    } = req.body;
    
    // Input validation
    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'Customer name and email are required' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    const mockOrderId = randomUUID();
    
    // Return mock data
    res.status(201).json({
      id: mockOrderId,
      orderNumber: `ORD-2023-0001`,
      customerName: customer_name,
      customerEmail: customer_email,
      itemCount: items.length,
      message: "Create sale route working"
    });
  } catch (err) {
    console.error('Error creating sale:', err);
    res.status(500).json({ error: 'Failed to create sale', details: err.message });
  }
});

// Update sale route
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Return mock data
    res.json({
      id: id,
      orderNumber: `ORD-2023-0001`,
      fieldsUpdated: Object.keys(updateFields),
      message: "Update sale route working"
    });
  } catch (err) {
    console.error('Error updating sale:', err);
    res.status(500).json({ error: 'Failed to update sale', details: err.message });
  }
});

// Delete sale route
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Return mock data
    res.json({ 
      success: true, 
      message: `Sale ${id} deleted successfully`,
      deletedId: id
    });
  } catch (err) {
    console.error('Error deleting sale:', err);
    res.status(500).json({ error: 'Failed to delete sale', details: err.message });
  }
});

// Helper function for generating order numbers
async function generateOrderNumber() {
  try {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    
    // Mock implementation
    return `${prefix}0001`;
  } catch (error) {
    console.error('❌ Error generating order number:', error);
    return `ORD-${new Date().getFullYear()}-0001`;
  }
}

// Export the router
module.exports = router;
