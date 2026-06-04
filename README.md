# Wholesale Pricing Engine

A full-stack wholesale pricing and rebate management application that helps businesses calculate unit pricing, manage materials, and track historical pricing snapshots.

## 🚀 Live Demo

**Live Application:** [Add your Vercel URL here]

---

## 📸 Screenshots

### How to Take Professional Screenshots

Before capturing, set up your browser properly:

- Use a clean browser profile with no personal bookmarks or extensions visible
- Set zoom to **100%** and window width to **1440px**
- Clear any test/placeholder data from the UI
- Use Chrome DevTools (`Ctrl+Shift+P` → "Capture screenshot") for full-page captures
- Export as **PNG** (lossless, sharp text)
- Frame screenshots using **Shots.so** or **Figma** device frames for a polished look

---

### Authentication

Capture the following on the login/register pages:

- Login form with email and password fields
- "Sign in with Google" button
- Register form with name, email, and password fields
- Clean, minimal UI with no errors shown
- Consistent branding across both pages

```
<img src="screenshots/Login.png" alt="Login" >
<img src="screenshots/Register.png" alt="Register" >



```

**Tips:**
- Show the login page at rest (no error states)
- Make sure the Google OAuth button is fully visible
- Capture register page separately to show the full onboarding flow

---

### Dashboard — Wholesale Pricing Engine

Capture the following on the main dashboard:

- Gross Total display (prominently visible)
- Rebate value and calculation
- Material table with at least 2–3 rows of data
- Unit price calculations column
- Navigation/sidebar if applicable


![Dashboard](https://github.com/rhokeebsanni/wholesale-pricing-engine/blob/866263f5016b0dd629bb70bb6dfafb80224860e4/dashboard.png)


**Tips:**
- Pre-fill the dashboard with realistic dummy data (e.g. Steel Rods, Aluminum Sheets)
- Make sure Gross Total and Rebate values are non-zero so the calculation logic is visible
- Capture at full width so the material table isn't truncated

---

## ✨ Features

- User authentication with JWT
- Google OAuth Sign-In
- Email verification with OTP
- Material CRUD operations
- Real-time rebate calculations
- Snapshot history tracking
- Protected API routes
- Responsive design

---

## 🛠 Tech Stack

### Frontend
- React
- React Router
- Axios
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication & Security
- JWT
- Google OAuth
- Bcrypt
- OTP Email Verification

### Deployment
- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas (Database)

---

## 🏗 Architecture

```
React Frontend
       │
       ▼
Express API
       │
       ▼
MongoDB Atlas
```

---

## 🔑 Key Technical Challenges Solved

**Authentication Persistence**
Implemented automatic session restoration using JWT access tokens and refresh tokens.

**OAuth Integration**
Integrated Google Sign-In with account linking and profile synchronization.

**Protected Routes**
Built middleware-based authentication for securing user-specific resources.

**Snapshot System**
Designed a history tracking system that stores rebate calculations for future reference.

---

## ⚙️ Local Setup

**Frontend:**
```bash
git clone https://github.com/rhokeebsanni/rebate-calculator.git
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd server
npm install
npm run dev
```

---

## 👤 Author

**Rhokeeb Sanni**
GitHub: [@rhokeebsanni](https://github.com/rhokeebsanni)
