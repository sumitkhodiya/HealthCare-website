# 🏥 MediVault — Healthcare Platform

A full-stack secure medical records platform for patients, doctors, and admins.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)
![Django](https://img.shields.io/badge/Backend-Django%206-green?style=flat-square&logo=django)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Features

### 👤 Authentication
- Email + password registration and login for Patients & Doctors
- JWT-based authentication (access + refresh tokens)
- Role-based access: Patient, Doctor, Admin
- Django auth Groups auto-assigned on registration

### 📁 Medical Documents
- Upload, view, and manage medical documents
- Categorized file storage with metadata

### 🔐 Access Control
- Doctors request access to patient records
- Patients approve / reject / revoke access with expiry time
- Emergency break-glass access (1-hour limited, auto-logged)

### 📧 Email Notifications
Real emails sent (via Gmail SMTP) on:
- Access request from a doctor → patient notified
- Access approved / rejected / revoked → doctor notified
- Emergency access → patient + all admins notified

### 🔔 In-App Notifications
- Real-time unread count
- Full notification history per user

### 📋 Audit Log
- Every access event logged with timestamp, actor, and action

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript |
| Backend | Django 6, Django REST Framework |
| Auth | JWT (SimpleJWT), Django Groups |
| Database | PostgreSQL (SQLite for dev) |
| Email | Gmail SMTP via Django |
| SMS OTP | Fast2SMS (optional) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for dev)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # fill in your credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

### Access the App
| URL | Description |
|---|---|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:8000/api/ | Backend API root |
| http://localhost:8000/admin/ | Django Admin Panel |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/medivault

# Email (Gmail SMTP)
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# SMS (Fast2SMS — optional)
FAST2SMS_API_KEY=your-api-key
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 📁 Project Structure

```
HealthCare-website/
├── backend/
│   ├── users/              # Auth, registration, OTP
│   ├── documents/          # Medical file upload
│   ├── access_control/     # Access requests & emergency access
│   ├── notifications/      # In-app notifications
│   ├── audit/              # Audit logging
│   └── medivault/          # Project config & URLs
├── frontend/
│   └── src/
│       ├── app/            # Next.js pages (patient, doctor, admin)
│       ├── components/     # Shared UI components
│       ├── contexts/       # Auth context
│       └── lib/            # API client
└── README.md
```

---

## 🛡️ Security Notes
- Never commit `.env` files
- Use strong `SECRET_KEY` in production
- Set `DEBUG=False` in production
- OTP is only shown in UI when `DEBUG=True`

---

## 📄 License
MIT © 2026 Sumit Khodiya
