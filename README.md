# Tracksy — Job Application Tracker

A full-stack web app to track your job applications, monitor statuses, and visualize your job search progress.

![Dashboard Preview](https://placehold.co/1200x600/0a0a0f/6c63ff?text=Tracksy+Dashboard)

---

## Features

- **Authentication** — Register, login with JWT-based session management
- **Job CRUD** — Add, edit, delete, and view applications
- **Status Tracking** — Applied → OA → Interview → Offer / Rejected
- **Search & Filter** — Search by company, filter by status, sort by date
- **Dashboard** — Stats overview, monthly bar chart, status donut chart
- **Pagination** — 8 jobs per page with prev/next controls
- **Skeleton Loaders** — Shimmer placeholders while data loads
- **Responsive** — Works on mobile with a slide-in sidebar

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose (Atlas)
- JWT Authentication
- bcryptjs for password hashing
- express-validator for input validation
- helmet, hpp, compression for production hardening

**Frontend**
- React 19 + Vite
- React Router v7
- Axios with request/response interceptors
- Recharts for dashboard charts
- react-hot-toast for notifications
- Lucide React for icons

---

## Project Structure

```
Tracksy/
├── server/                   # Express API
│   ├── config/db.js          # MongoDB connection
│   ├── controllers/          # Route logic
│   ├── middleware/            # Auth, validation, error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   └── utils/                # AppError, catchAsync helpers
│
└── client/                   # React app
    └── src/
        ├── api/              # Axios instance + API methods
        ├── components/       # Reusable UI + layout components
        ├── context/          # AuthContext (global auth state)
        ├── pages/            # Route-level page components
        └── utils/            # Status helpers, formatters
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/tracksy.git
cd tracksy
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 3. Set up the client

```bash
cd ../client
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Run the app

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

All job routes require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login + receive JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/jobs` | List jobs (with filters) |
| POST | `/api/jobs` | Create job application |
| GET | `/api/jobs/stats` | Dashboard statistics |
| GET | `/api/jobs/:id` | Get single job |
| PATCH | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |
| GET | `/api/health` | Health check |

### Query Parameters for `GET /api/jobs`

| Param | Type | Example |
|-------|------|---------|
| `search` | string | `?search=google` |
| `status` | string | `?status=Interview` |
| `sort` | string | `?sort=-appliedDate` |
| `page` | number | `?page=2` |
| `limit` | number | `?limit=10` |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Server port (default: 5001) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing tokens (min 32 chars) |
| `JWT_EXPIRE` | No | Token expiry (default: `7d`) |
| `CLIENT_URL` | Yes | Frontend origin for CORS |

---

## Job Status Flow

```
Applied → OA (Online Assessment) → Interview → Offer
                                             ↘ Rejected
```

---

## Known Limitations

- No email notifications on status change
- No file/resume upload
- Delete confirmation uses `window.confirm` (browser native)
- No unit or integration tests yet

---

## Roadmap

- [ ] Email alerts when application status changes
- [ ] Resume/file attachment per application
- [ ] Interview calendar view
- [ ] Export to CSV
- [ ] Dark/light theme toggle

---

## License

MIT
