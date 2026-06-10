const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/orders — place order from cart
router.post('/', async (req, res) => {
  const { shipping_name, shipping_address, shipping_city, shipping_zip, payment_method } = req.body;

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip)
    return res.status(400).json({ error: 'All shipping fields are required' });

  try {
    const cartItems = await db.allAsync(
      `SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0)
      return res.status(400).json({ error: 'Your cart is empty' });

    for (const item of cartItems) {
      if (item.quantity > item.stock)
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
    }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax      = subtotal * 0.08;
    const total    = parseFloat((subtotal + tax).toFixed(2));

    // Manual transaction using run callbacks
    await db.runAsync('BEGIN TRANSACTION');

    try {
      const orderResult = await db.runAsync(
        `INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, total, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method || 'Credit Card']
      );
      const orderId = orderResult.lastID;

      for (const item of cartItems) {
        await db.runAsync(
          'INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.name, item.quantity, item.price]
        );
        await db.runAsync(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      await db.runAsync('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
      await db.runAsync('COMMIT');

      res.status(201).json({ success: true, orderId, total, message: 'Order placed successfully!' });
    } catch (txErr) {
      await db.runAsync('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders — list user orders
router.get('/', async (req, res) => {
  try {
    const orders = await db.allAsync(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const withCounts = await Promise.all(
      orders.map(async (order) => {
        const row = await db.getAsync(
          'SELECT SUM(quantity) as count FROM order_items WHERE order_id = ?',
          [order.id]
        );
        return { ...order, item_count: row.count || 0 };
      })
    );

    res.json(withCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — single order with items
router.get('/:id', async (req, res) => {
  try {
    const order = await db.getAsync(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = await db.allAsync(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    res.json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
