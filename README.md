# Collaborative Learning Platform (KAAT)

A full-stack collaborative learning platform with a React frontend and a Django REST backend.

> **Screenshots**
> - [Screenshot placeholder: Login]
> - [Screenshot placeholder: Student dashboard]
> - [Screenshot placeholder: Class page]
> - [Screenshot placeholder: Assignment page]

---

## Tech Stack

**Frontend**
- React (Create React App)
- React Router
- Google OAuth via `@react-oauth/google`
- Axios :contentReference[oaicite:1]{index=1}

**Backend**
- Django 5.1.7
- Django REST Framework
- django-cors-headers
- SQLite (local dev database)
- python-dotenv :contentReference[oaicite:2]{index=2}

---

## Repository Structure

- `frontend/` — React app (UI + Google sign-in)
- `backend/` — Django project + REST API
- `design_documents/` — design notes/docs :contentReference[oaicite:3]{index=3}

---

## How to Run & Collaborate (Local Dev)

### Prerequisites
- Node.js + npm
- Python 3.12+ recommended
- (Optional but recommended) `venv` / virtual environment tooling

---

### 1) Backend setup (Django)

From the repository root:

```bash
cd backend

# Create + activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Create local SQLite DB + tables
python manage.py migrate

# Run the backend server (default: http://127.0.0.1:8000)
python manage.py runserver
```

### 2) Frontend setup (React)

Open a second terminal from the repository root:

```bash
cd frontend

# Install frontend dependencies
npm install

# Run the frontend dev server (default: http://localhost:3000)
npm start
```

Frontend dependencies + scripts are defined in `frontend/package.json.`

### 3) Environemtn Variables

#### Backend (`backend/.env`)

he backend loads environment variables via `python-dotenv` in `settings.py`.

Create a file at `backend/.env`:

```bash
DJANGO_SECRET_KEY=replace_me
DJANGO_DEBUG=True
```

Notes:

`DJANGO_SECRET_KEY `is required for secure signing in Django; for local dev, any random string is fine.

Do not commit `.env` files.

#### Frontend (Google OAuth)

The frontend uses `@react-oauth/google` for Google sign-in.

You will need a Google OAuth Client ID configured for local development (typically with an authorized origin like `http://localhost:3000`).

#### API Overview (Backend)

The backend exposes REST endpoints under `/api/` using DRF routers.

Registered resources include:

- `/api/users/`

- `/api/classes/`

- `/api/groups/`

- `/api/assignments/`

- `/api/submit/`

- `/api/addfile/`

- `/api/addcomment/`

## Contributing

Create a branch:
1. 
```bash
git checkout -b feature/your-change
```

2. Make changes (frontend, backend, or both)

3. Run locally (instructions above)

4. Commit + push your branch, then open a PR