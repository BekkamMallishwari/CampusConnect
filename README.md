# 🎓 CampusConnect

> AI-Powered Smart Campus Lost & Found Platform

CampusConnect is a modern full-stack web application that helps students securely report lost and found items, communicate safely, verify ownership, schedule meetings, negotiate rewards, and complete secure online payments.

Built with React, Node.js, MongoDB, Socket.IO, AI-powered item matching, and Razorpay.

---

# ✨ Features

## 🔐 Authentication

- JWT Authentication
- Google OAuth Login
- Protected Routes
- Role-Based Access
- Password Reset

---

## 🔍 AI Lost & Found

- Report Lost Items
- Report Found Items
- AI Image Matching
- AI Text Similarity Matching
- Smart Match Suggestions
- Match Review System

---

## 💬 Real-Time Communication

- Secure Chat
- Socket.IO Messaging
- Live Notifications
- Meeting Scheduling
- Live Location Sharing

---

## ✅ Ownership Verification

- Question-based Verification
- Match Confirmation
- Secure Item Handover Workflow

---

## 💰 Reward System

- Owner decides reward amount
- Reward Negotiation
- Finder Accept / Decline
- Razorpay Payment Integration
- PDF Payment Receipt
- Transaction History

---

## 🗺️ Campus Services

- Interactive Campus Map
- Community Portal
- Search
- Notifications
- User Dashboard
- Rewards Dashboard

---

## 🎨 Modern UI

- Responsive Design
- Dark Mode
- Light Mode
- Professional Dashboard
- Beautiful Animations
- Mobile Friendly

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client
- Leaflet
- Firebase

## Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Passport.js
- JWT
- Socket.IO
- Cloudinary
- Razorpay
- Resend
- Multer

## AI Service

- Python
- FastAPI
- OpenAI
- Image Matching
- Text Similarity

---

# 📂 Project Structure

```
CampusConnect/
│
├── frontend/
├── backend/
├── ai/
├── .env.example
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/BekkamMallishwari/CampusConnect.git

cd CampusConnect
```

---

## Install Frontend

```bash
cd frontend

npm install

npm run dev
```

Runs at:

```
http://localhost:5173
```

---

## Install Backend

```bash
cd backend

npm install

npm run dev
```

Runs at:

```
http://localhost:5001
```

---

## Start AI Service

```bash
cd ai

pip install -r requirements.txt

uvicorn main:app --reload
```

Runs at:

```
http://localhost:8000
```

---

# 🔑 Environment Variables

Create `.env` files using the provided examples.

### Backend

```
MONGO_URI=

JWT_SECRET=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

OPENAI_API_KEY=

RESEND_API_KEY=
```

### Frontend

```
VITE_API_URL=

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=

VITE_FIREBASE_STORAGE_BUCKET=

VITE_FIREBASE_MESSAGING_SENDER_ID=

VITE_FIREBASE_APP_ID=
```

---

# 🔄 Lost & Found Workflow

```
Report Lost Item
        │
        ▼
Report Found Item
        │
        ▼
AI Matching
        │
        ▼
Review Match
        │
        ▼
Secure Chat
        │
        ▼
Schedule Meeting
        │
        ▼
Ownership Verification
        │
        ▼
Reward Negotiation
        │
        ▼
Reward Payment
        │
        ▼
Return Item
        │
        ▼
Complete
```

---

# 💳 Payment Workflow

- Lost owner chooses reward amount
- Finder accepts or declines
- Razorpay Checkout opens
- Secure payment verification
- PDF receipt generated
- Transaction stored in MongoDB

---

# 📸 Screenshots

Add screenshots of:

- Landing Page
- Dashboard
- Lost Item Report
- Found Item Report
- Chat
- Match Review
- Reward Negotiation
- Payment
- Campus Map

---

# 🚀 Deployment

## Frontend

Vercel

## Backend

Render / Railway

## Database

MongoDB Atlas

## AI

Render / Railway / VPS

---

# 👩‍💻 Author

**Bekkam Mallishwari**

GitHub: https://github.com/BekkamMallishwari

LinkedIn: *(Add your LinkedIn profile here)*

---

# 📄 License

This project is licensed under the MIT License.
