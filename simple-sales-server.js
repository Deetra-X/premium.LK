// Simple app to test sales endpoint
const express = require('express');
const cors = require('cors');
const db = require('./src/db');
const salesRouter = require('./src/routes/working-sales');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount the sales router
app.use('/api/sales', salesRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Database test endpoint
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.send(`DB connection works! 1 + 1 = ${rows[0].solution}`);
  } catch (err) {
    res.status(500).send('DB connection failed: ' + err.message);
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Simple sales server running on port ${PORT}`);
});
