# ⚡ ShopNova — Full-Stack E-Commerce
## CodeAlpha Internship Task 2

A premium full-stack e-commerce web application built with **Node.js/Express** backend, **SQLite** database, and a **HTML/CSS/JS** frontend featuring a dark-mode glassmorphism design.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Open in browser
```
http://localhost:3000
```

---

## 🛍️ Features

| Feature | Details |
|---|---|
| 🏠 **Homepage** | Product grid with category filters & live search |
| 📄 **Product Detail** | Full description, quantity picker, related products |
| 🛒 **Shopping Cart** | Add/remove/adjust quantities, live totals |
| 🧾 **Checkout** | Shipping form, payment method, order confirmation |
| 📦 **Order History** | All past orders with expandable item details |
| 👤 **Auth** | Register + Login with JWT, bcrypt password hashing |
| 🗄️ **Database** | SQLite — users, products, cart_items, orders, order_items |

---

## 🗂️ Project Structure

```
e-commerce/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── database.js        # SQLite setup & seed data
│   ├── shop.db            # SQLite database file (auto-created)
│   ├── .env               # Environment variables
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   └── routes/
│       ├── auth.js        # /api/auth
│       ├── products.js    # /api/products
│       ├── cart.js        # /api/cart
│       └── orders.js      # /api/orders
└── frontend/
    ├── index.html         # Homepage
    ├── product.html       # Product detail
    ├── cart.html          # Shopping cart
    ├── checkout.html      # Checkout
    ├── orders.html        # Order history
    ├── auth.html          # Login / Register
    ├── css/
    │   └── style.css      # Full design system
    └── js/
        ├── api.js         # Fetch wrapper + toast system
        ├── products.js
        ├── product-detail.js
        ├── cart.js
        ├── checkout.js
        └── orders.js
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get profile |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | No | List all (supports `?category=` & `?search=`) |
| GET | `/api/products/:id` | No | Product detail + related |

### Cart
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | Yes | Get cart |
| POST | `/api/cart` | Yes | Add item |
| PUT | `/api/cart/:id` | Yes | Update quantity |
| DELETE | `/api/cart/:id` | Yes | Remove item |
| DELETE | `/api/cart` | Yes | Clear cart |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders` | Yes | List orders |
| GET | `/api/orders/:id` | Yes | Order detail |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `sqlite3`)
- **Auth**: JSON Web Tokens + bcryptjs
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Dark mode, glassmorphism, Inter font

---

## 📦 Sample Products

12 seeded products across 3 categories:
- 📱 **Electronics**: Headphones, Monitor, Power Bank, SmartWatch
- 👗 **Clothing**: Hoodie, Chinos, Running Shoes, Oxford Shirt  
- 🏠 **Home**: Desk Lamp, Coffee Set, Bamboo Organizer, Memory Foam Pillow
