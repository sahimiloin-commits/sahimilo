# SahiMilo Marketplace

Supabase-connected marketplace for customers and local professionals.

## Account flow

- Customers create a SahiMilo account with a Gmail address and a 6-digit PIN.
- Professionals create a SahiMilo account with a Gmail address and a 6-digit PIN.
- OTP and Google OAuth are not used.
- Customers complete their contact and address profile after login.
- Professionals complete services, service area, experience and contact details after login.
- Every new professional profile remains pending until admin approval.

## Required Supabase setup

1. Run `supabase-update-gmail-pin-accounts.sql` in **Supabase Dashboard > SQL Editor**.
2. Open **Authentication > Sign In / Providers > Email**.
3. Keep Email provider enabled.
4. Turn **Confirm email** off so account creation does not require email verification.
5. Ensure the minimum password length allows the six-digit PIN.

## Important

The publishable Supabase key in `config.js` is intended for browser use. Never put a service-role or secret key in frontend code. PINs are handled only by Supabase Auth and are never stored in the profile tables.
