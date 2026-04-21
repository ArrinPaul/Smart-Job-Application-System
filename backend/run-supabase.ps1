param()

Set-Location $PSScriptRoot

if (-not (Test-Path ".\run-local.ps1")) {
    Write-Host "run-local.ps1 not found in backend folder." -ForegroundColor Red
    exit 1
}

Write-Host "Starting backend with Supabase profile..." -ForegroundColor Cyan
& .\run-local.ps1 -Profile supabase
