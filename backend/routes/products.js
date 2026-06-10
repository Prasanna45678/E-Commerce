const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /api/products?category=&search=
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY id ASC';

  try {
    const products = await db.allAsync(sql, params);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const related = await db.allAsync(
      'SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4',
      [product.category, product.id]
    );
    res.json({ ...product, related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
