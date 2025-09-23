# Premium LK

Admin dashboard with accounts, sales, customers, invoices, and a precise one-page A4 invoice export/print. Includes a lightweight, client-only login with manual lock and logout.

## Features

- Accounts, Sales, Customers management
- One-page A4 invoice PDF and print with precise layout
- Unified invoice template for list and modal exports
- Production-ready server with dotenv, CORS, and static serving
- Simple login with in-code credentials, manual lock screen, and logout (no database)

## Getting Started

1. Install dependencies
2. Create `.env` from `.env.example` (optional for local dev)
3. Start the dev server and open http://localhost:5173

### Simple Login and Lock Screen

This project includes a lightweight, client-only login with a manual lock screen and logout. No database is used.

- Default credentials:
	- Email: admin@premium.lk
	- Password: premium123
- Change them at: `src/config/auth.ts` by editing `HARDCODED_CREDENTIALS`.
- Behavior:
	- On first load, you’ll see the Login screen.
	- After signing in, the app stores a minimal session in `localStorage`.
	- Use the Sidebar “Lock” button to lock the app; unlock by entering the password.
	- Use the Sidebar “Logout” button to clear the session and return to Login.

Note: This is intended for basic gating only. For production-grade auth, integrate a backend with proper session/JWT handling.

