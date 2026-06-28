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

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Legacy `.html` URLs redirect to the new React routes.
