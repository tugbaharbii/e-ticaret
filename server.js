console.log('server.js başlıyor...');

const express = require('express');
const app = express();
require('dotenv').config();

// Middleware → JSON body parse
app.use(express.json());

// Veritabanı Bağlantıları
const db = require('./config/db');           // MySQL
const connectMongo = require('./config/mongo');  // MongoDB

// MongoDB bağlantısını başlat
connectMongo();

// Test Routes
app.get('/', (req, res) => {
  res.send('Hybrid E-Commerce System Running!');
});

app.get('/test-mysql', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
