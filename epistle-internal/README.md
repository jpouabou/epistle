# Epistle Internal

Internal admin tool for Epistle scriptures. Separate from the Epistle mobile app.

## Tech stack

- **Frontend:** Next.js (React) + TailwindCSS
- **Backend:** NestJS (TypeScript)
- **Data:** Supabase (Postgres + Storage). Backend uses the **Service Role** key only; the frontend never sees it.

## Repo structure

```
epistle-internal/
├── frontend/          # Next.js + Tailwind
├── backend/           # NestJS API
├── supabase/
│   └── migrations/    # SQL for characters, character_avatars, epistle_verses
├── package.json       # Root scripts (concurrent dev)
└── README.md
```

## Setup

### 1. Install dependencies

From repo root:

```bash
cd epistle-internal
npm run install:all
```

Or manually:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Supabase

- Create a Supabase project (or use existing Epistle project).
- Run the migrations in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor (Dashboard → SQL Editor). This creates `public.characters`, `public.character_avatars`, and `public.epistle_verses` if they don’t exist.
- In Supabase: Settings → API → copy **Project URL** and **service_role** key (never use service_role in the frontend).

### 3. Backend env

In `backend/` create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
```

### 4. Frontend env

In `frontend/` create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 5. Run locally

From `epistle-internal/`:

```bash
npm run dev
```

This starts:

- **Backend:** http://localhost:4000  
- **Frontend:** http://localhost:3000  

Open http://localhost:3000 and go to **Scriptures** to use the admin UI.

## API (NestJS)

- `GET /verses` — list verses (query: `search`, `character_id`)
- `GET /verses/:id` — one verse (with character + avatar signed URL)
- `POST /verses` — create verse
- `PATCH /verses/:id` — update verse
- `DELETE /verses/:id` — delete verse
- `GET /characters` — list characters
- `GET /characters/:id/avatars` — avatars for a character

Avatar preview images are returned as **signed URLs** from the backend (Storage); the frontend never uses the service role key.

## MVP scope

- No auth (internal tool only).
- Scriptures list with search (reference / author / tags) and character filter.
- Verse CRUD: Create, View, Edit, Delete.
- Avatar thumbnails via backend-signed URLs; fallback to first active avatar for the verse’s character, or placeholder.
