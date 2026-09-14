# Expense Tracker — My Revision Notes

A reminder of how this project works, so I can revise without replaying the whole tutorial. Open the linked source files while reviewing each section.

## 1. The complete flow

```text
Sign in with Clerk
  -> Header calls checkUser() to find/create the database user
  -> Home page displays the dashboard
  -> Submit the transaction form
  -> Server action checks authentication and input
  -> Prisma writes to PostgreSQL on Neon
  -> revalidatePath('/') refreshes page data
  -> History and totals update; a toast confirms the result
```

Next.js runs the application, React renders the interface, Clerk identifies the user, Prisma queries the database, Neon hosts PostgreSQL, and Vercel hosts the deployed app.

## 2. Server and Client Components

[app/layout.tsx](./app/layout.tsx) contains the shared layout, Clerk provider, header, fonts, CSS, and toast container. [app/page.tsx](./app/page.tsx) handles `/`, checks `currentUser()`, and displays either the guest view or dashboard.

The page, balance, income/expense summary, and history list are async Server Components that fetch data on the server. [AddTransaction](./components/AddTransaction.tsx) and [TransactionItem](./components/TransactionItem.tsx) use `'use client'` for refs, event handlers, browser confirmation, and toast feedback.

A Client Component can call a Server Action while the database operation executes on the server. The database client and secrets must stay in server code.

## 3. Authentication and ownership

| Piece | Purpose here |
| --- | --- |
| `ClerkProvider` | Provides Clerk integration |
| `middleware.ts` | Runs Clerk middleware for matching requests |
| `currentUser()` | Gets the signed-in user's Clerk profile |
| `auth()` | Gets the authenticated user ID inside actions |
| `SignInButton`, `UserButton`, `Show` | Display controls based on session state |
| `lib/checkUser.ts` | Finds or creates the local database user |

Authentication answers **who is signed in**. Ownership checks determine **which records that person can access**. Actions obtain `userId` on the server: reads filter by it, creation stores it, and deletion matches both transaction ID and user ID.

The guest screen controls what is displayed; checks inside actions enforce data access. Calling `clerkMiddleware()` alone does not restrict every route.

