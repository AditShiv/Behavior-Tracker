# Workspace

## Overview

pnpm workspace monorepo using TypeScript. A family points tracker app ("Robux Tracker") where an admin (you) can manage your cousin's behavior points and your cousin can redeem points for Robux.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Replit Auth (OIDC)
- **Frontend**: React + Vite + Tailwind CSS v4

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── points-tracker/     # React+Vite frontend (gaming dark theme)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # useAuth() hook for browser auth
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## App Features

### Admin (You)
- Dashboard with cousin's points balance
- Add or deduct points with a reason
- View all points history
- See all Robux redemption requests (pending)
- Accept or deny requests with an optional note

### Cousin
- Dashboard showing their points balance
- Points history (green = gained, red = lost)
- Redeem Robux page (1000 points = 1 Robux)
- Notifications page showing accepted/denied redemptions and point changes

## Setup Flow

1. Admin logs in → clicks "Claim Admin Role" (first-time only)
2. Admin enters cousin's User ID → links cousin account (cousin must log in first to see their ID)
3. Both users now have their respective dashboards

## Database Schema

- `sessions` — Auth sessions (Replit Auth required)
- `users` — Logged-in users (Replit Auth required)
- `points` — Points balance per user
- `points_history` — Log of all point changes
- `redemptions` — Robux redemption requests with status
- `notifications` — Per-user notifications for events
- `app_config` — Key-value config (admin_id, cousin_id)

## Environment

- `ADMIN_USER_ID` (optional) — If set, overrides DB admin config
- `DATABASE_URL` — Auto-provisioned by Replit
- `REPL_ID` — Used for OIDC auth (auto-provided by Replit)

## Points Logic

- Cousin starts with 500 points
- Admin can add (positive) or deduct (negative) any amount with a reason
- 1 Robux = 1000 points
- Redemption requests go to admin for approval
- On accept: points deducted, notification sent to cousin
- On deny: notification sent with reason
