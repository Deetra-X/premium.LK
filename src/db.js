const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',        // your DB host, usually 'localhost'
  user: 'root',             // your MySQL username
  password: 'root',         // your MySQL password
  database: 'POS',          // your database name
  port: 3306,               // default MySQL port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;