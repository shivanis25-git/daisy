# 🌼 Daisy — Smart Mail Notification & Voice Assistant System

> **BCA Student Hackathon Project**  
> Full-Stack Real-Time Email Platform with Socket.IO Instant Alerts & Browser Web Speech Synthesis

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v18+ or v20+ / v22+
- **NPM**: v9+ / v10+

### 2. Run the Application
Open your terminal in the project directory:

```bash
# 1. Dependencies install karein
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
 Ready for 2-user demo test (Arjun & Priya)!
======================================================
```

Ab browser mein kholiye: **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ 2-User Real-Time Hackathon Demo (Live Test)

Is project ka sabse bada highlight iska **2-User Real-Time Socket.IO + Speech Assistant Loop** hai:

1. **Tab 1 (Arjun Verma)**:
   - Browser mein `http://localhost:3000` kholein.
   - Click **"🚀 Arjun Verma (arjun@daisy.mail)"** for 1-click login.
2. **Tab 2 (Priya Sharma)**:
   - Ek naya **Incognito Window** (ya doosra browser) kholein: `http://localhost:3000`.
   - Click **"🚀 Priya Sharma (priya@daisy.mail)"** for 1-click login.
3. **Email Send Test**:
   - Arjun ke tab se **Compose Email** par click karein.
   - Recipient mein `priya@daisy.mail` select karein, Subject aur Body likhein aur **Send Email** dabayein.
4. **Live Verification in Priya's Tab (Without refreshing the page!)**:
   - ⚡ **Socket.IO Real-Time Toast**: Screen ke bottom-right mein popup alert aayega.
   - 🔔 **Unread Counter**: Top & Sidebar mein unread badge badh jayega.
   - 🗣️ **Daisy Voice Announcement**: Daisy automatically announce karegi:  
     *"You have received a new email from Arjun Verma. Subject: ..."*
   - 🎧 **Interactive Audio Player**: Email open karke **"Listen to Email"** dabane par Play / Pause / Resume / Stop / Speed controls ke saath poora message padh kar sunayegi.

---

## 🛠️ Complete Tech Stack & Libraries Used

| Technology / Library | Role & Purpose |
| :--- | :--- |
| **React 19 & TypeScript** | Component-driven frontend (AuthView, EmailList, EmailDetail, VoiceSettings, ComposeModal) |
| **Vite 6** | Ultra-fast bundler integrated directly as Express middleware |
| **Tailwind CSS v4** | Frutiger Aero / Aqua Glassmorphism styling (`backdrop-filter: blur`, jelly buttons, subtle gradients) |
| **Lucide React** | Sleek modern UI icons (Inbox, Send, Sliders, Volume2, Mic, Wifi) |
| **Express.js & Node.js** | Backend REST APIs (`/api/auth/*`, `/api/emails/*`, `/api/users/directory`) |
| **Socket.IO (Server & Client)** | Bi-directional WebSocket communication for instant mail alerts & live user presence |
| **Nodemailer** | SMTP email processor generating valid MIME headers, `messageId`, and `250 OK` delivery status |
| **Mongoose & MongoDB** | MongoDB Atlas schema integration |
| **Dual DB Fallback Engine** | Agar `MONGODB_URI` set na ho, app automatically `data/daisy-store.json` mein persist karta hai |
| **bcryptjs & jsonwebtoken** | Password hashing (salt rounds 10) & JWT token session authentication |
| **Web Speech Synthesis API** | Native browser text-to-speech engine (`window.speechSynthesis`) with sentence chunking |

---

## 📐 Architecture & Real-Time Flow

```
+-------------------------------------------------------------+
|               USER A (arjun@daisy.mail)                     |
|           Clicks Compose -> Hits "Send Email"               |
+-------------------------------------------------------------+
                              |
                     POST /api/emails/send
                              |
                              v
+-------------------------------------------------------------+
|                     DAISY EXPRESS SERVER                    |
| 1. Processes email through Nodemailer (MIME / SMTP)         |
| 2. Persists email to MongoDB Atlas or data/daisy-store.json |
| 3. Emits 'mail:sent' to user:arjun@daisy.mail room          |
| 4. Emits 'mail:received' to user:priya@daisy.mail room      |
+-------------------------------------------------------------+
                              |
               Socket.IO WebSocket Dispatch
                              |
                              v
+-------------------------------------------------------------+
|               USER B (priya@daisy.mail)                     |
|  - Real-time Notification Toast appears instantly           |
|  - Unread badge counter increments (+1)                     |
|  - Web Speech Engine automatically announces arrival        |
|  - User clicks "Listen to Email" with Play/Pause/Stop       |
+-------------------------------------------------------------+
```

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
│   │   ├── AuthView.tsx       # Sign In / Sign Up + 1-Click Instant Demo Login cards
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

## 🎓 Viva / Presentation Questions & Concept Answers

### Q1: Why doesn't Socket.IO detect email delivery automatically?
**Answer**: Socket.IO is a bi-directional WebSocket protocol for real-time messaging, not an email server. When an email is sent:
1. Express backend receives the `POST /api/emails/send` request.
2. The server dispatches the mail via **Nodemailer** (SMTP).
3. The server saves the record in **MongoDB** / Store.
4. The server explicitly emits the event `io.to('user:recipient@daisy.mail').emit('mail:received', ...)`.
Socket.IO acts as the bridge connecting the backend mail event to the client in real-time.

### Q2: Why is sentence chunking used in Web Speech Synthesis?
**Answer**: Browser implementations of `window.speechSynthesis` have a known limitation where utterances longer than 15 seconds can randomly pause or stop due to internal garbage collection. Daisy splits email text into clean sentence arrays (`splitIntoSentences`) and plays them sequentially chunk-by-chunk, guaranteeing 100% reliable playback even for long emails.

### Q3: How does the Dual Database fallback work?
**Answer**: In `server/db.ts`, if `MONGODB_URI` is provided in `.env`, the app connects to MongoDB via Mongoose. If MongoDB is unavailable or not configured, it gracefully falls back to `data/daisy-store.json`. This makes the project zero-dependency and instantly runnable for hackathons.

---

## 🔑 Starter Accounts (Seeded by Default)

| Name | Email | Default Password | Role |
| :--- | :--- | :--- | :--- |
| **Arjun Verma** | `arjun@daisy.mail` | `daisy123` | BCA Final Year / Team Lead |
| **Priya Sharma** | `priya@daisy.mail` | `daisy123` | BCA 2nd Year / Frontend Developer |
| **Prof. Rohan Nair** | `mentor@daisy.mail` | `daisy123` | Faculty Mentor & Hackathon Evaluator |
