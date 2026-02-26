# MediVault — Healthcare Project

A full-stack healthcare platform with secure medical record management.

## Tech Stack
- **Frontend**: Next.js 16, React, TypeScript
- **Backend**: Django 6, Django REST Framework, JWT Auth

## Features
- Patient & Doctor registration/login
- Medical document upload & management
- Consent-based access control
- Emergency break-glass access
- Real-time notifications
- Email notifications for key events
- Django auth Groups (Patient, Doctor, Admin)
- Audit logging

## Running Locally

### Backend
```bash
cd backend
venv\Scripts\activate
python manage.py runserver 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
