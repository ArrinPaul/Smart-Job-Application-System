# Script to run Smart Job Portal backend locally.
# Usage:
#   .\run-local.ps1
#   .\run-local.ps1 -Profile supabase

param(
    [ValidateSet("local", "supabase")]
    [string]$Profile = "supabase"
)

Set-Location $PSScriptRoot

Write-Host "Loading environment variables from .env file..." -ForegroundColor Cyan

if (Test-Path ".\.env") {
    Get-Content ".\.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim() -replace '^["'']|["'']$', ''
                Set-Item -Path "env:$key" -Value $value -Force
            }
        }
    }
} else {
    Write-Host "No .env file found. Continuing with process environment." -ForegroundColor Yellow
}

$hasSupabaseHost = -not [string]::IsNullOrWhiteSpace($env:SUPABASE_DB_HOST)
if ($Profile -eq "supabase" -and -not $hasSupabaseHost) {
    Write-Host "SUPABASE_DB_HOST is missing. Cannot run with supabase profile." -ForegroundColor Red
    Write-Host "Use .\run-local.ps1 (local profile) or set SUPABASE_DB_HOST in .env" -ForegroundColor Yellow
    Exit 1
}

$env:SPRING_PROFILES_ACTIVE = $Profile
if ($Profile -eq "local") {
    # Force localhost-friendly cookie behavior. .env values have higher precedence
    # than application-local.properties, so set process env explicitly for local runs.
    $env:AUTH_COOKIE_SECURE = "false"
    $env:AUTH_COOKIE_SAME_SITE = "Lax"
    Write-Host "Using local H2 profile for stable localhost development." -ForegroundColor Green
} else {
    Write-Host "Using supabase PostgreSQL profile." -ForegroundColor Green
}

$mavenCmd = ".\bin\apache-maven-3.9.6\bin\mvn.cmd"
if (-not (Test-Path $mavenCmd)) {
    $mavenCmd = "mvn"
}

Write-Host "Starting Smart Job Portal Backend..." -ForegroundColor Cyan
Write-Host "Active profile: $($env:SPRING_PROFILES_ACTIVE)" -ForegroundColor Yellow
Write-Host "Target URL: http://localhost:8080/api" -ForegroundColor Yellow
Write-Host "API Health: http://localhost:8080/api/actuator/health" -ForegroundColor Yellow
Write-Host ""

Write-Host "Building backend JAR (skip tests) ..." -ForegroundColor Cyan
& $mavenCmd -DskipTests clean package

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Exit $LASTEXITCODE
}

$jarPath = Get-ChildItem -Path ".\target" -Filter "jobportalsystem-*.jar" |
    Where-Object { -not $_.Name.EndsWith(".original") } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jarPath) {
    Write-Host "Built JAR not found under .\target" -ForegroundColor Red
    Exit 1
}

Write-Host "Executing: java -Dspring.profiles.active=$($env:SPRING_PROFILES_ACTIVE) -jar $($jarPath.FullName)" -ForegroundColor Magenta
& java "-Dspring.profiles.active=$($env:SPRING_PROFILES_ACTIVE)" -jar $jarPath.FullName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend startup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
} else {
    Write-Host "Backend shut down cleanly" -ForegroundColor Green
}
