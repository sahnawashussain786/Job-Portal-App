# JobNest — MERN Job Portal

A full-stack job board built on the MERN stack (MongoDB, Express, React, Node) with
Tailwind CSS, designed to deploy to **Vercel as a single project**: the React SPA is
served statically and the Express API runs as a serverless function under `/api`.

---

## Features

**Candidates (job seekers)**
- Search jobs with filters for keyword, location, category, employment type, work mode, experience level and minimum salary
- Full-text style matching across title, description and skills, with sorting (recent, salary, most applied, title)
- Job detail pages with responsibilities, requirements, benefits, skills and company info
- One-click apply with an optional cover letter and expected salary
- Resume upload (PDF/DOC/DOCX) attached automatically to every application
- Save/bookmark jobs, application status tracking (`pending → reviewed → shortlisted → interview → offered → hired / rejected`) with a per-application history timeline
- Personal dashboard with a profile-completion checklist

**Employers**
- Auto-created company profile with logo upload, industry, size, website and social details
- Create, edit, close, reopen and delete job postings (draft / open / closed / archived)
- Rich posting form: responsibilities, requirements, benefits, skills, salary range with currency and period, deadline, openings
- Applicant review with status updates, private notes and one-click shortlist / interview / reject
- Hiring dashboard: open roles, applications, pending review, views, recent applicants

**Admins**
- Platform-wide stats (users, jobs, companies, applications, apps-per-open-role)
- Open jobs by category and 6-month signup trend
- User management: change roles, activate/deactivate, delete (with cascade)
- Job moderation: feature/unfeature, change status, delete

**Platform**
- JWT authentication with role-based authorisation (`jobseeker` / `employer` / `admin`)
- Helmet, CORS allow-list, rate limiting on auth and upload endpoints, centralised error handling
- Serverless-safe MongoDB connection pooling with a cached connection
- Cloudinary-backed uploads (required on Vercel, whose filesystem is read-only)

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS v4, Axios, lucide-react, react-hot-toast |
| Backend | Node 20+, Express 4, Mongoose 8, JWT, bcryptjs, Multer, Cloudinary |
| Database | MongoDB (Atlas for production) |
| Hosting | Vercel — static SPA + serverless API in one project |

---

## Project structure

```
.
├── api/
│   └── index.js            # Vercel serverless entry — wraps the Express app
├── backend/
│   ├── package.json
│   └── src/
│       ├── app.js          # Express app (helmet, cors, routes, error handling)
│       ├── server.js       # Local dev server (not used on Vercel)
│       ├── config/         # env validation, Mongo connection, Cloudinary
│       ├── models/         # User, Company, Job, Application
│       ├── middleware/     # auth/roles, error handler, uploads, rate limits
│       ├── controllers/    # auth, jobs, applications, companies, uploads, admin
│       ├── routes/         # /api router
│       └── utils/          # ApiError, asyncHandler, pagination, seed script
├── frontend/
│   ├── package.json
│   ├── vite.config.js      # Tailwind v4 plugin, `@` alias, dev API proxy
│   └── src/
│       ├── App.jsx         # Router with lazy-loaded routes and guards
│       ├── lib/            # axios client, formatters
│       ├── context/        # auth provider + hook
│       ├── hooks/          # useFetch, useDebounce, useDocumentTitle
│       ├── components/     # layout, JobCard, filters, pagination, ui primitives
│       └── pages/          # public, jobseeker/, employer/, admin/
├── vercel.json             # Build + rewrite configuration
└── .env.example
```

---

## Local development

