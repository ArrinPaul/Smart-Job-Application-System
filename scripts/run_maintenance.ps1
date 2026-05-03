# Local script to run full job maintenance (Scrape -> Sync -> Normalize -> Deduplicate)
# This mirrors the GitHub Action workflow behavior.

$ScriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location "$ScriptFolder\..\tools\scraper"

Write-Host "Starting Full Job Maintenance..." -ForegroundColor Cyan

# Check for node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run the unified maintenance script
# This script handles:
# 1. Scraping new jobs (scrape_and_sync.js)
# 2. Database Sync (sync_to_supabase.js)
# 3. Deep Normalization (Emoji Removal, Formatting)
# 4. Deduplication
node daily_maintenance.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "Full Job Maintenance completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Full Job Maintenance failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
