const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

// Import API routes
const categoriesRouter = require('./routes/Categories');
const accountsRouter = require('./routes/Accounts');
const customersRouter = require('./routes/Customers');
const dashboardRouter = require('./routes/Dashboard');
// Import router for account orders
const accountOrdersRouter = require('../backend/routes/accountOrders');
// Import backend sales router
const backendSalesRouter = require('../backend/routes/sales');

// Add debugging endpoint
app.get('/api-status', (req, res) => {
  console.log('API status endpoint accessed');
  res.json({
    status: 'API is running',
    routes: ['/api/categories', '/api/accounts', '/api/customers', '/api/dashboard', '/api/sales', '/api/account-orders'],
    message: 'All endpoints should be available'
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register all API routes - only register them once!
app.use('/api/categories', categoriesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/dashboard', dashboardRouter);

// Add sales router
console.log('Adding sales router at /api/sales path');
try {
  // Use the ultimate fixed implementation with dedicated connection pool
  const salesRouter = require('./routes/Sales.js');
  app.use('/api/sales', salesRouter);
  console.log('Successfully registered ultimate fixed sales router with dedicated connection pool');
} catch (error) {
  console.error('Failed to register sales router:', error);
}

// Add account orders router
console.log('Adding account orders router at /api/account-orders path');
try {
  app.use('/api/account-orders', accountOrdersRouter);
  console.log('Successfully registered account orders router');
} catch (error) {
  console.error('Failed to register account orders router:', error);
}

app.get('/', (req, res) => {
  res.send('Server is running!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.send(`DB connection works! 1 + 1 = ${rows[0].solution}`);
  } catch (err) {
    res.status(500).send('DB connection failed: ' + err.message);
  }
});