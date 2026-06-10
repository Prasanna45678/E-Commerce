const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const existing = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.runAsync(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    const token = jwt.sign(
      { id: result.lastID, name, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: result.lastID, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getAsync(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
