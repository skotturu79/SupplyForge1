<#
.SYNOPSIS
  Clean restart of SupplyForge frontend (port 3003) and backend (port 3001).

.PARAMETER Docker
  Also restart Docker Compose services before starting dev servers.

.PARAMETER ApiOnly
  Restart only the API (port 3001).

.PARAMETER WebOnly
  Restart only the Web (port 3003).

.EXAMPLE
  .\scripts\restart-dev.ps1
  .\scripts\restart-dev.ps1 -Docker
  .\scripts\restart-dev.ps1 -ApiOnly
#>
param(
    [switch]$Docker,
    [switch]$ApiOnly,
    [switch]$WebOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT = Split-Path $PSScriptRoot -Parent

function Write-Step([string]$msg) {
    Write-Host "`n  $msg" -ForegroundColor Cyan
}
function Write-OK([string]$msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}
function Write-Warn([string]$msg) {
    Write-Host "  [!!] $msg" -ForegroundColor Yellow
}

# ── Kill processes on a given port ────────────────────────────────────────────
function Stop-Port([int]$port) {
    $pids = (netstat -ano | Select-String ":$port\s" |
             ForEach-Object { ($_ -split '\s+')[-1] } |
             Sort-Object -Unique) -as [int[]]
    if (-not $pids) {
        Write-Warn "Nothing on port $port"
        return
    }
    foreach ($pid in $pids) {
        if ($pid -gt 0) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    $proc | Stop-Process -Force
                    Write-OK "Killed PID $pid ($($proc.Name)) on port $port"
                }
            } catch {
                Write-Warn "Could not kill PID $pid : $_"
            }
        }
    }
}

# ── Clear Next.js and NestJS build caches ─────────────────────────────────────
function Clear-DevCaches {
    $dirs = @(
        "$ROOT\apps\web\.next",
        "$ROOT\apps\api\dist",
        "$ROOT\.turbo"
    )
    foreach ($d in $dirs) {
        if (Test-Path $d) {
            Remove-Item $d -Recurse -Force
            Write-OK "Cleared $d"
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  SupplyForge Dev Restart" -ForegroundColor White
Write-Host "  ────────────────────────────────────" -ForegroundColor DarkGray

# ── 1. Kill running dev servers ───────────────────────────────────────────────
Write-Step "Stopping dev servers..."
if (-not $WebOnly) { Stop-Port 3001 }
if (-not $ApiOnly)  { Stop-Port 3003 }

# ── 2. Clear caches ───────────────────────────────────────────────────────────
Write-Step "Clearing build caches..."
Clear-DevCaches

# ── 3. (Optional) restart Docker services ─────────────────────────────────────
if ($Docker) {
    Write-Step "Restarting Docker services..."
    Push-Location $ROOT
    docker compose -f infrastructure/docker/docker-compose.yml down --remove-orphans
    docker compose -f infrastructure/docker/docker-compose.yml up -d
    Write-OK "Docker services up"
    Pop-Location
    Write-Step "Waiting 5s for services to be ready..."
    Start-Sleep -Seconds 5
}

# ── 4. Start dev servers ──────────────────────────────────────────────────────
Push-Location $ROOT

if ($ApiOnly) {
    Write-Step "Starting API only (port 3001)..."
    Set-Location apps/api
    npm run start:dev

} elseif ($WebOnly) {
    Write-Step "Starting Web only (port 3003)..."
    Set-Location apps/web
    npm run dev

} else {
    Write-Step "Starting API + Web via Turborepo..."
    npm run dev
}

Pop-Location
