# BarPOS

Responsive bar and restaurant POS built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and SQLite for local development.

## Features

- POS billing with table/customer/staff selection
- Configurable products, categories, offers, complimentary starters, staff, commission rules, expenses, invoice settings, printer settings, roles, and permissions
- Complimentary items are shown at ₹0, reduce stock, and add inventory cost
- Split payments with cash/card/UPI/online modes
- Tips belong 100% to waitress and are excluded from restaurant revenue/commission
- Protected commission formula:
  - Normal Commission = `(Eligible Sales - Special Drink Sales) × Normal %`
  - Special Commission = `Special Drink Sales × Special %`
  - Total Commission = Normal + Special
- Staff advances, partial/full deductions, settlements, pending balance, and staff ledger
- Daily reports, payment breakdown, tips, expenses, inventory cost, complimentary report, gross profit, and net profit
- Printable customer invoices and waitress settlement receipts
- Audit logs for sensitive actions

## Demo Login

Seeded admin:

```text
Email: admin@barpos.local
Password: Admin@12345
```

## Getting Started

Install dependencies and prepare the local SQLite database:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 with your browser.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deployment Notes

For the provided Ubuntu server, run the app as a Node.js service behind Nginx.

Recommended production steps:

```bash
git clone https://github.com/Moksha89/barpos.git /opt/barpos
cd /opt/barpos
npm ci
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run build
npm run start
```

SQLite is used for the first local/server version. The schema is written through Prisma so the app can be moved to PostgreSQL in a later production hardening pass.

## Database

Migration:

```text
prisma/migrations/20260519205947_init_barpos_foundation/migration.sql
```
