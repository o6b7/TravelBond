# 🌍 TravelBond — AI-Powered Travel Networking Platform

**TravelBond** is a modern, responsive web application developed as a **Final Year Project** for the **BSc (Hons) Software Engineering** program at **Asia Pacific University (APU)**. The platform is designed to **foster authentic cultural exchange** by connecting **travelers and local hosts** in a safe, AI-enhanced, and personalized environment.

---

## 🎯 Project Objective

The core goal of TravelBond is to deliver a full-stack platform that:
- Facilitates meaningful cultural immersion, not just sightseeing
- Encourages social connection and trust between hosts and travelers
- Enhances user compatibility through AI-driven matchmaking
- Personalizes the travel experience using AIz
---

## 🧠 Key Features

### 🤖 AI-Supported Functionalities
- **AI Compatibility Matching**: Uses user travel preferences and behavior to suggest ideal travel buddies or hosts.
- **Smart Chatbot Assistant**: AI-powered assistant (OpenAI API) that answers questions and suggests events, local hotspots, and travel tips in real time.

### 👥 User-Oriented Features
- 🧑‍💼 **Profile Management**: Create/edit detailed profiles with bios, languages, interests, and travel goals
- 🔎 **Search & Filtering**: Find hosts or travelers based on location, interests, or events
- 📍 **Local Events & Activities**: Discover nearby cultural events and gatherings
- 💬 **Group Discussions**: Participate in interest-based public threads
- 📩 **Private Messaging**: Communicate securely with fellow users
- 📝 **Travel Posts**: Share experiences, recommendations, and photos
- ⭐ **Ratings & Reviews**: Rate interactions and build a trust system
- 🚩 **Report System**: Users can report unsafe behavior or inappropriate content

### 🔐 Authentication & Security
- 🔐 **Email/Password Authentication** with Firebase Auth
- 🔐 **Google Sign-In** using OAuth 2.0
- 🔐 **Password Reset Support**
- 🔐 **Two-Step Verification Logic** (customizable for future SMS/OTP integration)
- 🔐 **Firestore Rules** for granular access control
- 🔐 **Admin Moderation** with elevated permissions

### 🛠️ Admin Features
- 🧑‍💻 Full user management (ban/promote/delete)
- 🗃️ View and moderate reported posts, messages, and users
- 📝 Remove inappropriate content
- 🧭 Impersonate a user account for testing or moderation

---

## 🧱 Tech Stack

| Layer            | Technology                                       |
|------------------|--------------------------------------------------|
| **Frontend**     | React.js, Bootstrap, CSS3                        |
| **Styling**      | Bootstrap 5, Custom CSS                          |
| **Authentication** | Firebase Authentication (Email/Password, Google OAuth) |
| **Database**     | Firebase Firestore (NoSQL)                       |
| **Storage**      | Firebase Storage (for images and user uploads)   |
| **Hosting**      | Firebase Hosting (CDN + HTTPS)                   |
| **AI Integration** | OpenAI API (ChatGPT-based Chatbot Assistant)   |
| **Architecture** | Model-View-Controller (MVC)                      |
| **Tools**        | Visual Studio Code, GitHub, Firebase CLI         |

---

## 🚀 Deployment & Hosting

TravelBond is deployed using **Firebase Hosting**:
- Automatic build and deploy using `firebase deploy`
- HTTPS secured hosting with CDN-backed performance
- CLI-based deployment pipeline for version control

To deploy:
```bash
firebase login
firebase init
firebase deploy
```

---

## 📂 Folder Structure
```
travelbond/
├── src/                    # Main source code
│   ├── assets/             # Images, fonts, and static resources
│   ├── controllers/        # Logic to handle user and system actions
│   ├── hooks/              # Custom React hooks
│   ├── models/             # Data structures and schema definitions
│   ├── services/           # Firebase services, APIs, auth, OpenAI
│   ├── utils/              # Utility/helper functions
│   ├── views/              # Page-level React components (e.g., Home, Profile)
│   ├── App.jsx             # Root component
│   ├── main.jsx            # Application entry point
│   ├── global.css          # Global styles
```

---

## ✅ Future Improvements
- ✈️ Add support for trip planning & itineraries
- 🧾 Advanced AI recommendation engine (based on past behavior)
- 🌐 Multi-language interface with localization support
- 📲 Mobile version using Flutter or React Native
- 🔑 SMS-based 2FA using Twilio/Firebase phone auth

---

## 👨‍💻 Developed By

**Qusai Mansoor Mohammed Abdullah**  
- 📧 Email: qusaii.abdullah@gmail.com
- LinkedIn Profile: https://www.linkedin.com/in/qusaiabdullah/

---

## 📌 License

This project was created for academic and educational purposes. Contributions, forks, and improvements are welcome.

