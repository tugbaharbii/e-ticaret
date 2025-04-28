const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart'); // MongoDB Sepet Modeli

// 💎 Token Doğrulama Middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) return res.status(403).json({ message: 'No token provided!' });

  const token = bearerHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ message: 'Failed to authenticate token!' });
    req.user = decoded;
    next();
  });
}

// 💎 Role Kontrol Middleware (Supplier)
function isSupplier(req, res, next) {
  if (req.user.role !== 'supplier') {
    return res.status(403).json({ message: 'Access denied: Only suppliers allowed!' });
  }
  next();
}

// 🛒 GET → Tüm ürünleri listele (everyone)
router.get('/', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛒 POST → Yeni ürün ekle (supplier only)
router.post('/', verifyToken, isSupplier, async (req, res) => {
  const { name, description, price, stock } = req.body;
  try {
    await db.query(
      'INSERT INTO products (name, description, price, stock, supplier_id) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, req.user.user_id]
    );
    res.json({ message: 'Product added successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛒 PUT → Ürün güncelle (supplier only)
router.put('/:productId', verifyToken, isSupplier, async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, stock } = req.body;
  try {
    await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE product_id = ? AND supplier_id = ?',
      [name, description, price, stock, productId, req.user.user_id]
    );
    res.json({ message: 'Product updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛒 DELETE → Ürün sil (supplier only)
router.delete('/:productId', verifyToken, isSupplier, async (req, res) => {
  const { productId } = req.params;
  try {
    // 1. Önce MySQL'den ürünü sil
    await db.query(
      'DELETE FROM products WHERE product_id = ? AND supplier_id = ?',
      [productId, req.user.user_id]
    );

    // 2. Sonra MongoDB'deki tüm sepetlerden bu ürünü kaldır
    await Cart.updateMany(
      { "items.productId": productId.toString() }, // dikkat: string yapıyoruz!
      { $pull: { items: { productId: productId.toString() } } }
    );

    res.json({ message: 'Product deleted successfully and removed from carts!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
