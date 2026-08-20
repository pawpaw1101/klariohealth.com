# Klario Next.js Web App

Klario runs as a Next.js + React application with two layers:

1. Public website
   - `/` - Home, product screenshots, and feature snapshots
   - `/about` - Who we are, how we started, the problem, and the solution
   - `/features` - Product features and user-facing benefits
   - `/login` - Try for free entry point

2. Logged-in web app
   - `/app/dashboard` - Health workspace overview
   - `/app/trends` - Biomarker trends and metric tracking
   - `/app/reports` - Uploaded reports, parsing status, and report detail
   - `/app/family` - Family profiles, archived profiles, and invitations
   - `/app/settings` - Account, preferences, sessions, reminders, and environment controls

Legacy app routes redirect into the five-section IA:
`/app/documents`, `/app/upload`, and `/app/timeline` redirect to Reports;
`/app/attention` redirects to Dashboard; `/app/invites` redirects to Family;
`/app/account` redirects to Settings.

The public navbar floats at the bottom of the page with icon-first navigation. The Try for free button leads to the login page, which then enters the Klario web app.

## Local Development

### 1. Start the Klario backend

From the sibling repo `../Biolens_backend`:

```bash
cd ../Biolens_backend
./scripts/dev.sh
```

This runs the API at `http://127.0.0.1:8000` with CORS enabled for this app and inline OCR/medical parsing.

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

The API client lives in `lib/api/`. Backend route references live under `../Biolens_backend/app/api/v1/`.

### 3. Local assets

The web app expects Klario brand and font assets to be present locally:

- `public/fonts/Inter-*.ttf`
- `public/fonts/PlusJakartaSans-*.ttf`
- `public/brand/klario-mark.png`
- `public/brand/klario-wordmark*.png`

These files are loaded locally by `app/layout.tsx` and `components/brand.tsx`; the app should not request Google-hosted fonts.

### 4. Try the live app

1. Register at `/register`
2. Create a family and member if prompted
3. Upload a PDF at `/app/reports`
4. Dashboard, trends, and attention update after parsing completes

Legacy `.html` URLs redirect to the new React routes.