This repository uses `middleware.ts`. Current Clerk instructions use `proxy.ts` for Next.js 16+, so remember that naming difference when comparing the tutorial with the [Clerk Next.js guide](https://clerk.com/docs/nextjs/getting-started/quickstart).

## 4. Database models and relationships

Read [prisma/schema.prisma](./prisma/schema.prisma).

- `User` has an internal UUID, unique Clerk ID, unique email, optional profile fields, and timestamps.
- `Transaction` has an ID, description (`text`), signed `amount`, owner (`userId`), and creation time.
- One user can have many transactions.
- **`Transaction.userId` references `User.clerkUserId`, not `User.id`.**
- `@@index([userId])` supports owner-based lookups.
- `onDelete: Cascade` removes related transactions when the database user is deleted. Clerk account deletion is not automatically synchronized: this project has no deletion webhook.

[checkUser](./lib/checkUser.ts) runs from the header and creates a missing database user. It does not update an existing user's profile when their Clerk details change.

## 5. Prisma setup and commands

[lib/db.ts](./lib/db.ts) uses `DATABASE_URL` to create a PostgreSQL adapter and passes it to Prisma Client. During development, `globalThis.prisma` allows the client to be reused across hot reloads.

| File or directory | Responsibility |
| --- | --- |
| `prisma/schema.prisma` | Models and generated client location |
| `prisma7.config.ts` | CLI schema/migration paths and connection URL |
| `generated/prisma` | Generated query client imported by the app |
| `prisma/migrations` | Versioned SQL changes to the database |

**Generating the client does not create database tables.** Migrations change the schema in the database.

Run these from the project root with the intended database configured in `.env`:

```bash
# Regenerate query code after schema changes
npx prisma generate --config ./prisma7.config.ts

# Create and apply a migration during development
npx prisma migrate dev --name describe_change --config ./prisma7.config.ts

# Apply existing committed migrations for deployment
npx prisma migrate deploy --config ./prisma7.config.ts

# Browse database records
npx prisma studio --config ./prisma7.config.ts
```

Use `migrate dev` against a development database. Commit schema changes and their migration files together. Keep the explicit `--config` argument because this project uses a custom config filename.

## 6. Trace adding and deleting a transaction

Read [AddTransaction.tsx](./components/AddTransaction.tsx), then [addTransaction.ts](./actions/addTransaction.ts).

1. Input `name` attributes become the `text` and `amount` keys in `FormData`.
2. The form calls `clientAction(formData)`, which awaits the Server Action.
3. The server calls `auth()` and rejects an unauthenticated request.
4. It checks missing values and converts the amount with `parseFloat`.
5. `db.transaction.create()` saves the values with the authenticated owner.
6. `revalidatePath('/')` refreshes the affected page data.
7. The client displays feedback and resets the form on success using `useRef`.

Deletion follows the same pattern: browser confirmation, authenticated server operation, ownership filter, and revalidation. See [deleteTransaction.ts](./actions/deleteTransaction.ts).

Actions return objects such as `{ error: '...' }` for the UI to handle. TypeScript describes expected values; it does not validate untrusted form input at runtime.

## 7. How totals work

Read [getUserBalance](./actions/getUserBalance.ts), [getIncomeExpense](./actions/getIncomeExpense.ts), and [getTransactions](./actions/getTransactions.tsx).

```ts
const amounts = [1000, -75, -25, 200];
const balance = amounts.reduce((sum, n) => sum + n, 0); // 1100
const income = amounts.filter((n) => n > 0).reduce((sum, n) => sum + n, 0); // 1200
const expense = Math.abs(
  amounts.filter((n) => n < 0).reduce((sum, n) => sum + n, 0)
); // 100
```

`map` extracts amounts from transaction records. `filter` separates positive and negative values. `reduce` sums them, starting at `0` so empty lists work. `Math.abs` displays the expense total as a positive value. History orders by `createdAt: 'desc'` for newest first.

## 8. Deployment reminders

- Local `.env` values are separate from Vercel environment variables.
- Confirm the database selected by `DATABASE_URL` before applying migrations.
- Keep `CLERK_SECRET_KEY` on the server; the publishable key is intended for browser use.
- `npm run build` compiles the app but does not apply migrations.
- Generated Prisma files are ignored by Git, so deployment must generate the client.
- Redeploy after changing deployment configuration, then check sign-in and transaction operations.

## 9. Improvements to practice later

These are exercises, not completed features:

- Trim descriptions and reject invalid or non-finite amounts on the server.
- Show pending feedback and prevent repeated submissions while saving.
- Return after a delete error in `TransactionItem`: it currently reaches the success toast after the error branch too.
- Display balance and income/expense query errors consistently.
- Explore integer cents or Prisma `Decimal` instead of `Float` for monetary precision.
- Remove profile debug logging and handle concurrent first-time user creation safely.
- Add transaction editing, categories, or date filtering.

## 10. Four-day revision plan

| Day | Review for 20–30 minutes | Recall exercise |
| --- | --- | --- |
| 1 | Page, layout, Server and Client Components | Explain where each part executes |
| 2 | Clerk, local users, schema, and ownership | Draw the relationship and explain both user IDs |
| 3 | Add/delete actions, array methods, revalidation | Trace a submission and calculate totals without looking |
| 4 | Environment variables, migrations, deployment | Explain a fresh setup; try one improvement locally |

### Test myself

1. Why does every transaction action check `auth()`?
2. Why does the owner come from the session instead of the form?
3. Which field does `Transaction.userId` reference?
4. How do generation and migrations differ?
5. Why call `revalidatePath('/')` after a write?
6. Why might local development work while deployment fails?

<details>
<summary>Answers — open after trying</summary>

1. Actions need authentication checks before accessing data.
2. Submitted fields can be changed by the user; ownership must come from the authenticated session.
3. `User.clerkUserId`.
4. Generation creates query code; migrations change database tables and constraints.
5. The page's totals and history depend on the changed records.
6. Deployment may lack environment variables, migrations, generated client files, or appropriate Clerk domain configuration.

</details>

See [README.md](./README.md) for setup instructions and the live app.
