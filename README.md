# Cost Keeper

Track your income and expenses.

## Flow Diagram

![diagram](https://github.com/user-attachments/assets/d53d01f6-80a5-46a3-951b-2d33cd2ba60f)

## Stack

| Area          | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Framework     | Next.js 16.3 (App Router, Turbopack), React 19.3             |
| Language      | TypeScript 7 (native compiler)                               |
| API           | Hono, mounted at `app/api/[[...route]]`                      |
| Database      | Neon Postgres via Drizzle ORM                                |
| Auth          | Clerk 7 (`proxy.ts` + per-route checks)                      |
| UI            | Tailwind CSS 3, Radix UI, shadcn-style components, Recharts  |
| Data fetching | TanStack Query                                               |
| PWA           | Serwist (`@serwist/turbopack`), service worker at `app/sw.ts`|
| Lint / format | Biome 2.5                                                    |
| Package manager | Bun                                                       |

## Getting started

```bash
bun install
bun run dev
```

Create a `.env.local` with:

```bash
DATABASE_URL=                        # Neon Postgres connection string
NEXT_PUBLIC_APP_URL=                 # e.g. http://localhost:3000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

TELEGRAM_BOT_TOKEN=                  # see docs/TELEGRAM.md
GEMINI_API_KEY=                      # natural-language transaction parsing
```

### Scripts

| Script               | What it does                                     |
| -------------------- | ------------------------------------------------ |
| `bun run dev`        | Dev server (Turbopack)                           |
| `bun run build`      | Production build (Turbopack)                     |
| `bun run start`      | Serve the production build                       |
| `bun run typecheck`  | `tsc --noEmit` on the TypeScript 7 compiler      |
| `bun run check`      | Biome lint + format check                        |
| `bun run check:fix`  | Biome lint + format, writing fixes               |
| `bun run lint`       | Biome lint only                                  |
| `bun run format:fix` | Biome format only, writing fixes                 |
| `bun run db:generate`| Generate Drizzle migrations                      |
| `bun run db:migrate` | Apply Drizzle migrations                         |
| `bun run db:studio`  | Open Drizzle Studio                              |

## Toolchain benchmarks

Measured when the project moved from Next.js 15 / webpack / TypeScript 5 / ESLint +
Prettier to the stack above. Both configurations were benchmarked back to back on the
same machine (Apple Silicon, macOS 25.6, Node 26.5, Bun 1.3.14) from a clean checkout,
reporting the **median of 3 runs**. Native binaries were exercised once beforehand so
first-run costs are excluded.

| Metric                            | Before    | After     | Change             |
| --------------------------------- | --------: | --------: | ------------------ |
| Production build, warm cache      | 18.79 s   | **3.75 s**| **5.0x faster**    |
| Production build, cold            | 33.63 s   | **10.41 s** | **3.2x faster**  |
| Lint + format check               | 2,409 ms  | **115 ms**| **20.9x faster**   |
| Typecheck (`tsc --noEmit`)        | 3,827 ms  | **933 ms**| **4.1x faster**    |
| Dev server ready                  | 1,218 ms  | **343 ms**| **3.6x faster**    |
| `.next` output size               | 516 MB    | **195 MB**| **62% smaller**    |
| Client static assets              | 2,524 KB  | 2,360 KB  | 6.5% smaller       |
| `node_modules` entries            | 664       | **386**   | 42% fewer          |
| Dependency install (warm cache)   | 1,576 ms  | 1,643 ms  | 4% slower          |
| `node_modules` on disk            | 752 MB    | 821 MB    | 9% larger          |

**Where the gains come from.** Turbopack's filesystem cache accounts for the build
numbers — it persists between runs, which webpack had no equivalent for, so repeat
builds drop the most. Biome replaces ESLint plus Prettier with a single Rust binary
that checks all 152 files in around 100 ms. TypeScript 7 is the native (Go) compiler;
its advantage grows with codebase size, so a project this size sees a smaller
multiple than a large monorepo would.

**The two regressions are deliberate.** TypeScript 7 and Biome ship platform-native
binaries (`@typescript/typescript-darwin-arm64` ~27 MB, `@biomejs/cli-darwin-arm64`
~55 MB) in place of much smaller pure-JavaScript packages. That costs about 69 MB of
disk and a fraction of a second on install, in exchange for the speedups above.

Reproduce with `bun run typecheck`, `bun run check`, and `bun run build` against this
commit and its parent.
