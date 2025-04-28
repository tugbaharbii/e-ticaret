// 💎 1. ENV Yükle → Her şeyden önce!
require('dotenv').config();
console.log('server.js başlıyor...');

// 💎 2. Temel modülleri yükle
const express = require('express');
const app = express();

// 💎 3. JSON body parse middleware → Router’dan önce olmalı!
app.use(express.json());

// 💎 4. Veritabanı Bağlantıları
const db = require('./config/db');               // MySQL bağlantısı
const connectMongo = require('./config/mongo');  // MongoDB bağlantısı

// 💎 5. MongoDB bağlantısını başlat
connectMongo();

// 💎 6. Test Routes → burada kalabilir!
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

app.get('/test-mongo', (req, res) => {
  res.send('MongoDB working!');
});

// 💎 7. Auth Routes → JSON parse’tan sonra, en sonda olmalı!
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 💎 8. Port Ayarları
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

const productRoutes = require('./routes/product');
app.use('/api/products', productRoutes);
