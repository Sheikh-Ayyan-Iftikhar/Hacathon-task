# LetMeServe — Modern Service Booking Web Application

**Let Find. Book. Get It Done.**

LetMeServe connects customers with local service providers. Customers browse and book; providers accept/reject, move work through **In Progress → Completed**, and customers leave a 1–5 star review once the job is done.

Built for the **QuickServe / LetMeServe Hackathon (Task C)** brief — full booking workflow, real auth, real database persistence, role-based dashboards, validation, and enforced business rules (client-side **and** database-side).

---

## Tech stack

- React 18 + Vite
- React Router v6
- Supabase (Postgres + Auth) — persistence & authentication
- Tailwind CSS
- lucide-react icons

---

## 1. Set up Supabase (5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project, open **SQL Editor** → paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
   This creates all tables, Row Level Security policies, and the triggers that
   enforce the booking/review business rules at the database level.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**
4. (Recommended for a hackathon demo) In **Authentication → Settings**, turn
   **off** "Confirm email" so newly-registered accounts can log in immediately
   without checking an inbox.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

## 3. Install & run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## 4. Build for production / deploy

```bash
npm run build
```

Deploy the `dist/` folder to Netlify, Vercel, or any static host. Set the same
two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in
your host's dashboard.

---

## Demo credentials

This project ships with **no pre-seeded users** (Supabase auth accounts can't
be created via SQL alone). Create your own demo accounts once, then reuse them:

1. Go to `/register`, sign up as **Provider** — e.g. `provider@demo.com` / `demo123`.
   Log in, click **Edit profile** on the provider dashboard, and fill in a real
   service category, location, price, etc.
2. Repeat as **Customer** — e.g. `customer@demo.com` / `demo123`.
3. Create 5–6 provider accounts this way (or ask teammates to sign up) so the
   home page shows a full grid, as the brief requires "at least 6 service
   provider cards."

List whatever accounts you create here for your submission, e.g.:

```
Customer: customer@demo.com / demo123
Provider: provider@demo.com / demo123
```

---

## How each requirement is met

| Requirement | Where |
|---|---|
| Responsive home page, ≥6 provider cards | `src/pages/Home.jsx` + `ProviderCard.jsx` |
| Search / filter by category | `Home.jsx` (client-side search + category dropdown) |
| Provider details (name, service, location, experience, price, rating) | `src/pages/ProviderDetails.jsx` |
| Customer auth (Supabase) | `src/context/AuthContext.jsx`, `Login.jsx`, `Register.jsx` |
| Booking form (service, date, time, location, description) | `src/pages/BookingForm.jsx` |
| Unique booking ID | `src/utils/bookingId.js`, enforced `unique` in schema |
| Customer dashboard (status tracking) | `src/pages/CustomerDashboard.jsx` |
| Provider dashboard (incoming bookings) | `src/pages/ProviderDashboard.jsx` |
| Accept / Reject | `ProviderDashboard.jsx` |
| Accepted → In Progress → Completed | `ProviderDashboard.jsx` + DB trigger `enforce_booking_transition` |
| 1–5 star review after completion | `CustomerDashboard.jsx` review modal |
| Persistence across refresh | Everything is read from/written to Supabase, not local state |
| Business rules (unique ID, validation, no early review, no double review, rejected can't progress, completed is locked) | Enforced twice: client-side in `src/utils/validation.js` / UI gating, and server-side via Postgres triggers + a `unique` constraint on `reviews.booking_id` in `supabase/schema.sql` |

---

## Notes for evaluators

- **Not a static prototype** — every action (register, login, book, accept,
  reject, progress, review) reads and writes real rows in Supabase.
- **Business rules are enforced in the database**, not just hidden in the UI,
  so they hold even if someone calls the API directly.
- AI tools used during development: Claude (Anthropic) — used to scaffold the
  React/Supabase codebase from this brief.
