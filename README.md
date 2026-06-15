# Wedding Planner PWA

Mobile-first wedding planning and expense tracker built with React, Vite, and Supabase.

## Features

- Email/password login with Supabase Auth.
- One wedding profile per account.
- Indonesian-first planning flow: Home, Biaya, Checklist, Vendor.
- General Indonesian and Batak Toba starter templates.
- Expense tracking by category and rincian biaya.
- Payment schedules, vendor records, checklist filters, and receipt photo uploads.
- Profile drawer with install instructions and reset tools.
- PWA manifest and service worker for installable web app behavior.

## Requirements

- Node.js 20+
- Supabase project
- A browser for local testing

## Supabase Setup

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql).
4. Go to **Authentication > Providers > Email** and enable email/password sign-in.
5. Copy your project URL and anon public key from **Project Settings > API**.

## Local Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run locally:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## iPhone Install Flow

1. Deploy the production build to a HTTPS host such as Vercel, Netlify, or Supabase Hosting-compatible static hosting.
2. Open the deployed URL in Safari on iPhone.
3. Tap **Share**.
4. Tap **Add to Home Screen**.

The app will appear like an installed app, but it is still a PWA and runs through Safari/WebKit.

## Notes

- Supabase is the source of truth, so data follows the logged-in account.
- Receipt photos are stored in the private `receipts` Storage bucket.
- The service worker only caches same-origin app assets and does not cache Supabase API responses.
- Reminder notifications are intentionally not included in this PWA MVP.
