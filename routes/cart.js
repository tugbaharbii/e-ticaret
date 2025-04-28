const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const jwt = require('jsonwebtoken');

// 💎 Token Doğrulama Middleware:
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

// 🛒 GET → Kullanıcının sepetini getir
router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.user_id });
    res.json(cart || { userId: req.user.user_id, items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛒 POST → Sepete ürün ekle
router.post('/', verifyToken, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.user.user_id });
    if (!cart) {
      // Sepet yoksa oluştur
      cart = new Cart({ userId: req.user.user_id, items: [] });
    }

    // Ürün sepetin içinde mi kontrol et
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
      // Ürün varsa, miktarını artır
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Ürün yoksa, ekle
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛒 DELETE → Sepetten ürün sil
router.delete('/:productId', verifyToken, async (req, res) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOne({ userId: req.user.user_id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
