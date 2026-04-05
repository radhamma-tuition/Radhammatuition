# 🪔 RADHAMMA Tuition — VS Code Project

A full-featured tuition management web app built with **HTML, CSS, JavaScript** and **Firebase Firestore**.

---

## 📁 Project Structure

```
radhamma-tuition/
├── index.html          ← Main HTML file (open this in browser)
├── css/
│   └── styles.css      ← All styles (variables, layout, components)
├── js/
│   └── app.js          ← All JavaScript (Firebase, auth, CRUD, charts, AI)
├── assets/             ← Place images / icons here if needed
├── .vscode/
│   ├── settings.json   ← VS Code editor settings
│   └── extensions.json ← Recommended extensions
└── README.md           ← This file
```

---

## 🚀 How to Open & Run

### Option 1 — Live Server (Recommended)
1. Open the `radhamma-tuition` folder in **VS Code**
2. Install the **Live Server** extension (listed in extensions.json)
3. Right-click `index.html` → **"Open with Live Server"**
4. App opens at `http://127.0.0.1:5500`

### Option 2 — Direct Browser
- Double-click `index.html` to open in Chrome/Edge/Firefox

---

## 🔥 Firebase Setup

Your Firebase project is already configured in `js/app.js`:

```
Project:  radhamma-tuition-3bed3
Database: Firestore
Analytics: Enabled (G-J45ZMBY9DX)
```

### Firestore Security Rules
Go to **Firebase Console → Firestore → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Update these rules before going to production.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Login | Teacher & Student roles |
| 📝 Register | 3-step OTP registration for students |
| 🔑 Forgot Password | Security question-based reset |
| 👨‍🎓 Students | Add / Edit / Delete student records |
| 📋 Attendance | Daily attendance with summary charts |
| 📊 Test Marks | Subject-wise marks with grade calculation |
| 💰 Fee Tracking | Payment recording and status tracking |
| 🔔 Notifications | Send notices to parents / students |
| 💬 Feedback | Student feedback with star ratings |
| 📈 Charts | 5 analytics charts (Chart.js) |
| 🤖 AI Agent | Claude-powered tuition assistant |
| 📚 Book Library | NCERT & CBSE books for Classes 6–10 |
| 📱 Responsive | Works on mobile, tablet, and desktop |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — No framework needed
- **Firebase Firestore** — Real-time cloud database
- **Firebase Analytics** — Page & event tracking
- **Chart.js** — Data visualizations
- **Claude API** — AI teaching assistant
- **Google Fonts** — Playfair Display + DM Sans

---

## 👩‍🏫 Login Credentials

| Role | Username | Password |
|---|---|---|
| Teacher | `admin` | `admin123` |
| Student | `student1` | `pass123` |
| Student | `student2` | `pass123` |

---

## 📞 Support

Built for RADHAMMA Tuition Centre, Hyderabad.
