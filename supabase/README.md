# Supabase setup

## 1. Create a project
Create a project at [supabase.com](https://supabase.com). From **Project Settings → API**,
copy the **Project URL** and **anon public** key into the app's `.env`:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## 2. Run the schema + seed
In the Supabase **SQL Editor**, run in order:

1. [`schema.sql`](schema.sql) — tables, enums, RLS policies, triggers, storage buckets, realtime.
2. [`seed.sql`](seed.sql) — faculties, departments, one chat room per department, sample courses.

Or with the Supabase CLI:

```bash
supabase db execute --file supabase/schema.sql
supabase db execute --file supabase/seed.sql
```

## 3. Auth configuration
- **Email**: enable "Confirm email" (Authentication → Providers → Email) so verification links are sent.
- **Google**: enable the Google provider and add your OAuth client ID/secret. Add
  `https://<ref>.supabase.co/auth/v1/callback` as an authorized redirect URI, and your
  app origin to **URL Configuration → Redirect URLs**.
- New auth users automatically get a `public.users` profile row via the `handle_new_user` trigger.
  Sign-up metadata (name, matric, faculty, department, level) is read from `raw_user_meta_data`.

## 4. Make yourself an admin
After signing up and verifying:

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

## 5. Storage
Three buckets are created by `schema.sql`:
- `notes` (public read; only approved contributors write)
- `chat-images` (public read; verified users write)
- `id-cards` (private; owner/admin read)

## 6. Transactional email (optional — Resend)
Deploy the edge function and set secrets:

```bash
supabase functions deploy notify-email
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="Student Hub <no-reply@yourdomain>"
```

The admin approve/reject actions call this function best-effort; if it isn't deployed,
the in-app notification still fires and the flow succeeds.

## Security notes
- RLS is enabled on **every** table.
- Users cannot change their own `role` or `banned` flag (enforced by the `guard_profile_privileges` trigger).
- Only `role = contributor` (approved + verified) can insert into `notes`/`news`.
- Unverified users are blocked from protected writes at the database level via the `is_verified()` checks.
