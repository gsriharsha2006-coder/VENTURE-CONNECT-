# Production Supabase Setup for Venture Connect

This guide connects the existing Venture Connect MVP to a real Supabase project. The app keeps its demo data only when Supabase public environment variables are absent. When Supabase is configured, authentication and supported persistence flows use the database and show database errors instead of silently substituting mock records.

## 1. Create the Supabase project

1. Sign in to Supabase and create a new project.
2. Choose the production organization, project name, region, and a strong database password.
3. Wait for the project to finish provisioning.
4. Do not copy the database password, service-role key, or any secret into the repository.

## 2. Install the Venture Connect schema

1. Open the Supabase dashboard for the project.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of `supabase/schema.sql` into the editor.
4. Run the query once.
5. Confirm that the following tables exist in **Table Editor**: `profiles`, `idea_workspaces`, `opportunities`, `applications`, `vc_reports`, `messages`, `service_providers`, `service_posts`, `service_requests`, `notifications`, and `subscriptions`.
6. In **Authentication > Hooks** or the SQL editor, confirm the `on_auth_user_created` trigger exists on `auth.users`.
7. Confirm Row Level Security is enabled on every public table.

The signup trigger accepts only `founder`, `investor`, `incubator`, `hackathon_organizer`, `event_organizer`, and `service_provider`. It intentionally cannot create an admin account from public signup metadata.

## 3. Copy the project URL and publishable key

1. Open **Project Settings > API**.
2. Copy the project URL.
3. Copy the publishable key. On older Supabase projects, this may still be labelled the anon/public key.
4. Do not use the service-role key in any `NEXT_PUBLIC_` variable.

## 4. Configure local environment variables

Create `C:\Users\ADMINS\Documents\New project\.env.local`. This file is already ignored by Git.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is temporarily supported as a fallback for older setups, but new setups should use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

`SUPABASE_SERVICE_ROLE_KEY` is optional for server-only administrative API work. It is not required for signup, login, logout, password recovery, route protection, profile creation, or Idea Workspace persistence. If it is ever configured, keep it only in `.env.local` or the hosting provider's server-side secrets and never prefix it with `NEXT_PUBLIC_`.

Restart the development server after changing environment variables:

```powershell
cd "C:\Users\ADMINS\Documents\New project"
npm.cmd run dev
```

## 5. Configure authentication URLs

In **Authentication > URL Configuration** set:

- Site URL: `http://localhost:3000`
- Additional redirect URL: `http://localhost:3000/auth/callback`
- Additional redirect URL: `http://localhost:3000/auth/update-password`

For the production Vercel deployment, add the equivalent HTTPS URLs:

- `https://YOUR_DOMAIN/auth/callback`
- `https://YOUR_DOMAIN/auth/update-password`

Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin in Vercel. Do not include a trailing slash.

In **Authentication > Providers > Email**, enable email/password authentication. Decide whether email confirmation is required. When confirmation is enabled, the signup email returns through `/auth/callback`, which exchanges the authorization code for the cookie-based session.

## 6. Test founder registration

1. Open `http://localhost:3000/auth`.
2. Keep **Signup** selected and choose **Founder**.
3. Enter a new email address and a password of at least eight characters.
4. Select **Create account**.
5. If email confirmation is enabled, open the confirmation email and follow its link.
6. Confirm the browser reaches `/dashboard`.
7. In Supabase **Authentication > Users**, confirm the user exists.
8. In **Table Editor > profiles**, confirm one row exists with the same `user_id` and role `founder`.

If a profile row is missing, rerun the current `supabase/schema.sql` and verify the `on_auth_user_created` trigger before creating another test account. Configured-mode errors are shown deliberately and should not be bypassed with demo data.

## 7. Test login and logout

1. Log out using the **Log out** control in the application header.
2. Confirm the browser returns to `/auth`.
3. Switch to **Login**, enter the founder credentials, and log in.
4. Confirm the stored profile role redirects the user to `/dashboard`.
5. Try opening `/investor/discover`, `/provider/dashboard`, and `/admin` while signed in as the founder. Each attempt should redirect back to `/dashboard`.
6. Close and reopen the browser, then revisit `/dashboard` to confirm the cookie-backed Supabase session persists.

Repeat registration with the other selectable roles and verify these redirects:

- `investor`, `incubator`, `hackathon_organizer`, `event_organizer` -> `/investor/discover`
- `service_provider` -> `/provider/dashboard`

Admin accounts must be assigned manually by a trusted operator in the Supabase SQL editor after the Auth user exists:

```sql
update public.profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'ADMIN_EMAIL@example.com');
```

Never expose an admin-role assignment endpoint to public signup.

## 8. Test password recovery

1. On the Login view, enter the account email.
2. Select **Forgot password?**.
3. Open the recovery email.
4. Confirm the link passes through `/auth/callback` and opens `/auth/update-password`.
5. Set and confirm a new password.
6. Return to login and authenticate with the new password.

## 9. Test Idea Workspace persistence

1. Sign in as a founder and open `/dashboard/idea-workspace`.
2. If the account has no documents, select **Create first workspace**.
3. Change the document title and edit required sections.
4. Wait for the save status, then refresh the page.
5. Confirm the document loads with the same title, sections, completion percentage, and status.
6. Create another workspace and confirm a second row appears in `public.idea_workspaces` with `founder_id` equal to the authenticated user ID.
7. Archive a workspace and confirm `archived = true`.
8. Delete a workspace and confirm only that founder-owned row is deleted.
9. Sign in as another founder and confirm the first founder's documents are not visible.

## 10. Production checklist

- Run `npm.cmd run build` with no secrets printed to output.
- Configure the three public environment variables in Vercel.
- Add only the production HTTPS redirect URLs that are required.
- Keep email confirmation enabled for production unless the product owner approves another flow.
- Create the first admin only through a trusted SQL/server process.
- Review Supabase Auth logs and PostgreSQL logs after the first test registrations.
- Back up the database before applying later schema changes.

## Deferred integrations

- Supabase Storage for workspace uploads and provider certificates
- Gemini or another production AI provider
- Vercel production deployment and domain configuration
- Payments and subscription webhooks
