# 🛒 E-Mart — Grocery Delivery App
### Complete Project Brief for Development

---

## 📌 Project Overview

**App Name:** E-Mart  
**Type:** Grocery ordering & delivery mobile app  
**Platform:** Flutter (Android + iOS)  
**Target Market:** Single city (Lahore, Pakistan) — local delivery only  
**Business Model:** Customer orders groceries → Admin confirms → Rider delivers  
**Monetization:** Delivery fee per order + product markup  

---

## 🎯 What We're Building

Three parts total:

| Part | Platform | Who Uses It |
|---|---|---|
| Customer App | Flutter (Mobile) | Buyers browsing and ordering groceries |
| Admin Panel | Flutter Web or React Web | Store owner managing products & orders |
| Backend API | Node.js + Express + MongoDB | Powers everything |

> **Start with:** Customer App + Backend API first. Admin Panel second.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Flutter (Dart) |
| Backend | Node.js + Express.js |
| Database | MongoDB (with Mongoose) |
| Authentication | Firebase Auth (phone OTP) + JWT |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Image Storage | Cloudinary |
| Payments | Cash on Delivery (COD) only |
| Backend Hosting | Railway or Render |
| State Management | Flutter: Provider or Riverpod |

---

## 📱 Customer App — All Screens

### Auth Flow
- **Splash Screen** — App logo, 2 second delay, redirects to onboarding or home
- **Onboarding Screen** — 3 slides explaining the app (skip button)
- **Phone Number Screen** — Enter Pakistani phone number (+92 format)
- **OTP Verification Screen** — 6-digit OTP via Firebase
- **Profile Setup Screen** — Enter name, set default delivery address (first time only)

### Main App (Bottom Navigation: Home | Categories | Cart | Orders | Profile)

#### Home Tab
- Search bar at top (searches all products)
- Banner carousel (promotional images, auto-scrolling)
- "Shop by Category" horizontal scroll (icons: Vegetables, Fruits, Dairy, Meat, Bakery, Beverages, Snacks, Personal Care, Household)
- "Featured Products" horizontal scroll
- "Best Sellers" grid section
- "New Arrivals" section

#### Categories Tab
- Grid of all categories with image and name
- Tap category → Product listing screen for that category

#### Product Listing Screen
- Filter bar (price low-high, high-low, in stock only)
- Product cards showing: image, name, weight/unit, price, "Add to Cart" button
- Pagination or infinite scroll

#### Product Detail Screen
- Large product image
- Product name, brand, weight options (e.g. 500g / 1kg)
- Price per unit
- Stock availability badge
- Description
- Quantity selector (+ / -)
- "Add to Cart" button
- Related products horizontal scroll

#### Cart Tab
- List of cart items with image, name, quantity controls, item total
- Order summary: Subtotal, Delivery Fee, Total
- "Proceed to Checkout" button
- Empty cart state with "Start Shopping" button

#### Checkout Screen
- Delivery address section (show saved address, option to change)
- Delivery time slot selection (Today 2-4pm / 4-6pm / Tomorrow etc.)
- Payment method: Cash on Delivery only
- Order notes field (optional)
- Order summary (collapsed)
- "Place Order" button

#### Order Confirmation Screen
- Success animation (checkmark)
- Order ID
- Estimated delivery time
- "Track Order" button
- "Continue Shopping" button

#### Orders Tab
- Two tabs: Active Orders | Past Orders
- Order card: Order ID, date, items count, total, status badge
- Tap order → Order Detail Screen

#### Order Detail Screen
- Order timeline (Placed → Confirmed → Being Packed → Out for Delivery → Delivered)
- Items list with images
- Price breakdown
- Delivery address
- Contact support button

#### Profile Tab
- User name and phone number
- My Addresses (add/edit/delete)
- Edit Profile
- Notification Settings
- Help & Support
- About App
- Logout

---

## 🗄️ Database Schema (MongoDB Collections)

### Users
```
_id, name, phone, email (optional), profilePicture,
addresses: [{ label, street, area, city, isDefault }],
fcmToken, createdAt
```

### Categories
```
_id, name, image, slug, isActive, order (for sorting)
```

### Products
```
_id, name, description, categoryId, images: [url],
variants: [{ weight, unit, price, comparePrice, sku }],
brand, inStock, isFeatured, isNewArrival,
tags: [string], cloudinaryId, createdAt
```

### Orders
```
_id, userId, orderNumber,
items: [{ productId, name, image, variant, quantity, price }],
subtotal, deliveryFee, total,
paymentMethod, paymentStatus,
deliveryAddress: { street, area, city },
deliverySlot, status (placed|confirmed|packing|out_for_delivery|delivered|cancelled),
statusHistory: [{ status, timestamp, note }],
notes, createdAt
```



## 🔌 Backend API Endpoints

### Auth
```
POST   /api/auth/send-otp        → Send OTP to phone
POST   /api/auth/verify-otp      → Verify OTP, return JWT
POST   /api/auth/refresh-token   → Refresh JWT
```

### Users
```
GET    /api/users/me             → Get current user profile
PUT    /api/users/me             → Update profile
POST   /api/users/addresses      → Add address
PUT    /api/users/addresses/:id  → Update address
DELETE /api/users/addresses/:id  → Delete address
PUT    /api/users/fcm-token      → Update FCM token
```

### Categories
```
GET    /api/categories           → List all active categories
GET    /api/categories/:id       → Single category
```

### Products
```
GET    /api/products             → List products (filter: category, search, featured)
GET    /api/products/:id         → Single product detail
GET    /api/products/search?q=   → Search products
```

### Orders
```
POST   /api/orders               → Place new order
GET    /api/orders               → My orders (auth required)
GET    /api/orders/:id           → Order detail
PUT    /api/orders/:id/cancel    → Cancel order (if still placed)
```

