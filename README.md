# 🌼 Daisy — Smart Mail Notification & Voice Assistant System

> Full-Stack Real-Time Email Platform with Socket.IO Instant Alerts & Browser Web Speech Synthesis

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v18+ or v20+ / v22+
- **NPM**: v9+ / v10+

### 2. Run the Application
Open your terminal in the project directory:

```bash
# 1. Dependencies install karein (agar pehle nahi kiya ho)
npm install

# 2. Development server start karein (Backend + Vite Frontend on port 3000)
npm run dev
```

Terminal will display:
```text
======================================================
 [Daisy] Smart Mail & Voice Assistant listening on http://0.0.0.0:3000
 Dual DB Mode: Local JSON Store (data/daisy-store.json)
 Real-time Socket.IO: ACTIVE
 Ready for demo test (Shivani)!
======================================================
```

Ab browser mein kholiye: **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Demo Walkthrough

1. **Login**:
   - Browser mein `http://localhost:3000` kholein.
   - Click **"⚡ Quick 1-Click Demo Login"** on **Shivani** (`shivani@daisy.mail`).
   - Ya phir **Create Account** tab se apna naya account register karein.
2. **Real-time Notifications**:
   - Multiple tabs ya incognito window mein naya account register karke Shivani ko email bhejein.
   - Shivani ke tab mein bina refresh kiye:
     - ⚡ **Socket.IO Real-Time Toast**: Screen ke bottom-right mein popup alert aayega.
     - 🔔 **Unread Counter**: Top & Sidebar mein unread badge badh jayega.
     - 🗣️ **Daisy Voice Announcement**: Daisy automatically announce karegi:  
       *"You have received a new email from..."*
     - 🎧 **Interactive Audio Player**: Email open karke **"Listen to Email"** dabane par Play / Pause / Resume / Stop / Speed controls ke saath poora message padh kar sunayegi.

---

## 🛠️ Complete Tech Stack & Libraries Used

| Technology / Library | Role & Purpose |
| :--- | :--- |
| **React 19 & TypeScript** | Component-driven frontend (AuthView, EmailList, EmailDetail, VoiceSettings, ComposeModal) |
| **Vite 6** | Ultra-fast bundler integrated directly as Express middleware |
| **Tailwind CSS v4** | Frutiger Aero / Aqua Glassmorphism styling (`backdrop-filter: blur`, jelly buttons, subtle gradients) |
| **Lucide React** | Modern UI icons (Inbox, Send, Sliders, Volume2, Mic, Wifi) |
| **Express.js & Node.js** | Backend REST APIs (`/api/auth/*`, `/api/emails/*`, `/api/users/directory`) |
| **Socket.IO (Server & Client)** | Bi-directional WebSocket communication for instant mail alerts & live user presence |
| **Nodemailer** | SMTP email processor generating valid MIME headers, `messageId`, and `250 OK` delivery status |
| **Mongoose & MongoDB** | MongoDB Atlas schema integration |
| **Dual DB Fallback Engine** | Agar `MONGODB_URI` set na ho, app automatically `data/daisy-store.json` mein persist karta hai |
| **bcryptjs & jsonwebtoken** | Password hashing (salt rounds 10) & JWT token session authentication |
| **Web Speech Synthesis API** | Native browser text-to-speech engine (`window.speechSynthesis`) with sentence chunking |

---

## 📁 Folder Structure Explained

```
daisy/
├── data/
│   └── daisy-store.json       # Persistent local JSON database (fallback when MongoDB is not connected)
├── server/
│   ├── types.ts               # User, Email, Preferences TypeScript types
│   ├── db.ts                  # Dual DB repository (MongoDB Mongoose + persistent JSON fallback)
│   ├── mailer.ts              # Nodemailer SMTP & local transport service
│   └── auth.ts                # JWT authentication & bcryptjs password hashing
├── src/
│   ├── components/
│   │   ├── AuthView.tsx       # Sign In / Sign Up + 1-Click Instant Demo Login (Shivani)
│   │   ├── Navbar.tsx         # Top bar with Daisy logo, live search, Socket status, mute toggle
│   │   ├── Sidebar.tsx        # Navigation, Compose button, Auto-announce switch, Directory
│   │   ├── EmailList.tsx      # All / Unread / Starred filters, list view, quick listen button
│   │   ├── EmailDetail.tsx    # Reading pane, SMTP messageId proof, embedded VoiceAssistantBar
│   │   ├── VoiceAssistantBar.tsx # Play, Pause, Resume, Stop, Progress bar, Waveform animation
│   │   ├── VoiceSettingsView.tsx # Rate slider, Pitch slider, Voice dropdown, Test Voice button
│   │   ├── ComposeModal.tsx   # Recipient selector with quick chips, subject, body
│   │   └── NotificationToast.tsx # Real-time popup when email arrives
│   ├── hooks/
│   │   └── useSpeechAssistant.ts # Browser Web Speech Synthesis hook with sentence chunking
│   ├── lib/
│   │   └── api.ts             # REST client with JWT token handling
│   ├── types.ts               # Frontend TypeScript interfaces
│   ├── App.tsx                # Main app state, Socket.IO listeners, view router
│   ├── index.css              # Aqua Glassmorphism CSS classes & animations
│   └── main.tsx               # React DOM entry point
├── server.ts                  # Express + Socket.IO + Vite middleware server
├── vite.config.ts             # Vite configuration with Tailwind CSS plugin
├── tsconfig.json              # TypeScript compiler configuration
├── .env.example               # Environment variables template
├── .env                       # Local environment configuration
└── package.json               # Dependencies and scripts
```

---

## 🔑 Starter Demo Account

| Name | Email | Default Password | Role |
| :--- | :--- | :--- | :--- |
| **Shivani** | `shivani@daisy.mail` | `daisy123` | Team Lead |
