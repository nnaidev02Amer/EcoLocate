# ♻️ EcoLocate — E-Waste Facility Locator & Management Platform

A full-stack web application that connects citizens, authorised e-waste recycling facilities and platform administrators (CPCB-style oversight). Citizens find facilities on a map, estimate device recyclability, book doorstep pickups and earn reward points; facility managers process pickup requests; administrators verify facilities and monitor the platform.

> Built for Smart India Hackathon Problem Statement 1392.
> This README describes what is **actually implemented** in the code. Items that are not implemented are listed separately under [Not implemented / planned](#-not-implemented--planned).

---

## 📌 Table of contents

1. [Features](#-features)
2. [Technology stack](#-technology-stack)
3. [Project structure](#-project-structure)
4. [Prerequisites](#-prerequisites)
5. [Installation (Windows PowerShell)](#-installation-windows-powershell)
6. [Environment variables](#-environment-variables)
7. [Database & Prisma](#-database--prisma)
8. [Running the app](#-running-the-app)
9. [Demo login credentials (LOCAL DEMO ONLY)](#-demo-login-credentials-local-demo-only)
10. [Features by role](#-features-by-role)
11. [API reference](#-api-reference)
12. [Troubleshooting](#-troubleshooting)
13. [Security notes](#-security-notes)
14. [Not implemented / planned](#-not-implemented--planned)

---

## ✨ Features

- **Facility locator** — browse/search facilities (city, text, category, rating, verified-only, distance from coordinates) on a Leaflet / OpenStreetMap map, with facility detail pages and citizen reviews.
- **E-waste scanner (demo)** — upload a device image (JPEG/PNG/WebP, max 5 MB) and receive a recyclability / materials / safety result. **This is a demo classifier**: it picks a preset from keywords in the *file name* (for example `laptop`, `phone`, `printer`). No real vision model is called.
- **Doorstep pickup booking** — citizens request a pickup (address, category, quantity, weight, date, time slot). Each request gets a tracking code such as `EC-849201`.
- **Pickup lifecycle** — facility managers/admins move requests through `REQUESTED → ACCEPTED → CONFIRMED → ASSIGNED → SCHEDULED → PICKED_UP → PROCESSING → RECYCLED → COMPLETED`. Reaching `COMPLETED` credits reward points to the citizen.
- **Eco-reward points** — reward catalog, redemption, a points ledger and a leaderboard.
- **Facility partner portal** — managers see their facility's pickup requests and stats, and edit their facility profile and settings. New facility partners can self-register (account stays inactive until an admin activates it).
- **Admin panel** — platform statistics, facility directory with search/filter, verify/revoke facilities, add facilities, pickup monitoring, user registry, and a CPCB-style audit CSV export.
- **Security controls** — JWT authentication, role-based authorisation enforced on the server, bcrypt password hashing, 5-attempt / 15-minute account lockout, rate limiting, security headers and basic input sanitisation.
- **Extras** — "GreenLeaf" in-app FAQ chatbot (local keyword/FAQ matching, no external AI), impact calculator on the home page, a learning page and 3D visuals (three.js).

---

## 🧰 Technology stack

Versions below are the ones currently installed in this repository.

| Layer | Technology |
|---|---|
| Runtime | Node.js — tested on **v24.19.0**, npm 11.17.0 (Vite 8 requires Node `^20.19.0 \|\| >=22.12.0`) |
| Frontend | React **19.3.1**, React Router **7.18.5**, Vite **8.3.8**, TypeScript **6.0.3**, Tailwind CSS **4.3.5** |
| Frontend libraries | Leaflet 1.9.4 + react-leaflet 5.0.0 (map), three 0.185.1 (3D), recharts 3.10.1 (charts), lucide-react 1.72.0 (icons) |
| Frontend tooling | `@vitejs/plugin-react` 6.3.0, `@tailwindcss/vite` 4.3.5, oxlint 1.93.0 |
| Backend | Express **4.22.3**, TypeScript **6.0.3**, tsx 4.23.15 (dev runner) |
| Backend libraries | Prisma / `@prisma/client` **5.22.0**, bcryptjs 3.0.3, jsonwebtoken 9.0.3, multer 2.5.0, express-rate-limit 8.7.4, cors 2.8.6, dotenv 18.0.10 |
| Database | **SQLite** (file `prisma/dev.db`) through Prisma. The schema's datasource provider is `sqlite`. |
| Root tooling | concurrently 10.0.7 (runs client and server together) |

---

## 🗂️ Project structure

```
EcoLocate/
├── package.json            # Root scripts (dev / build / seed / db:push)
├── Dockerfile              # Container build (see Troubleshooting – known issues)
├── vercel.json             # Vercel routing config (not verified in this README)
├── prisma/
│   ├── schema.prisma       # Data model (SQLite)
│   ├── seed.ts             # Older seed script (not used by the npm scripts)
│   └── dev.db              # SQLite database used by the server
├── client/                 # React + Vite frontend
│   ├── vite.config.ts      # Dev server on 5173, proxies /api -> http://localhost:5000
│   └── src/
│       ├── App.tsx         # Routes
│       ├── pages/          # Home, Facilities, FacilityDetails, AIScanner, PickupSchedule,
│       │                   # Dashboard, Rewards, Learn, Login, Register,
│       │                   # AdminLogin, AdminDashboard,
│       │                   # FacilityLogin, FacilityRegister, FacilityDashboard,
│       │                   # FacilityRequests, FacilityProfile, FacilitySettings, ...
│       ├── components/     # Navbar, Footer, FacilityMap, ProtectedRoute, GreenLeafChatbot, ...
│       ├── context/        # AuthContext
│       └── services/api.ts # API client (base path /api)
└── server/                 # Express + Prisma backend
    ├── package.json
    ├── uploads/            # Uploaded scan images (created at runtime)
    └── src/
        ├── index.ts        # App entry, middleware, route mounting
        ├── config/env.ts   # Environment loading
        ├── routes/         # auth, facility, pickup, ai, reward, admin
        ├── controllers/    # Request handlers
        ├── middleware/     # auth (JWT + roles), security (rate limit, headers, sanitising)
        ├── services/       # aiService (demo classifier)
        ├── utils/prisma.ts # Prisma client
        └── seed.ts         # Seed script used by `npm run seed`
```

---

## ✅ Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (tested on 24.19.0) and **npm**
- Git (to clone)
- No separate database server is needed (SQLite file).

Check your versions in PowerShell:

```powershell
node -v
npm -v
```

---

## 🛠️ Installation (Windows PowerShell)

The project has three `package.json` files (root, `client`, `server`) and each needs its own install.

```powershell
git clone https://github.com/lakshyabhardwaj74-code/EcoLocate.git
cd EcoLocate

npm install
npm --prefix client install
npm --prefix server install
```

> If PowerShell blocks `npm` scripts, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `cmd`.

---

## 🔐 Environment variables

The server reads a file named `.env` in the directory it is started from, which is **`server/`** when you use the npm scripts. Create `server/.env` (do **not** commit it):

```dotenv
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-string"
NODE_ENV="development"
AI_DEMO_MODE=true
# Optional
# FRONTEND_URL="http://localhost:5173"
# ADMIN_EMAIL="your-admin@example.com"       # used only by the seed script
# ADMIN_PASSWORD="choose-a-strong-password"  # used only by the seed script
# VISION_AI_API_KEY=""                       # read by the server but no real AI call is implemented
```

Notes:

- `DATABASE_URL="file:./dev.db"` is resolved **relative to the Prisma schema** (`prisma/schema.prisma`), so the database file is `prisma/dev.db`.
- The repository also contains a root-level `.env` holding only `DATABASE_URL` (same value). The npm scripts read `server/.env`.
- `JWT_SECRET` is **mandatory in every environment**: there is no built-in fallback, and the server refuses to start if it is missing, empty or still the `.env.example` placeholder. Use a long random value and keep it private.
- A `.env.example` file in the repository lists similar variables. The client does **not** read any `VITE_*` variables: it calls the relative path `/api`, which the Vite dev server proxies to `http://localhost:5000`.

Generate a random secret in PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## 🗄️ Database & Prisma

- Models (`prisma/schema.prisma`): `User`, `Facility`, `PickupRequest`, `AIScan`, `RewardTransaction`, `Review`, `RewardCatalog`.
- User roles are stored as strings: `USER`, `FACILITY_MEMBER`, `ADMIN`.
- Facility verification status values: `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` (the admin panel currently uses *verify* and *revoke*, which set `VERIFIED` / `PENDING`).

The Prisma schema lives in the repository root `prisma/` folder, not in `server/`, so Prisma CLI commands run from `server/` need an explicit `--schema` flag:

```powershell
cd server
npx prisma validate --schema=../prisma/schema.prisma   # check the schema
npx prisma generate --schema=../prisma/schema.prisma   # regenerate the client
npx prisma db push  --schema=../prisma/schema.prisma   # create/update tables
```

> The `db:push`, `prisma:push` and `prisma:generate` npm scripts now pass `--schema=../prisma/schema.prisma` themselves, so `npm run db:push` and `npm --prefix server run prisma:generate` work from the repository root. The explicit commands above are equivalent.

### Seeding — read before running

```powershell
npm run seed
```

`npm run seed` (which runs `server/src/seed.ts`) **deletes all existing users, facilities, pickups, scans, reward transactions, reviews and the reward catalog before recreating the demo data.** Run it only on an empty/disposable database. If `prisma/dev.db` already contains the demo data (as in this repository), you do not need to seed.

The seed script is for **local development only**. It creates the demo accounts listed below with public default passwords, so it **refuses to run when `NODE_ENV=production`**. For a disposable demo deployment you can opt in explicitly, and you must then supply your own passwords (the public defaults are not used):

```powershell
$env:NODE_ENV="production"; $env:ALLOW_DEMO_SEED="true"
$env:ADMIN_PASSWORD="<strong password>"; $env:DEMO_USER_PASSWORD="<strong password>"
npm run seed
```

Optional variables for local runs: `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` override the admin address, the admin password and the shared password of the other demo users (defaults are listed in the demo credentials table).

### Docker

The image contains no database and **no demo accounts**; nothing is seeded during the build or at startup. The SQLite database is created empty at container start on the `/data` volume, and `JWT_SECRET` must be supplied at run time:

```bash
docker build -t ecolocate .
docker run -p 5000:5000 -v ecolocate-data:/data -e JWT_SECRET="<long random value>" ecolocate
```

Citizens can register through the app. There is currently no production command for creating the first admin or facility-manager account; do this with a reviewed one-off script against your own database, not with the demo seed.

---

## ▶️ Running the app

Development (starts server and client together; run from the repository root):

```powershell
npm run dev
```

- API: <http://localhost:5000> (health check: <http://localhost:5000/api/health>)
- Web app: <http://localhost:5173> (Vite uses the next free port if 5173 is taken — read the URL printed in the terminal)

Run them separately if you prefer:

```powershell
npm run dev:server    # tsx watch server/src/index.ts
npm run dev:client    # vite
```

Production-style build:

```powershell
npm run build          # builds server (tsc -> server/dist) then client (tsc -b && vite build -> client/dist)
npm --prefix server run start   # node dist/index.js
```

When `client/dist` exists, the server also serves the built client and falls back to `index.html` for non-API routes. Run the server from the `server/` directory (as the npm script does) so `.env`, `uploads/` and the `../client/dist` path resolve correctly.

Lint the client:

```powershell
npm --prefix client run lint
```

There is **no automated test suite** in this repository.

---

## 🔑 Demo login credentials (LOCAL DEMO ONLY)

> ⚠️ **LOCAL DEMO ONLY.** These accounts exist in the seeded local database. Never use these credentials or this database in production or on a public deployment.

| Role | Name | Email | Password | Login page |
|---|---|---|---|---|
| Citizen | Aarav Verma | `user@example.com` | `password123` | `/login` |
| Citizen | Neha Kapoor | `neha@example.com` | `password123` | `/login` |
| Facility Manager | Priya Sundaram | `manager.blr@ecocycle.in` | `password123` | `/facility/login` |
| Facility Manager | Vikram Mehta | `manager.delhi@ecocycle.in` | `password123` | `/facility/login` |
| Admin | Dr. Rajesh Sharma | `admin@ecocycle.gov.in` | `password123` | `/admin/login` |
| Admin | EcoCycle Operations Admin | `admin@ecolocate.local` | `EcoLocate@Admin2026!` | `/admin/login` |

Notes:

- Log in with the **email address** (there is no separate Member ID).
- The facility login page accepts only facility-manager accounts, and the admin login page accepts only admins.
- The `admin@ecolocate.local` password above is the seed default; the seed script uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` instead if they are set when it runs.
- After 5 failed attempts an account is locked for 15 minutes.

---

## 👥 Features by role

### 👤 Citizen (`USER`)
- Browse and search facilities, map view, facility details and reviews.
- Run the demo e-waste scanner and view scan history.
- Book doorstep pickups and track them by tracking code.
- Dashboard with pickups, rewards and certificate view.
- Reward catalog, redeem points, view ledger and leaderboard.
- Change own password (API: `PUT /api/auth/change-password`).

### 🏭 Facility Manager (`FACILITY_MEMBER`)
- Facility dashboard with stats for the facility they manage.
- View incoming pickup requests for their facility and update request status.
- Edit facility profile and settings (name, contact, hours, categories, capacity, services).
- Facility partner self-registration (`/facility/register`); the account is inactive until an admin activates it.
- Managers cannot change verification status, active flag, owner or rating of a facility.

### 🛡️ Admin (`ADMIN`)
- **Overview:** account, facility, pickup, recycled-weight and points statistics computed from the database.
- **All Facilities:** searchable directory, All / Verified / Pending filter, inspect modal, verify or revoke a facility, add a facility.
- **Verification Queue:** facilities that are not verified.
- **Pickup Requests:** read-only table of all pickups.
- **User Registry:** read-only list of all accounts.
- **Audit & Reports:** summary cards and **CPCB-style CSV export** of pickups.
- Backend endpoints for user activation/deactivation and password reset exist but have **no UI yet**.

---

## 📡 API reference

Base URL: `http://localhost:5000/api`. Protected endpoints need the header `Authorization: Bearer <token>` (token returned by the login endpoints). Responses are JSON of the form `{ "success": true|false, "message"?: string, "data"?: ... }`. Rate limiting applies to `/api` (1000 requests / 15 min per IP, localhost exempt), with stricter limits on auth, redemption and AI endpoints.

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Service status and version |

### Auth — `/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Register a citizen (`name`, `email`, `password`, optional `phone`) |
| POST | `/auth/login` | none | Login (any role); returns `token` and `user` |
| POST | `/auth/admin-login` | none | Login restricted to `ADMIN` accounts |
| POST | `/auth/facility-login` | none | Login restricted to `FACILITY_MEMBER` accounts |
| POST | `/auth/facility-register` | none | Register a facility partner + facility (account starts inactive) |
| GET | `/auth/me` | any user | Current user profile |
| PUT | `/auth/change-password` | any user | Body: `currentPassword`, `newPassword` |

### Facilities — `/facilities`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/facilities` | none | List active facilities. Query: `city`, `search`, `lat`, `lng`, `category`, `minRating`, `verifiedOnly` |
| GET | `/facilities/:id` | none | Facility details |
| GET | `/facilities/managed/stats` | `FACILITY_MEMBER` | Stats for the manager's own facility |
| POST | `/facilities` | `ADMIN`, `FACILITY_MEMBER` | Create a facility (admin: verified; manager: pending) |
| PUT | `/facilities/:id` | `ADMIN`, or the facility's manager | Update allowed fields; only admins can change verification/active/owner/rating |
| POST | `/facilities/:id/reviews` | any user | Add a review |

### Pickups — `/pickups`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/pickups` | any user | Create a pickup request (`address`, `city`, `pincode`, `category`, `preferredDate`, `preferredTimeSlot`, optional `quantity`, `weightKg`, `facilityId`, …) |
| GET | `/pickups` | any user | Admin: all; facility manager: their facility's; citizen: their own |
| GET | `/pickups/:id` | any user | Look up by id or tracking code. Allowed only for the requester, an admin, or the manager of the pickup's facility; everyone else gets `404`, unauthenticated requests get `401` |
| PUT | `/pickups/:id/status` | `ADMIN`, `FACILITY_MEMBER` | Update status (managers only for their own facility); `COMPLETED` credits points |

### AI scanner — `/ai`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/analyze` | optional | Multipart upload, field name `image` (JPEG/PNG/WebP, ≤ 5 MB). Returns a **demo** analysis |
| GET | `/ai/history` | any user | The user's previous scans |

### Rewards — `/rewards`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/rewards/catalog` | none | Reward catalog |
| GET | `/rewards/user` | any user | Points balance and transactions |
| POST | `/rewards/redeem` | any user | Redeem a catalog item with points |
| GET | `/rewards/leaderboard` | none | Points leaderboard |

### Admin — `/admin` (all require `ADMIN`)
| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/users` | All users (no password data) |
| GET | `/admin/facility-members` | Facility manager accounts and their facilities |
| PUT | `/admin/facilities/:id/verify` | Body `{ isVerified }` or `{ status }` (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`) |
| PUT | `/admin/users/:id/status` | Body `{ isActive: boolean }`; an admin cannot deactivate themselves |
| PUT | `/admin/users/:id/reset-password` | Body `{ newPassword }` (min 8 characters) |
| GET | `/admin/export-csv` | Pickup audit report as CSV |

Unknown `/api/*` paths return `404 { "success": false, "message": "API Endpoint not found." }`.

---

## 🩺 Troubleshooting

| Problem | Fix |
|---|---|
| **"Invalid email or password."** | Check you are on the right login page for the role (see the credentials table) and that you typed the email exactly (for example `admin@ecocycle.gov.in`, not `ecolocate.gov.in`). Citizen/admin emails do not work on the facility login. |
| **Account locked (HTTP 423)** | Wait 15 minutes. Five wrong passwords lock the account. |
| **Port 5173 already in use** | Vite automatically picks the next free port; use the URL it prints. The dev proxy to the API still works. |
| **Port 5000 already in use** | Stop the other process or set `PORT` in `server/.env` (then update the proxy `target` in `client/vite.config.ts`). |
| **`prisma ... schema not found`** | The schema is in `prisma/`, not `server/`. The npm scripts already pass `--schema`; for manual `npx prisma ...` commands from `server/` add `--schema=../prisma/schema.prisma`. |
| **Empty database / no users** | Run `npm run seed` **only if** it is safe to delete existing data (see warning above). |
| **`npm` blocked in PowerShell** | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| **npm warns about blocked install scripts (`allow-scripts`)** | Expected with newer npm; the app runs without approving them in the tested setup. |
| **Docker build** | The Dockerfile no longer calls the missing `install:all` script and now starts from `server/`, but **it has not been built or tested** (Docker is not installed on the development machine). The image no longer seeds demo data; the database is created empty on the `/data` volume at start, and the server requires `JWT_SECRET`, so pass it as an environment variable at run time (see "Docker" above). |

---

## 🛡️ Security notes

- Role checks are enforced on the **server** (`requireRoles`); hiding a menu item in the UI is not relied upon. Every authenticated request also re-checks that the account still exists and is active.
- Passwords are hashed with bcrypt; login has a 5-attempt / 15-minute lockout; auth endpoints are rate limited.
- Set a strong, private `JWT_SECRET`. Never commit `.env` files or database files.
- **Before publishing the repository publicly:**
  - `.env` files, `*.db` files, `node_modules/` and `server/dist/` are excluded by `.gitignore` and are not tracked.
  - The Git history was rewritten to remove committed `.env` files, SQLite databases, `node_modules/`, `server/dist/` and the old `JWT_SECRET`, including its hardcoded fallback in `server/src/config/env.ts`. Those secrets no longer appear in the published history, but any copy cloned or forked before the rewrite still has them. Treat that old secret as compromised and never reuse it.
  - The admin login page no longer shows demo credentials. The demo credentials still appear in this README and in the seed script; they are for local development only.
  - The seed script refuses to run when `NODE_ENV=production` (see "Seeding" and "Docker" above), and the Docker image never seeds demo accounts.
- Pickup details (`GET /api/pickups/:id`) require login and are limited to the requester, admins and the facility's manager.
- Uploaded scan images are stored on local disk under `server/uploads/`.
- Dependencies were audited with `npm audit` (0 known vulnerabilities at the time of the last upgrade); re-run it regularly.

---

## 🚧 Not implemented / planned

These are **not** part of the current code:

- A real AI vision model (the scanner is a filename-based demo; `VISION_AI_API_KEY` is read but unused).
- PostgreSQL support is untested (the schema datasource is SQLite).
- Admin actions for **reject / suspend / re-activate** facilities in the UI (only verify/revoke).
- Admin UI for user deactivation and password reset (API exists).
- Admin audit log of user activity, notifications/alerts, and admin profile/settings pages.
- Pagination and sorting in the admin tables.
- Automated tests and CI.
- A reviewed production deployment configuration (the `Dockerfile` and `vercel.json` are unverified).

---

## 📄 License

No license file is included in this repository. Add one before distributing the code.
