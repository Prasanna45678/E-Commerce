const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const items = await db.allAsync(
      `SELECT ci.id, ci.quantity,
              p.id as product_id, p.name, p.price, p.image_url, p.stock, p.category
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart — add or increment item
router.post('/', async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  try {
    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = await db.getAsync(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      await db.runAsync('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      await db.runAsync(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, Math.min(quantity, product.stock)]
      );
    }
    res.json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// PUT /api/cart/:id — update quantity
router.put('/:id', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity required' });

  try {
    const item = await db.getAsync(
      `SELECT ci.*, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ci.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    const newQty = Math.min(quantity, item.stock);
    await db.runAsync('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, req.params.id]);
    res.json({ success: true, quantity: newQty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// DELETE /api/cart/:id — remove one item
router.delete('/:id', async (req, res) => {
  try {
    await db.runAsync(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE /api/cart — clear entire cart
router.delete('/', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
