Job Scraper (tools/scraper)
===========================

This folder contains a lightweight Node scraper and a Supabase sync helper used by the project's GitHub Actions workflow.

Files
- `scrape_and_sync.js` — collects job postings from multiple sources (Remotive, ArbeitNow, WeWorkRemotely, Remote.co, Hacker News), dedupes locally, formats descriptions, and posts to backend ingest endpoint (`/public/ingest-real-jobs`).
- `sync_to_supabase.js` — optional helper that will upsert jobs directly into Supabase using the service role key and REST API.
- `package.json` — scripts: `start` and `sync:supabase`.

How to run locally (recommended for testing)

1. Install dependencies

```bash
cd tools/scraper
npm ci
```

2. Run the scraper and post to backend (default expects `BACKEND_URL` env)

```bash
BACKEND_URL=http://localhost:8080 node scrape_and_sync.js
```

3. Directly sync to Supabase (requires service role key)

```bash
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_KEY=<service-role-key> node sync_to_supabase.js
```

GitHub Actions

The workflow `.github/workflows/job-scraper.yml` runs every 12 hours and will:
- Trigger backend scraper endpoint at `${BACKEND_URL}/public/trigger-scrape` (if `BACKEND_URL` secret is set)
- Run the included Node scraper (`scrape_and_sync.js`)
- Optionally, the Node scraper posts a small summary to `WEBHOOK_NOTIFY_URL` (set as a secret)

Recommended secrets to add to your repo
- `BACKEND_URL` — URL to your backend API
- `SCRAPER_TRIGGER_TOKEN` — optional bearer token for protected backend trigger
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` — if you want the workflow to sync directly to Supabase (not recommended unless you need it)
- `WEBHOOK_NOTIFY_URL` — optional webhook to receive ingestion summaries

Notes
- The backend ingest endpoint is the safest way to insert records because it centralizes validation and dedupe logic in the Java backend.
- `sync_to_supabase.js` performs an upsert using `slug` as the conflict key. It generates deterministic slugs from `title + company` to allow idempotent upserts.
- If you prefer, I can make the scraper write the scraped job batch to a JSON file for review before syncing.
