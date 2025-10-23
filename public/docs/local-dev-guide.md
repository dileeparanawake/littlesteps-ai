# Local Development Guide

## Prerequisites

- Docker and Docker Compose installed
- Optional for convenience: pnpm (to use the provided scripts)

### 1) Create `.env`

Create a `.env` at the project root (use `.env.example` and follow guidance)

```env
# App + OpenAI
OPENAI_API_KEY=your-openai-api-key

# Google OAuth (BetterAuth)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Postgres (Docker service `db`)
PGDATABASE=littlesteps
PGUSER=postgres
PGPASSWORD=postgres

# App DB connection string (inside Docker network; host is 'db')
DATABASE_URL=postgresql://postgres:postgres@db:5432/littlesteps
```

Notes:

- An OpenAI key is required for assistant replies in `/api/chat`.

### 2) Google OAuth setup (BetterAuth)

[Better Auth Google Instructions](https://www.better-auth.com/docs/authentication/google)

- Create a Web application OAuth client in Google Cloud Console.
  - Authorised JavaScript origins: `http://localhost:3000`
  - Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Copy the Client ID and Secret into your `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

#### 3) Start services (Docker)

Option A — using Docker Compose directly:

```bash
docker compose down --volumes --remove-orphans
docker compose build --no-cache
docker compose up -d
```

Option B — using package scripts (requires pnpm):

```bash
pnpm docker:reset    # down -> build -> up
```

- App: http://localhost:3000
- The Next.js app runs inside the `littlesteps-dev` container with hot reload.

#### 4) Apply database migrations

Run migrations after containers are up:

```bash
pnpm migrate
```

This waits for Postgres in the `db` container, then runs `drizzle-kit migrate` inside `littlesteps-dev` using your `DATABASE_URL`.

#### 5) Use the app

- Open http://localhost:3000
- Click Sign in → Google (BetterAuth session).
- Create a thread and send a message; the app will persist to Postgres and call OpenAI.

#### 6) Stop and reset

- Stop:

```bash
docker compose down
```

- Full reset (including volumes):

```bash
docker compose down --volumes --remove-orphans
```

- Convenience scripts:

```bash
pnpm docker:down
pnpm docker:build
pnpm docker:up
pnpm docker:reset          # down + build + up
pnpm docker:reset:db       # resets migrations & volume, regenerates, applies (for local dev only)
```

Caution: `docker:reset:db` deletes and regenerates local migration files. Use only for local experiments; for normal setup, prefer `pnpm migrate`.
