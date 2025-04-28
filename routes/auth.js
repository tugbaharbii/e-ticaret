const transporter = require('../config/mailer');
const express = require('express');
const router = express.Router();
const db = require('../config/db');  // MySQL bağlantısı
const bcrypt = require('bcryptjs');  // Şifreleme
const jwt = require('jsonwebtoken'); // Token

// Kayıt (Register)
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    // Email zaten var mı kontrol et
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists!' });
    }


    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı ekle
    await db.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role || 'customer']);
    res.json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Giriş (Login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log("Generated Token:", token);


    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware → Token kontrol
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  console.log("Incoming Token:", bearerHeader);  // Token tam hali burada gözükür!

  if (!bearerHeader) return res.status(403).json({ message: 'No token provided!' });

  // 💡 Bearer kısmını ayıklıyoruz:
  const token = bearerHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("JWT Verification Error:", err);  // Hata logu buraya!
      return res.status(500).json({ message: 'Failed to authenticate token!' });
    }
    req.user = decoded;
    next();
  });
}

// Korumalı endpoint
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required!' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found!' });

    const resetToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // ✨ Email gönder
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Şifre Sıfırlama Talebi',
      html: `
        <h3>Şifrenizi sıfırlamak için aşağıdaki tokenı kullanın:</h3>
        <p><b>${resetToken}</b></p>
        <p>Bu token 15 dakika içinde geçerliliğini yitirecektir.</p>
      `
    });

    res.json({ message: 'Reset token sent to email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Şifreyi Sıfırla
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required!' });

  try {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(400).json({ message: 'Invalid or expired token!' });

      const userId = decoded.user_id;

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);

      res.json({ message: 'Password updated successfully!' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profil Güncelleme
router.put('/update-profile', verifyToken, async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: 'Please provide email or password to update!' });
  }

  try {
    // Sadece değiştirilmek istenen alanları ayarla
    const fieldsToUpdate = [];
    const values = [];

    if (email) {
      fieldsToUpdate.push('email = ?');
      values.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fieldsToUpdate.push('password = ?');
      values.push(hashedPassword);
    }

    values.push(req.user.user_id); // en son user_id eklenecek

    const query = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`;
    await db.query(query, values);

    res.json({ message: 'Profile updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
