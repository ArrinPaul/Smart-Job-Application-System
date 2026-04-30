Job Scraper & Supabase Sync
===========================

Automatically collects remote jobs from 7+ sources and syncs to Supabase every 12 hours.

**✅ Runs automatically**: No manual intervention needed! GitHub Actions runs the scraper and sync together every 12 hours.

Files
- `scrape_and_sync.js` — collects ~525 job postings from 7 sources (Remotive, ArbeitNow, WeWorkRemotely, Remote.co, HackerNews, RemoteOK, TheMuse), dedupes, normalizes, and writes to `last_scrape.json`.
- `sync_to_supabase.js` — syncs jobs from `last_scrape.json` directly into Supabase PostgreSQL using backend `.env` credentials. Creates recruiter user, handles UPSERT logic, and maps schema automatically.
- `package.json` — dependencies and scripts.
- `last_scrape.json` — latest scraped jobs (regenerated each run).

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

4. Normalize existing jobs (emoji removal, encoding fix, optional translation)

```bash
LIBRETRANSLATE_URL=https://libretranslate.de node normalize_existing_jobs.js
```

GitHub Actions (Automatic)

The workflow `.github/workflows/job-scraper.yml` runs automatically:
- **Scheduled**: Every 12 hours at 00:00 and 12:00 UTC
- **On demand**: Use `workflow_dispatch` button in Actions tab
- **Actions**:
  1. Install dependencies
  2. Run `node scrape_and_sync.js` → Collect jobs, write to `last_scrape.json`
  3. Run `node sync_to_supabase.js` → Sync 525+ jobs to PostgreSQL
  4. Report results

**No secrets needed**: Database credentials loaded from backend `.env` in the repo.

Recommended secrets (optional)
- `WEBHOOK_NOTIFY_URL` — optional webhook to receive job scrape summaries

Notes
- Scraper runs automatically every 12 hours — no manual work needed!
- Jobs written to `last_scrape.json` for review/audit
- Sync uses direct PostgreSQL connection (safer than REST API)
- UPSERT by slug ensures no duplicate jobs
- Recruiter user auto-created on first sync
- All credentials loaded from backend `.env` (secure & centralized)

Translation settings (optional)
- `LIBRETRANSLATE_URL` — Base URL for LibreTranslate (free option). Default: https://libretranslate.de
- `LIBRETRANSLATE_KEY` — Optional API key if your instance requires it
- `TRANSLATE_DISABLED=true` — Disable translation entirely
- `TRANSLATE_MAX_CHARS=3800` — Chunk size for translation requests
