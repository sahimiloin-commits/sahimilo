# SahiMilo Marketplace

Supabase-connected marketplace for finding approved local professionals.

## Updated registration flow

- Professionals register directly without OTP.
- Every new profile is saved as \`pending\`.
- Pending profiles do not appear in public search.
- Admin logs in with email/password and approves profiles.
- Only \`approved\` profiles marked \`verified_by_admin=true\` appear publicly.

## Required Supabase update

Run \`supabase-update-remove-otp.sql\` once:

1. Open Supabase Dashboard.
2. Select the SahiMilo project.
3. Open **SQL Editor > New query**.
4. Paste the complete SQL file.
5. Click **Run**.

Then test one registration, confirm it is pending, log in as admin, approve it, and search for it on the homepage.

## Important

The publishable Supabase key in \`config.js\` is intended for browser use. Never put the Supabase service-role key in frontend code. Replace the placeholder WhatsApp number before launch.