### Admin (protected, admin role only)
```
GET    /api/admin/dashboard              → Stats (orders today, revenue, etc.)
GET    /api/admin/orders                 → All orders with filters
PUT    /api/admin/orders/:id/status     → Update order status
GET    /api/admin/products               → All products
POST   /api/admin/products               → Create product
PUT    /api/admin/products/:id           → Update product
DELETE /api/admin/products/:id           → Delete product
GET    /api/admin/categories             → All categories
POST   /api/admin/categories             → Create category
PUT    /api/admin/categories/:id         → Update category
GET    /api/admin/users                  → All users
```

---

## 🎨 UI Design Guidelines

**Color Palette:**
- Primary Green: `#2E7D32` (trust, fresh, groceries)
- Accent Orange: `#FF6F00` (CTA buttons, badges)
- Background: `#F5F5F5`
- Card White: `#FFFFFF`
- Text Primary: `#1A1A1A`
- Text Secondary: `#757575`

**Typography:**
- Headings: `Poppins` (Bold/SemiBold)
- Body: `Poppins` (Regular/Medium)

**Design Notes:**
- Rounded corners on cards: 12px radius
- Bottom navigation with 5 tabs
- Use skeleton loading screens (not spinners)
- Product images: square ratio (1:1), rounded corners
- Status badges: color coded (yellow=placed, blue=confirmed, orange=out for delivery, green=delivered, red=cancelled)
- All currency in PKR (₨ or Rs.)

---

## 🔔 Push Notifications

Send FCM notification to customer when:
- Order confirmed by admin
- Order out for delivery
- Order delivered

---

## 🚀 Development Phases

### Phase 1 — Backend Foundation
- [ ] Setup Node.js + Express project
- [ ] Connect MongoDB
- [ ] Firebase Admin SDK setup
- [ ] Auth endpoints (OTP + JWT)
- [ ] User, Category, Product, Order models
- [ ] All API endpoints listed above
- [ ] Cloudinary integration for image uploads
- [ ] Admin middleware (role-based auth)

### Phase 2 — Flutter Customer App
- [ ] Project setup with folder structure (feature-based)
- [ ] Firebase setup (Auth + FCM)
- [ ] API service layer (Dio or http package)
- [ ] Auth flow screens
- [ ] Home screen
- [ ] Category + Product listing
- [ ] Product detail
- [ ] Cart (local state + sync)
- [ ] Checkout + order placement
- [ ] Order tracking screen
- [ ] Profile + addresses

### Phase 3 — Admin Panel
- [ ] Web dashboard (Flutter Web or React)
- [ ] Login for admin
- [ ] View and manage orders
- [ ] Update order status
- [ ] Add/edit/delete products with image upload
- [ ] Manage categories

### Phase 4 — Polish
- [ ] Skeleton loaders on all screens
- [ ] Empty states on all screens
- [ ] Error handling and retry logic
- [ ] Offline detection banner
- [ ] App icon and splash screen
- [ ] Performance optimization

---

## 📁 Flutter Project Folder Structure

```
lib/
├── core/
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_strings.dart
│   │   └── api_endpoints.dart
│   ├── theme/
│   │   └── app_theme.dart
│   ├── utils/
│   │   ├── validators.dart
│   │   └── helpers.dart
│   └── services/
│       ├── api_service.dart
│       ├── auth_service.dart
│       ├── notification_service.dart
│       └── storage_service.dart
├── features/
│   ├── auth/
│   │   ├── models/
│   │   ├── providers/
│   │   └── screens/
│   ├── home/
│   ├── categories/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── profile/
├── shared/
│   ├── widgets/
│   │   ├── product_card.dart
│   │   ├── category_card.dart
│   │   ├── custom_button.dart
│   │   ├── skeleton_loader.dart
│   │   └── empty_state.dart
│   └── models/
│       ├── user_model.dart
│       ├── product_model.dart
│       ├── order_model.dart
│       └── category_model.dart
└── main.dart
```

---

## 📦 Flutter Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Networking
  dio: ^5.0.0
  
  # State Management
  provider: ^6.0.0
  
  # Firebase
  firebase_core: ^2.0.0
  firebase_auth: ^4.0.0
  firebase_messaging: ^14.0.0
  
  # Local Storage
  shared_preferences: ^2.0.0
  flutter_secure_storage: ^8.0.0
  
  # UI Components
  cached_network_image: ^3.0.0
  shimmer: ^3.0.0
  carousel_slider: ^4.0.0
  badges: ^3.0.0
  
  # Navigation
  go_router: ^10.0.0
  
  # Utils
  intl: ^0.18.0
  image_picker: ^1.0.0
```

---

## 🌐 Backend Folder Structure (Node.js)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── firebase.js
│   │   └── cloudinary.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── admin.middleware.js
│   └── utils/
│       └── sendNotification.js
├── .env
├── server.js
└── package.json
```

---

## ⚙️ Environment Variables (.env)

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## 🧪 MVP Launch Checklist

- [ ] Customer can register with phone number (OTP)
- [ ] Customer can browse categories and products
- [ ] Customer can add to cart and place order (COD)
- [ ] Admin can see new orders and update status
- [ ] Customer receives push notification on status change
- [ ] Backend deployed and live
- [ ] App tested on Android device

---

## 📝 Notes for Developer

- All prices in PKR (Pakistani Rupees)
- Phone numbers in +92 format
- Default city: Lahore (no multi-city for now)
- COD is the only payment method for MVP — no online payment needed at launch
- Keep delivery fee flat: Rs. 99 per order (configurable later)
- No rider app for MVP — admin manually calls rider and updates status
- Product images are uploaded via admin panel to Cloudinary
- Use pagination (limit 20 products per page) on all product lists
