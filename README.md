# FR. PAU 25 — Anniversary RSVP & Guest Management System

A mobile-friendly RSVP website for the 25th Presbyteral Anniversary of Rev. Fr. Paulo Baria Barandon. Everyone uses one universal QR code; successful submissions are automatically recorded without organizer approval.

## Included
- `index.html`: public RSVP form
- `styles.css`: responsive gold-and-ivory design
- `app.js`: form validation and submission to Supabase Edge Function
- `admin.html`: secure admin sign-in, RSVP dashboard, search, seat totals, CSV export
- `supabase/schema.sql`: database tables and row-level security policies
- `supabase/functions/submit-rsvp/index.ts`: validated public submission endpoint

## Important
This is a deployable starter package, not a live website yet. It must be connected to your own Supabase project and hosted before the QR code can be used. Do not put a Supabase service-role key in any HTML or JavaScript file.

## Setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Create an administrator in Supabase Authentication (email/password). Confirm the user is enabled.
4. In Supabase SQL Editor, add that user to the admin allow-list:
   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE_THE_AUTH_USER_UUID_HERE');
   ```
5. Install the Supabase CLI and log in. From the project directory, link your Supabase project and deploy the function:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy submit-rsvp
   ```
   The function uses the project's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables. Keep the service-role key server-side only.
6. In `app.js`, replace `PASTE_YOUR_SUPABASE_EDGE_FUNCTION_URL_HERE` with:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-rsvp`
7. In `admin.html`, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the project's URL and publishable/anon key. Never use the service-role key there.
8. Host `index.html`, `admin.html`, `styles.css`, and `app.js` on GitHub Pages or another static host. The `supabase` folder is deployment/source material; it does not need to be publicly hosted with the website.
9. Open the public page and test an attending response, a declined response, a likely duplicate, and admin login before sharing the QR code.
10. Generate one QR code pointing to the final public page URL. Use that same QR code on all invitations.

## Security and operational notes
- Public visitors cannot read the RSVP table; submissions go through the Edge Function.
- Only user IDs added to `admin_users` can view or manage RSVP records.
- The endpoint flags a matching name + phone as a possible duplicate. Guests should contact the organizers to change an existing reservation.
- This starter does not yet enforce a maximum seating capacity, implement CAPTCHA/rate limiting, or provide a guest-facing edit link. Add those before broad public release if abuse prevention or seat caps are required.
- The current admin page provides read/search and CSV export. Editing/deleting records can be done by adding authorized admin actions; the database policies already allow authorized admin updates/deletes.
- Guest contact information is personal data. Limit admin access, keep exports secure, and provide a clear privacy notice consistent with the organizer's data-handling practices.
