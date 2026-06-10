const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('✅ Connected to SQLite database');
});

// ─── Promise helpers ────────────────────────────────────────────────────────

db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );

db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    })
  );

db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    })
  );

// ─── Schema + Seed ─────────────────────────────────────────────────────────

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    price       REAL    NOT NULL,
    category    TEXT,
    image_url   TEXT,
    stock       INTEGER DEFAULT 100,
    rating      REAL    DEFAULT 4.0,
    reviews     INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity   INTEGER DEFAULT 1,
    UNIQUE(user_id, product_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    total            REAL    NOT NULL,
    status           TEXT    DEFAULT 'Processing',
    shipping_name    TEXT,
    shipping_address TEXT,
    shipping_city    TEXT,
    shipping_zip     TEXT,
    payment_method   TEXT    DEFAULT 'Credit Card',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL,
    product_id INTEGER,
    name       TEXT    NOT NULL,
    quantity   INTEGER NOT NULL,
    price      REAL    NOT NULL
  )`);

  // Seed products if empty
  db.get('SELECT COUNT(*) as c FROM products', [], (err, row) => {
    if (err || row.c > 0) return;

    const products = [
      ['ProSound Wireless Headphones', 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and studio-quality sound. Features Bluetooth 5.3, multipoint connection, and a foldable design for on-the-go use.', 149.99, 'Electronics', '/images/headphones.jpg', 85, 4.7, 312],
      ['UltraView 4K Monitor 27"', 'Stunning 27-inch 4K IPS display with 144Hz refresh rate, 1ms response time, and HDR600 support. Perfect for gaming, creative work, and professional use.', 399.99, 'Electronics', '/images/monitor.jpg', 42, 4.8, 187],
      ['SwiftCharge 65W Power Bank', 'High-capacity 26,800mAh power bank with 65W USB-C PD fast charging. Charges a laptop, tablet, and phone simultaneously. Aircraft-grade aluminum casing.', 79.99, 'Electronics', '/images/powerbank.jpg', 120, 4.5, 428],
      ['SmartWatch Pro X', 'Advanced smartwatch with AMOLED display, GPS, heart rate, SpO2, and sleep tracking. 7-day battery life, 5ATM water resistance, and 100+ workout modes.', 229.99, 'Electronics', '/images/smartwatch.jpg', 67, 4.6, 256],
      ['ArcticFleece Zip Hoodie', 'Ultra-soft premium fleece hoodie with full-zip closure. Made from 100% recycled polyester, this eco-friendly hoodie provides exceptional warmth without bulk.', 64.99, 'Clothing', '/images/hoodie.jpg', 200, 4.4, 543],
      ['UrbanFit Slim Chinos', 'Modern slim-fit chinos crafted from stretch cotton blend for all-day comfort. Available in multiple colors with a versatile style that works for office and casual wear.', 54.99, 'Clothing', '/images/chinos.jpg', 150, 4.3, 289],
      ['CloudStep Running Shoes', 'Lightweight responsive running shoes with carbon-infused foam midsole and breathable engineered mesh upper. Perfect for road running and daily training.', 119.99, 'Clothing', '/images/shoes.jpg', 95, 4.6, 712],
      ['ClassicFit Oxford Shirt', 'Premium Oxford cotton button-down shirt with a tailored fit. Wrinkle-resistant fabric that looks polished from morning to evening. Machine washable.', 44.99, 'Clothing', '/images/shirt.jpg', 180, 4.2, 198],
      ['LumaPro Desk Lamp', 'Architect-style LED desk lamp with 5 color temperatures, 10 brightness levels, and a wireless charging base. USB-A & USB-C ports built in. Eye-care technology.', 89.99, 'Home', '/images/lamp.jpg', 73, 4.7, 334],
      ['BrewMaster Pour-Over Set', 'Complete pour-over coffee brewing kit including borosilicate glass dripper, stainless steel gooseneck kettle, and precision scale. For the serious coffee enthusiast.', 74.99, 'Home', '/images/coffee.jpg', 56, 4.8, 445],
      ['ZenSpace Bamboo Organizer', 'Elegant 7-compartment bamboo desk organizer. Sustainably sourced, hand-crafted bamboo with a natural finish. Keeps your workspace tidy and beautiful.', 34.99, 'Home', '/images/organizer.jpg', 110, 4.5, 221],
      ['SleepCloud Memory Foam Pillow', 'Ergonomic memory foam pillow with cooling gel layer and adjustable loft. CertiPUR-US certified foam, hypoallergenic bamboo cover. Wake up refreshed every day.', 59.99, 'Home', '/images/pillow.jpg', 88, 4.6, 678],
    ];

    const stmt = db.prepare(
      'INSERT INTO products (name, description, price, category, image_url, stock, rating, reviews) VALUES (?,?,?,?,?,?,?,?)'
    );
    products.forEach(p => stmt.run(p));
    stmt.finalize();
    console.log(`✅ Seeded ${products.length} products`);
  });
});

module.exports = db;
