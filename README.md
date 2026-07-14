# Klario Next.js Web App

Klario now runs as a Next.js + React application with two layers:

1. Public website
   - `/` - Home, product screenshots, and feature snapshots
   - `/about` - Who we are, how we started, the problem, and the solution
   - `/features` - Product features and user-facing benefits
   - `/login` - Try for free entry point

2. Logged-in web app
   - `/app/dashboard` - Health workspace overview
   - `/app/documents` - Uploaded reports and documents
   - `/app/upload` - Report upload options
   - `/app/timeline` - Longitudinal health history
   - `/app/trends` - Biomarker trend charts
   - `/app/family` - Family and pet profiles
   - `/app/account` - Profile, security, and account controls
   - `/app/settings` - App preferences

The public navbar floats at the bottom of the page with icon-first navigation. The Try for free button leads to the login page, which then enters the Klario web app.

## Local Development

### 1. Start the Clario backend

From the sibling repo `Biolens-Backend`:

```bash
cd ../../Biolens-Backend
./scripts/dev.sh
```

This runs the API at `http://127.0.0.1:8000` with CORS enabled for this app and inline OCR/medical parsing (no separate Celery worker needed for local dev).

### 2. Configure and run the frontend

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

| Variable | Local value |
|----------|-------------|
| `NEXT_PUBLIC_KLARIO_API_BASE_URL` | `https://klario-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_KLARIO_API_ROOT` | `https://klario-backend.onrender.com` |

The API client lives in `lib/api/`. Full backend contract: `../../Biolens-Backend/docs/frontend_api_contract.md`.

### 3. Try the live app

1. Register at `/register` (backend returns user only — app auto-logs in)
2. Create a family and member if prompted
3. Upload a PDF at `/app/upload`
4. Dashboard, trends, and attention update after parsing completes

Legacy `.html` URLs redirect to the new React routes.
