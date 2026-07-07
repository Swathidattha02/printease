# 🖨️ PrintEase — Xerox & Document Printing Management System

PrintEase is a modern web-based document printing and xerox management system designed to automate order placement and processing for print shops. Users can upload documents (PDF), specify custom print configurations (copies, paper size, color preferences), calculate exact pricing in real-time, submit UPI payments with screenshot confirmations, and track order completion status. Admins have a dedicated panel to review orders, verify payments, and manage fulfillment.

---

## ✨ Features

### 👤 Customer App
- **Secure Authentication**: User registration and login using JWT-based authentication.
- **Document Management**: Direct PDF upload with safety checks.
- **Custom Print Settings**:
  - Print Type: Black & White (B/W) or Color.
  - Paper Size: Options like A4, Letter, etc.
  - Number of Copies.
  - Pickup scheduling.
- **Price Calculation**: Instant pricing estimates based on print options and document parameters.
- **UPI Payment Verification**: Seamless order placement with UPI payment detail entry and screenshot uploads.
- **Order Tracking**: Real-time status tracking (Draft, Pending, Paid, Completed).

### 👑 Admin Dashboard
- **Consolidated Order Board**: Overview of all client orders sorted chronologically.
- **Payment Verification**: Verify payment detail transactions and visual inspection of uploaded UPI screenshots.
- **Status Control**: Advance orders through stages (Pending ➔ Processing ➔ Ready for Pickup ➔ Completed).
- **Admin Accounts**: Create and configure admin roles via utility scripts.

---

## 🛠️ Tech Stack

- **Frontend**: React (v19), React Router DOM (v7), Axios, Vanilla CSS.
- **Backend**: Node.js, Express (v5), Multer (file uploads), JWT, Bcrypt.
- **Database**: MongoDB (via Mongoose).
- **Other Utilities**: PDF-Parse (metadata processing), Nodemailer (email services).

---

## 📂 Project Structure

```
xeroxprj/
├── backend/                  # Node.js / Express API
│   ├── controllers/          # Request handler functions
│   ├── middleware/           # Auth and upload middleware
│   ├── models/               # MongoDB Mongoose schemas
│   ├── routes/               # API endpoints (auth, orders, prints)
│   ├── uploads/              # Local storage folder for documents and receipts
│   ├── server.js             # Entry point
│   └── .env                  # Configuration variables (git-ignored)
├── frontend/
│   └── xerox_web/            # React Single Page Application (SPA)
│       ├── public/           # Static public assets
│       ├── src/              # React source code (components, pages, routing)
│       └── package.json      # React project dependencies & scripts
├── .gitignore                # Root-level ignore configuration
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (local community server or MongoDB Atlas URI)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and configure the environment variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/printease
   JWT_SECRET=your_jwt_secret_key_here
   ```
4. (Optional) Run the admin seed script if you want to initialize an admin user:
   ```bash
   node create_admin.js
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend/xerox_web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The application will open in your default browser at `http://localhost:3000`.*

---

## 🔒 Security & Environment
- Important configuration settings (such as DB credentials, session tokens) must be saved inside `.env` configurations.
- Never commit private credentials or `.env` files to git. A root `.gitignore` is provided to ensure local logs, uploads, node_modules, and environment credentials remain local to your development computer.
