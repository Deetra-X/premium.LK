const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Create a sales router
const salesRouter = express.Router();

// Simple GET endpoint that returns all sales
salesRouter.get('/', (req, res) => {
  console.log('Sales API GET endpoint called');
  res.json([]);
});

// Simple POST endpoint that accepts a sale and returns it with an ID
salesRouter.post('/', (req, res) => {
  const saleData = req.body;
  console.log('Sales API POST endpoint called with data:', saleData);
  const saleWithId = {
    ...saleData,
    id: `sale-${Date.now()}`,
    orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  res.status(201).json(saleWithId);
});

// Simple PUT endpoint for updating a sale
salesRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const saleData = req.body;
  console.log(`Sales API PUT endpoint called for ID ${id} with data:`, saleData);
  const updatedSale = {
    ...saleData,
    id,
    updatedAt: new Date()
  };
  res.status(200).json(updatedSale);
});

// Simple DELETE endpoint for deleting a sale
salesRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Sales API DELETE endpoint called for ID ${id}`);
  res.status(200).json({ message: `Sale with ID ${id} deleted successfully` });
});

// Register the sales router
app.use('/api/sales', salesRouter);

// Add debugging endpoint
app.get('/api-status', (req, res) => {
  res.json({
    status: 'API is running',
    routes: ['/api/sales'],
    message: 'Sales API should be available'
  });
});

app.get('/', (req, res) => {
  res.send('Sales API server is running!');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Sales API server running on port ${PORT}`);
});
