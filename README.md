# Rebate Calculator - Wholesale Pricing Engine

A full-stack web application for calculating and managing wholesale pricing with trade rebates. Built with React, Node.js, Express, and MongoDB.

## 🎯 Features

- **User Authentication**: Email/password registration + Google OAuth SSO
- **Email Verification**: OTP-based verification system
- **Calculation Dashboard**: Real-time rebate calculations
- **Material Management**: CRUD operations for product SKUs
- **History Tracking**: Save and retrieve calculation snapshots
- **JWT Sessions**: Secure token-based authentication

---

## 📋 Prerequisites

- **Node.js** v16+ and npm v8+
- **MongoDB** Atlas account (or local MongoDB instance)
- **Google OAuth 2.0** credentials
- **Gmail App-Specific Password** for email notifications

---

## 🚀 Setup Instructions

### 1. **Backend Setup**

```bash
cd server
npm install
```

Create a `.env` file (use `.env.example` as template):

```env
PORT=5000
MONGO_URI=mongodb://user:password@cluster.mongodb.net/rebate?ssl=true&authSource=admin
JWT_SECRET=your_secret_key_here_min_32_characters_recommended
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password_here
```

Start the development server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 2. **Frontend Setup**

```bash
cd frontend
npm install
```

Create a `.env` file (use `.env.example` as template):

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## 🔑 Environment Variables

### Server (`server/.env`)

| Variable           | Description                 | Example                |
| ------------------ | --------------------------- | ---------------------- |
| `PORT`             | Express server port         | `5000`                 |
| `MONGO_URI`        | MongoDB connection string   | `mongodb://...`        |
| `JWT_SECRET`       | Secret for JWT signing      | `your_secret_key_...`  |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID      | `156489...`            |
| `EMAIL_USER`       | Gmail account for SMTP      | `your_email@gmail.com` |
| `EMAIL_PASS`       | Gmail app-specific password | `wekndrfzfbdtikhy`     |

### Frontend (`frontend/.env`)

| Variable                | Description            | Example                        |
| ----------------------- | ---------------------- | ------------------------------ |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `156489...`                    |
| `VITE_API_BASE_URL`     | Backend API base URL   | `http://localhost:5000/api/v1` |

---

## 📚 API Routes

### Authentication (`/api/v1/auth`)

| Method | Endpoint        | Description                          |
| ------ | --------------- | ------------------------------------ |
| `POST` | `/login`        | Login with email/password            |
| `POST` | `/register`     | Create new account                   |
| `POST` | `/google`       | Google OAuth login                   |
| `POST` | `/verify-email` | Verify account with OTP              |
| `POST` | `/resend-otp`   | Request new OTP                      |
| `GET`  | `/me`           | Get current user profile (protected) |

### Materials (`/api/v1/materials`)

| Method   | Endpoint | Description                     |
| -------- | -------- | ------------------------------- |
| `GET`    | `/`      | List all materials (protected)  |
| `POST`   | `/`      | Create new material (protected) |
| `GET`    | `/:id`   | Get material by ID (protected)  |
| `PUT`    | `/:id`   | Update material (protected)     |
| `DELETE` | `/:id`   | Delete material (protected)     |

### Snapshots (`/api/v1/snapshots`)

| Method | Endpoint | Description                         |
| ------ | -------- | ----------------------------------- |
| `GET`  | `/`      | Get calculation history (protected) |
| `POST` | `/`      | Save new calculation (protected)    |

---

## 🗄️ Database Schema

### Users

```javascript
{
  username: String (required, min 3),
  email: String (required, unique),
  password: String (hashed with bcrypt),
  googleId: String (unique, optional),
  image: String (avatar URL),
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  verificationOTP: String,
  otpExpiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Materials

```javascript
{
  userId: ObjectId (ref: User),
  name: String (required),
  sku: String (required),
  yieldPerTon: Number (required, > 0),
  description: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Snapshots

```javascript
{
  userId: ObjectId (ref: User),
  grossTotal: Number,
  rebate: Number,
  netTotal: Number,
  items: [{
    name: String,
    yieldperton: Number,
    calculatedUnitPrice: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security Features

✅ **Password Security**

- Passwords hashed with bcrypt (salt rounds: 10)
- Passwords excluded from default queries
- Password confirmation validation

✅ **Authentication**

- JWT-based session tokens (24-hour expiry)
- Token stored in localStorage with XSS protection
- Automatic logout on token expiration

✅ **Email Verification**

- 6-digit OTP sent to new accounts
- 15-minute OTP validity window
- Resend OTP functionality

✅ **OAuth Integration**

- Google OAuth 2.0 with auto-account linking
- Verified email bypass for Google users

✅ **Environment Protection**

- Sensitive credentials in `.env` files
- `.env` excluded from git via `.gitignore`
- Required env var validation at startup

---

## 🧪 Testing

### Run ESLint (Frontend)

```bash
cd frontend
npm run lint
```

### Build Frontend

```bash
cd frontend
npm run build
```

---

## 📂 Project Structure

```
.
├── server/                 # Express backend
│   ├── app.js             # Main app entry
│   ├── controllers/       # Request handlers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── db/                # Database config
│   ├── errors/            # Error handling
│   └── package.json
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── api/          # API client
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🛠️ Troubleshooting

### **Server won't start**

- Verify all env variables in `.env` are set
- Check MongoDB connection string
- Ensure port 5000 is available

### **Login fails with email verification**

- Check Gmail app-specific password is correct
- Verify EMAIL_USER and EMAIL_PASS in `.env`
- Check inbox spam folder for OTP email

### **Frontend can't connect to API**

- Verify `VITE_API_BASE_URL` matches backend server
- Check CORS settings in backend
- Ensure backend is running on the correct port

### **Google OAuth not working**

- Verify GOOGLE_CLIENT_ID is correct
- Add authorized JavaScript origins in Google Console
- Check that credentials are for web application type

---

## 📝 Recent Fixes & Improvements

✅ **Security**

- Removed exposed credentials from tracked files
- Added environment variable validation
- Created `.env.example` templates

✅ **Features**

- Implemented `/auth/me` endpoint for user profile
- Added `/materials` CRUD endpoints
- Improved error handling with detailed messages

✅ **Frontend**

- Added ErrorBoundary component
- Made API base URL configurable
- Improved authentication state management

✅ **Backend**

- Enhanced database connection with retry logic
- Improved error middleware for all error types
- Better validation and error responses

---

## 📞 Support

For issues or questions, please review the API routes documentation above or check the console logs for detailed error messages.

---

## 📜 License

ISC

---

**Last Updated**: May 2026  
**Version**: 1.0.0
