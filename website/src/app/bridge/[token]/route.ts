import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const setupScript = `
$ErrorActionPreference = 'Stop'
Write-Host "--- TunePort Bridge Setup ---" -ForegroundColor Cyan

# Detect or Install Spicetify
if (!(Get-Command spicetify -ErrorAction SilentlyContinue)) {
    Write-Host "Spicetify not found. Installing..." -ForegroundColor Gray
    iwr -useb https://raw.githubusercontent.com/spicetify/cli/master/install.ps1 | iex
    $env:Path += ";$env:APPDATA\\spicetify"
}

try {
    $spicetifyPath = spicetify -c | Split-Path
    $extensionsPath = Join-Path $spicetifyPath "Extensions"
    $targetFile = Join-Path $extensionsPath "tuneport.js"

    if (!(Test-Path $extensionsPath)) {
        New-Item -ItemType Directory -Force -Path $extensionsPath | Out-Null
    }

    Write-Host "Downloading TunePort script..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Microck/tuneport/main/spicetify-extension/tuneport.js" -OutFile $targetFile

    Write-Host "Configuring token..." -ForegroundColor Gray
    (Get-Content $targetFile) -replace "STATIC_TOKEN = .+", "STATIC_TOKEN = '${token}'" | Set-Content $targetFile

    Write-Host "Applying Spicetify changes..." -ForegroundColor Gray
    # Try apply, if it fails (never backed up), run backup apply
    try {
        spicetify apply
    } catch {
        spicetify backup apply
    }

    Write-Host "Done! TunePort Bridge is now active in Spotify." -ForegroundColor Green
    Read-Host "Press Enter to exit..."
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "The command failed. Please make sure Spotify is installed and try again." -ForegroundColor Gray
    Read-Host "Press Enter to exit..."
    exit 1
}
`.trim();

  return new Response(setupScript, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
