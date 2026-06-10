require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// ─── Catch-all: Serve frontend SPA ───────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 E-Commerce Server running at http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api\n`);
});
