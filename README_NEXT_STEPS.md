# FR. PAU 25 RSVP — Next Steps Package

Public RSVP website: https://ligaoparish.github.io/fr-pau-rsvp/

## Universal QR code
- `FR_PAU_25_Universal_RSVP_QR.png` opens the public RSVP page.
- Use the same QR code on every invitation. It opens the page; each guest must still complete and submit their own RSVP.

## Website files
- `index.html` — public RSVP form, including the reserved-seat count and one name field per seat.
- `styles.css` — gold-and-ivory responsive styling and Fr. Pau portrait.
- `app.js` — form validation and submission to the Supabase Edge Function.
- `admin.html` — password sign-in, dashboard totals, search, and CSV export.
- `assets/fr-pau-gold-vestment.png` — Fr. Pau's portrait.
- `supabase/schema.sql` — database schema and admin access policies.
- `supabase/functions/submit-rsvp/index.ts` — server-side validation and RSVP submission endpoint.

## Important: database setup is still required
The public Supabase project URL and publishable key have been entered in `app.js` and `admin.html`. The public form still will not save responses until you run `supabase/schema.sql` and deploy the `submit-rsvp` Edge Function. The dashboard will not work until an administrator Auth user is created and allow-listed.

### Connect Supabase
1. Create/open your Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create an email/password administrator in Supabase Authentication.
4. Copy that user's UUID and run this SQL (replace the placeholder):
   ```sql
   insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
   ```
5. Deploy `supabase/functions/submit-rsvp/index.ts` using the Supabase CLI from this project folder:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy submit-rsvp
   ```
6. Ensure the Edge Function has its `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets configured server-side. Never put the service-role key in HTML/JS or share it in chat.
7. The project URL, publishable key, and Edge Function URL are already configured in `app.js` and `admin.html` in this package. Never put a secret/service-role key in browser files.
8. Upload updated `index.html`, `app.js`, `admin.html`, `styles.css`, and the `assets` folder to the repository for GitHub Pages.

## Test before distributing the QR code
1. Submit one test RSVP with 2 seats and 2 attendee names.
2. Confirm the submission appears in the admin dashboard and seat totals are correct.
3. Test a declined response.
4. Test duplicate handling and admin login.
5. Delete test records from the dashboard/database if appropriate.

## Privacy and safety
RSVP records contain personal information. Restrict admin accounts and downloads to authorized organizers. The universal QR code is public and is not itself a reservation confirmation; a guest's RSVP is confirmed only after successful form submission.
