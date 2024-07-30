const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://13.215.186.119:3000', // For local development
  'http://stage-ashish.learn.cloudlaya.com' // Production domain
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Body parser middleware
app.use(bodyParser.json());

// MySQL connection pool setup
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'helloashish',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'hello',
});

let dbConnected = false;

// Check MySQL connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    console.error('Server will continue running without database connection.');
  } else {
    console.log('Connected to MySQL');
    connection.query('SELECT 1', (err, results) => {
      connection.release();
      if (err) {
        console.error('Error executing test query:', err);
        dbConnected = false;
      } else {
        console.log('MySQL connection test successful');
        dbConnected = true;
      }
    });
  }
});

// Insert data into the 'new' table
app.post('/api/storedata', (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({ message: 'Database connection is not available' });
  }
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ message: 'Data is required' });
  }
  const sql = 'INSERT INTO new (data) VALUES (?)';
  pool.query(sql, [data], (err, result) => {
    if (err) {
      console.error('Error storing data:', err);
      return res.status(500).json({ message: 'Error storing data' });
    }
    console.log('Data stored successfully');
    res.status(200).json({ message: 'Data stored successfully' });
  });
});

// Retrieve all data from the 'new' table
app.get('/api/getdata', (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({ message: 'Database connection is not available' });
  }
  const sql = 'SELECT * FROM new';
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    res.status(200).json(results);
  });
});

// Delete data from the 'new' table by ID
app.delete('/api/deletedata/:id', (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({ message: 'Database connection is not available' });
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'ID parameter is required' });
  }
  const sql = 'DELETE FROM new WHERE id = ?';
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err);
      return res.status(500).json({ message: 'Error deleting data' });
    }
    console.log('Data deleted successfully');
    res.status(200).json({ message: 'Data deleted successfully' });
  });
});

// Basic API endpoint to check if the server is running
app.get('/', (req, res) => {
  if (!dbConnected) {
    return res.status(500).send('Backend server is running but cannot connect to the database.');
  }
  res.send('Backend server is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
