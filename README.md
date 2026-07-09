# OAUSTECH Student Hub

A full-stack, mobile-first web app for university students — centralizing academic
resources, departmental communication, campus news, and contributor tools.

Built with **React + Vite + TypeScript**, a fully **3D neumorphic UI design system**,
and **Supabase** (Auth, Postgres + RLS, Storage, Realtime) as the backend.

> The previous "Happy Birthday" page is preserved at [`legacy/happy-birthday.html`](legacy/happy-birthday.html).

## Features

- **Auth**: email + password, Google OAuth, email verification gate, forgot/reset password.
  Public sign-up always creates a **student**; contributor access is unlocked only via the admin approval flow.
- **Role-based access** (student / contributor / admin) enforced at the **RLS level**, not just the UI.
- **Study Materials**: browse Faculty → Department → Level → Semester → Course, with separate
  sections for Lecture Notes, Past Questions, Assignments and PowerPoints; ratings, reports, bookmarks, downloads.
- **Group Chat**: one realtime room per department (Supabase Realtime) with replies, image attachments, search.
- **News Feed**: contributor CRUD + student like/comment/share, category filters, search.
- **Global Search** across courses, notes, people, departments and news.
- **Contributor application + admin approval** workflow (with optional Resend email).
- **Contributor Dashboard** (uploads, news, stats) and **Admin Panel** (requests, analytics, users, faculties, announcements).
- **3D design system**: neumorphic cards, physical 3D buttons, inset inputs, floating nav/top bar,
  dark/light mode (persisted + `prefers-color-scheme`), `prefers-reduced-motion` support.

## Getting started

```bash
npm install
cp .env.example .env      # fill in your Supabase URL + anon key
npm run dev
```

The app runs in **demo mode** without Supabase credentials (UI is fully browsable;
auth/data calls are guarded). Add credentials to enable the backend.

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check + production build |
| `npm run typecheck` | Type-check only |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |

## Backend setup

See [`supabase/README.md`](supabase/README.md) for the full setup: run `schema.sql`
then `seed.sql`, configure Google OAuth, storage buckets, and the optional
`notify-email` edge function (Resend).

## Tech stack

- React 19, Vite, TypeScript
- react-router-dom
- @supabase/supabase-js
- Pure CSS 3D design system (no UI framework)
