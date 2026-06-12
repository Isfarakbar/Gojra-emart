# Gojra E-Mart - Complete Project Documentation

## 1. Project Overview
**Gojra E-Mart** is a comprehensive, full-stack e-commerce solution designed specifically to serve the Gojra City region (with geofencing capabilities). The platform allows customers to browse products, manage carts, place orders, and track their history, while providing administrators with a powerful dashboard to manage inventory, users, and view analytics.

---

## 2. Technology Stack

### Backend (REST API Server)
- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Database:** MongoDB (Atlas Cloud)
- **ODM:** Mongoose
- **Authentication:** JSON Web Tokens (JWT) & Google OAuth (google-auth-library)
- **File Storage:** Cloudinary (via Multer for image uploads)
- **Email Delivery:** Nodemailer (using Gmail SMTP for password recovery)
- **Security:** bcryptjs (password hashing), CORS configured for specific origins.

### Admin Panel (Frontend Web)
- **Framework:** Next.js 16 (App Router with Turbopack)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Custom dark glassmorphism aesthetic)
- **Icons:** Lucide React
- **HTTP Client:** Axios (with interceptors for automatic token handling & 401 redirects)

### Customer Application (Frontend Mobile/Desktop)
- **Framework:** Flutter (Dart)
- **State Management:** Provider pattern
- **HTTP Client:** Dio
- **Local Storage:** Flutter Secure Storage (for JWT tokens) & Shared Preferences
- **Location Services:** Geolocator (for geofencing users within Gojra City)
- **UI Elements:** Google Fonts, Shimmer (loading states), Lottie (animations)

---

## 3. Core Features & Functionality

### 👤 User Authentication & Security
- **Registration & Login:** Email/password authentication with JWT.
- **Google Login:** Seamless one-tap Google authentication.
- **Forgot Password Flow:** Secure 6-digit OTP code sent via real SMTP email.
- **Role-Based Access Control:** Differentiates between `user` and `admin`.

### 🛒 Customer App (Flutter)
- **Geofencing:** App checks GPS location on launch. Only users within a 6km radius of Gojra City are permitted to use the app. (Desktop/Web bypasses this for testing).
- **Home Screen:** Dynamic banners, categorized product sections, and horizontal scrolling layout.
- **Product Management:** Search functionality, product details, stock indicators, and a persistent Wishlist.
- **Cart & Checkout:** Real-time cart calculation, capture of delivery coordinates, and order placement.
- **Order Tracking:** Users can view their past orders, delivery status (Processing, Shipped, Delivered), and payment methods (e.g., Cash on Delivery).

### ⚙️ Admin Dashboard (Next.js)
- **Premium UI:** Dark mode, glassmorphic cards, smooth transitions, and a modern sidebar.
- **Analytics Dashboard:** Real-time metrics showing Total Revenue, Total Orders, Product Count, and User Count.
- **Product Management:** Full CRUD (Create, Read, Update, Delete) operations. Includes image uploading directly to Cloudinary.
- **Category Management:** Create and organize product categories.
- **Order Management:** View all customer orders and update delivery statuses.
- **User Management:** View registered users, filter by roles (Admin/Customer), and monitor registration dates.

---

## 4. API Endpoints Overview

The backend exposes a structured RESTful API at `http://localhost:5000/api`:

- **Auth:** `/api/auth/login`, `/register`, `/google`, `/forgot-password`, `/verify-otp`, `/reset-password`
- **Users:** `/api/users/profile` (Customer viewing their data), `/api/users` (Admin viewing all users)
- **Products:** `/api/products` (GET all, POST new, PUT update, DELETE)
- **Categories:** `/api/categories` (Manage product groupings)
- **Orders:** `/api/orders` (Place orders, Admin view all), `/api/orders/myorders` (Customer history)
- **Analytics:** `/api/analytics/dashboard` (Admin stats)
- **Layout:** `/api/layout/home` (Dynamic banners and sections for the Flutter app)

---

## 5. Deployment & Configuration Details

### Environment Variables (.env)
The project relies on a secure `.env` file containing:
- MongoDB URI for database connections.
- JWT Secret for token signing.
- Cloudinary keys for image hosting.
- Google Client ID for OAuth.
- SMTP Credentials (Email/App Password) for OTP delivery.

### Running the Project Locally
1. **Backend:** `cd backend && npm run dev` (Runs on port 5000)
2. **Admin Panel:** `cd admin && npm run dev` (Runs on port 3000)
3. **Flutter App:** `cd frontend && flutter run -d windows` (Connects to localhost:5000)

*Note: The Flutter app uses Dio interceptors mapped to `127.0.0.1:5000` for Windows desktop testing, and `10.0.2.2:5000` for Android Emulator testing.*
