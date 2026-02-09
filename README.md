# Zamzam Visits

Zamzam Visits is a web-based visit management system for salespeople and admins. It supports role-based access, mobile-first visit submission, and GPS capture.

## Quick Start
1. Update `config.js` with your Supabase project URL and publishable key.
2. Serve the app locally (geolocation requires a web server):
   - `python -m http.server 5173`
3. Open `http://localhost:5173` in your browser.
4. Create users in Supabase Auth. On first login, a profile is created with role `salesperson`.
5. Promote admins by updating `profiles.role` to `admin` in Supabase.

## Realtime
Enable realtime updates on the visits table:
```sql
alter publication supabase_realtime add table public.visits;
```

## Admin Create User (Edge Function)
To create users from the Admin dashboard, deploy the `create-user` edge function and set the service role key:

```bash
supabase functions deploy create-user
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

After deployment, admin users can create new users directly from the UI.

## Documents
- docs/Zamzam-Visits-System-Requirements.md
- docs/Zamzam-Visits-SRS.md
- docs/Zamzam-Visits-UI-Wireframe.md
- docs/Zamzam-Visits-Database-Schema.sql
- supabase/migrations/20260204123000_initial_schema.sql
