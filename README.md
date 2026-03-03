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

## Performance & Load Testing

### Backend Capacity (Local Load Test)

Load tested using **k6** (ramping 1 → 100 virtual users over ~2 minutes).

**Endpoints tested:**
- `GET /api/classes/2/`
- `GET /api/assignments/?course=2`

**Environment:**
- Local development server (`DEBUG=False`)
- Django `runserver`
- SQLite database
- macOS localhost

#### Results

| Concurrency | Throughput | p95 Latency | Error Rate |
|------------|------------|------------|------------|
| 30 VUs     | ~138 req/s | ~96 ms     | 0%         |
| 100 VUs    | ~185 req/s | ~414 ms    | 0%         |

**Observations:**
- System remained stable under 100 concurrent users.
- Throughput increased under load while latency scaled predictably.
- No request failures observed.
- Latency increase at 100 VUs indicates saturation of the local dev stack (expected).

---

### Backend Responsiveness (Single-User Benchmark)

Sequential latency measured using `curl` over 50 requests (local, `DEBUG=False`).

#### `GET /api/users/?email=...`

| Metric | Value |
|--------|--------|
| p50    | ~4.2 ms |
| p95    | ~5.0 ms |
| max    | ~10.4 ms |

#### `GET /api/classes/2/`

| Metric | Value |
|--------|--------|
| p50    | ~5.6 ms |
| p95    | ~6.9 ms |
| max    | ~7.6 ms |

**Observations:**
- Sub-10ms p95 latency under single-request conditions.
- Low variance indicates efficient ORM queries and lightweight serialization.

---

### Frontend Performance (Lighthouse Audit)

Audited using Chrome Lighthouse on an authenticated dashboard route (`/home`).

**Environment:**
- Localhost
- Chrome (Incognito)
- Production-like build

#### Key Metrics

| Metric | Value |
|--------|--------|
| Performance Score | 83 |
| First Contentful Paint (FCP) | 0.6 s |
| Largest Contentful Paint (LCP) | 3.9 s |
| Total Blocking Time (TBT) | 270 ms |
| Cumulative Layout Shift (CLS) | 0.00 |
| Speed Index | 0.7 s |

**Observations:**
- Initial content renders quickly (FCP < 1s).
- No layout instability (CLS = 0).
- Main thread blocking remains under 300ms.
- LCP reflects dynamic authenticated dashboard rendering.

---

> All performance measurements were conducted locally. Results may vary depending on hardware, server configuration, and production infrastructure.