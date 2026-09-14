# Expense Tracker

A full-stack expense tracker built while following **Full App - Dev to Deployment - Next.js, Prisma, Neon & Clerk**. This learning project connects a React interface to authentication, a PostgreSQL database, and deployment on Vercel.

**[Open the live app](https://expense-tracker-nextjs-livid-nine.vercel.app/)** · **[My revision notes](./REVISION.md)**

## Features

- Sign in and manage your account through Clerk.
- Add transactions with a description and amount.
- Record positive amounts as income and negative amounts as expenses.
- View your balance, total income, and total expenses.
- Browse transaction history, newest first.
- Delete transactions after confirmation, with toast feedback for actions.
- Persist transactions in PostgreSQL, with database actions scoped to the signed-in user.

For example, entering `Salary: 1000` and `Groceries: -75` gives a balance of **$925**, income of **$1,000**, and expenses of **$75**. The interface displays dollars; currency conversion is not implemented.

## Tech stack

| Technology | Role |
| --- | --- |
| Next.js 16 and React 19 | App Router, Server Components, and interactive UI |
| TypeScript | Component, transaction, and action-result types |
| Prisma 7 | Database models, migrations, and queries |
| Neon / PostgreSQL | Hosted relational database |
| `@prisma/adapter-pg` and `pg` | PostgreSQL connection for Prisma Client |
| Clerk | Authentication and account controls |
| React Toastify | Success and error notifications |
| CSS | Styling in `app/globals.css` |
| Vercel | App deployment |

See [package.json](./package.json) for dependency versions and scripts.

## Run locally

You need Node.js compatible with the project's Next.js and Prisma versions, npm, a PostgreSQL database (such as a Neon development database), and a Clerk application.

### 1. Clone the repository

```bash
git clone https://github.com/MohamdAlJawhari/expense-tracker-nextjs.git
cd expense-tracker-nextjs
```

### 2. Configure environment variables

Create `.env` in the project root with your own values:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="YOUR_CLERK_PUBLISHABLE_KEY"
CLERK_SECRET_KEY="YOUR_CLERK_SECRET_KEY"
```

Get your database connection string from Neon and your Clerk keys from the Clerk dashboard. The keys are described in the [Clerk Next.js setup guide](https://clerk.com/docs/nextjs/getting-started/quickstart). Keep `.env` private; the repository ignores `.env*` files. Only the publishable key belongs in a `NEXT_PUBLIC_` variable.

### 3. Install and prepare the database

```bash
npm ci
npx prisma generate --config ./prisma7.config.ts
npx prisma migrate deploy --config ./prisma7.config.ts
```

Installation also runs `prisma generate` through `postinstall`. The explicit command above selects this repository's custom Prisma configuration. Generation creates the client in `generated/prisma`; `migrate deploy` applies the committed migrations to the database selected by `DATABASE_URL`. Use a development database for local work.

### 4. Start the application

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000), sign in, and add a transaction.

## Project structure

```text
app/                  Home page, shared layout, and global CSS
components/           Header, form, totals, and transaction history
actions/              Server-side transaction operations and totals
lib/                  Prisma connection, user creation, and formatting
types/                Shared transaction TypeScript interface
prisma/               Database schema and committed migrations
prisma7.config.ts     Prisma CLI configuration and database URL
middleware.ts         Clerk authentication middleware
```

Clerk identifies the current user. `checkUser()` creates a corresponding database user if needed. Server actions use the Clerk user ID to read, add, and delete transactions through Prisma. Successful writes call `revalidatePath('/')` to refresh the page data.

## Scripts and deployment

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Serve a previously built production build |
| `npm run postinstall` | Generate Prisma Client |

To reproduce deployment, import the repository into Vercel as a Next.js project and set the three environment variables above for the target environment. Configure the deployed domain in Clerk as needed for your Clerk instance.

Apply committed migrations to the intended deployment database using `npx prisma migrate deploy --config ./prisma7.config.ts` before serving code that depends on them. The current build script only runs `next build`; it does **not** apply migrations. Generate Prisma Client during installation/build, then build with `npm run build`.

After deployment, check sign-in, adding income and expenses, updated totals, persistence after reload, and deletion.

## What I learned

This project practices component boundaries, authenticated Server Actions, relational data modeling, database migrations, form handling, and deployment configuration. See [REVISION.md](./REVISION.md) for explanations, exercises, and a four-day review plan.