### 1. Prerequisites
- Node.js 20 or newer
- A MongoDB database — a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster is easiest
- (Optional) A [Cloudinary](https://cloudinary.com) account for resume/logo uploads

### 2. Install

```bash
npm run install:all
```

### 3. Configure

Copy `.env.example` to `.env` in the repo root and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | Atlas connection string. Add `?retryWrites=true&w=majority`. |
| `JWT_SECRET` | ✅ | Long random string. Rotating it signs everyone out. |
| `JWT_EXPIRES_IN` | — | Defaults to `7d`. |
| `PORT` | — | Defaults to `5000`. |
| `CLIENT_URL` | — | Comma-separated allowed origins, e.g. `http://localhost:5173`. |
| `CLOUDINARY_CLOUD_NAME` | — | Needed for uploads. |
| `CLOUDINARY_API_KEY` | — | Needed for uploads. |
| `CLOUDINARY_API_SECRET` | — | Needed for uploads. |
| `ADMIN_EMAIL` | — | The seed script grants admin to this address. |

> If Cloudinary is unset the app still runs — upload widgets disable themselves and
> `POST /api/uploads/*` returns a 503 explaining what's missing.

**Frontend variables** (`frontend/.env`, optional — the defaults are correct):

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_URL` | *(empty)* | Intentionally empty. Empty means the browser calls the relative path `/api`, which Vite proxies to Express in dev and which resolves to the serverless functions on Vercel. Set it only if the API lives on a **different** origin. |
| `DEV_API_URL` | `http://localhost:5000` | Dev proxy target. Change if Express runs on another port. Loaded via `loadEnv`, so it is config-only and never inlined into the browser bundle. |

Because the app always calls `/api`, there is no API URL to update between
development and production — one path works in both places.

### 4. Seed demo data (recommended)

```bash
npm run seed          # insert demo users, companies, jobs and applications
npm run seed -- --destroy   # wipe all collections
```

### 5. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api

Vite proxies `/api` to the Express server in development, so the app uses the same
relative API paths in dev and production — no CORS configuration needed.

### Windows one-click launcher

On Windows you can skip the commands above and just **double-click `start.bat`**.
It checks Node, creates `.env` from `.env.example` on first run, installs any
missing dependencies, refuses to continue while `MONGODB_URI` is still the
placeholder, then starts both servers and opens the browser.

```bat
start.bat            :: run the API + web app together
start.bat --check    :: validate the setup, change nothing
start.bat --seed     :: load the demo data
start.bat --build    :: production build of the frontend
```

Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in that window to stop everything.

### Demo accounts

All seeded accounts use the password `Password123!`.

| Role | Email |
| --- | --- |
| Admin | value of `ADMIN_EMAIL` (default `admin@jobportal.dev`) |
| Employer | `employer1@example.com` (Nimbus Technologies) |
| Employer | `employer2@example.com` (Vertex Analytics) |
| Job seeker | `ade@example.com` |
| Job seeker | `priya@example.com` |

The login page has buttons that fill these in for you. **Remove that block before
shipping to real users.**

---

## Deploying to Vercel

The repo is already configured — `vercel.json` builds the frontend and routes
`/api/*` to the serverless function.

### 1. Push to a Git repository
Import the project into Vercel. The framework preset will be detected as **Other**;
leave the build/output settings alone since they come from `vercel.json`.

### 2. Set environment variables
In **Project → Settings → Environment Variables**, add (for Production, Preview and
Development):

```
MONGODB_URI       mongodb+srv://...
JWT_SECRET        <long random string>
JWT_EXPIRES_IN    7d
ADMIN_EMAIL       you@yourdomain.com
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Do **not** set `VITE_API_URL` — the SPA and API share an origin in production, and
the app relies on that by calling the relative path `/api`. (`frontend/.env`
commits to this: the value is intentionally empty.)
Do **not** set `PORT` — Vercel manages the port.

> The API validates `MONGODB_URI` and `JWT_SECRET` at boot in production and fails
> loudly if either is missing, rather than returning confusing 500s.

### 3. Allow Vercel to reach Atlas
In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0` (Vercel functions use
dynamic egress IPs unless you're on a plan with static IPs).

### 4. Deploy
Then seed the production database once from your machine, pointing at the same
`MONGODB_URI`:

```bash
npm run seed
```

### 5. Verify
Visit `https://<your-app>.vercel.app/api/health` — you should get
`{"success":true,"status":"ok",...}`. If you get a `503`, Atlas network access or
`MONGODB_URI` is the problem.

---

## API reference

Base path: `/api`. Authenticated routes expect `Authorization: Bearer <token>`.

### Auth
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create an account (`jobseeker` or `employer`) |
| POST | `/auth/login` | Public | Sign in, returns a JWT |
| GET | `/auth/me` | Private | Current user (with company populated) |
| PATCH | `/auth/me` | Private | Update name, phone, location, headline, bio, skills |
| PATCH | `/auth/password` | Private | Change password |
| DELETE | `/auth/me` | Private | Delete the account |

### Jobs
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/jobs` | Public | List/search. Query: `q, location, category, employmentType, workMode, experienceLevel, minSalary, sort, page, limit` |
| GET | `/jobs/featured` | Public | Featured/popular jobs |
| GET | `/jobs/meta/filters` | Public | Categories, types, work modes, levels, locations, companies |
| GET | `/jobs/saved` | Private | The current user's saved jobs |
| GET | `/jobs/employer/mine` | Employer | The employer's own postings |
| GET | `/jobs/employer/stats` | Employer | Dashboard metrics |
| GET | `/jobs/:idOrSlug` | Public | Job detail (drafts hidden from non-owners) |
| POST | `/jobs` | Employer | Create a posting |
| PATCH | `/jobs/:id` | Employer | Update a posting |
| DELETE | `/jobs/:id` | Employer | Delete a posting (cascades) |
| POST | `/jobs/:id/save` | Private | Toggle save/unsave |

### Applications
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/applications/:jobId` | Job seeker | Apply (requires a resume on the profile) |
| GET | `/applications/mine` | Job seeker | Own applications |
| GET | `/applications/stats` | Job seeker | Dashboard metrics |
| GET | `/applications/job/:jobId` | Employer | Applications for one posting |
| GET | `/applications/:id` | Owner | Single application |
| PATCH | `/applications/:id/status` | Employer | Update status + note |
| POST | `/applications/:id/withdraw` | Job seeker | Withdraw |
| DELETE | `/applications/:id` | Owner | Remove |

### Companies
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/companies` | Public | Directory (paginated, `?q=`) |
| GET | `/companies/:idOrSlug` | Public | Profile + open roles |
| GET | `/companies/mine` | Employer | Own company |
| POST | `/companies` | Employer | Create profile |
| PATCH | `/companies/mine` | Employer | Update profile |
| DELETE | `/companies/mine` | Employer | Delete (only with no postings) |

### Uploads
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/uploads/config` | Private | Whether uploads are enabled |
| POST | `/uploads/image` | Private | Multipart `file` + `target` (`avatar` \| `logo`) |
| POST | `/uploads/resume` | Job seeker | Multipart `file` (PDF/DOC/DOCX, ≤5 MB) |
| DELETE | `/uploads/resume` | Private | Remove the stored resume |

### Admin
All require the `admin` role.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/stats` | Platform metrics and breakdowns |
| GET | `/admin/users` | List users (`?role=`, `?q=`, paginated) |
| PATCH | `/admin/users/:id` | Change role / active flag |
| DELETE | `/admin/users/:id` | Delete a user |
| GET | `/admin/jobs` | List all jobs (`?status=`, `?q=`) |
| PATCH | `/admin/jobs/:id` | Feature/unfeature or change status |
| DELETE | `/admin/jobs/:id` | Delete a job |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run install:all` | Install root, backend and frontend dependencies |
| `npm run dev` | Run the API and the Vite dev server together |
| `npm run dev:api` / `npm run dev:web` | Run just one side |
| `npm run build` | Production build of the frontend |
| `npm run seed` | Seed demo data (`-- --destroy` to wipe) |
| `npm run lint` | Lint the frontend with oxlint |
| `start.bat` | Windows: validate setup, then run everything at once |

---

## Notes and gotchas

- **Vercel's filesystem is read-only.** Never write uploads to disk — that's why
  Multer uses memory storage and streams straight to Cloudinary.
- **Connection pooling matters on serverless.** `connectDB` caches the Mongoose
  connection on `global` so warm invocations reuse it instead of exhausting Atlas.
- **`bufferCommands: false`** makes queries against a disconnected client fail
  immediately rather than hanging for 10 seconds while Mongoose buffers them.
- **The admin role cannot be self-assigned.** Registration coerces any role other
  than `employer` to `jobseeker`; admin is granted only by the seed script (or by an
  existing admin).
- **Deleting a job cascades** to its applications and to every user's saved list.
- **Rate limits** are enabled only in production so development isn't throttled.
