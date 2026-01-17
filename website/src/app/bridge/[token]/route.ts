import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const { searchParams } = new URL(request.url);
  const installSpicetify = searchParams.get('install') === 'true';

  const setupScript = `
$ErrorActionPreference = 'Stop'
Write-Host "--- TunePort Bridge Setup ---" -ForegroundColor Cyan

if ("${installSpicetify}" -eq "True") {
    Write-Host "Installing Spicetify..." -ForegroundColor Gray
    iwr -useb https://raw.githubusercontent.com/spicetify/cli/master/install.ps1 | iex
}

try {
    $spicetifyPath = spicetify -c | Split-Path
    $extensionsPath = Join-Path $spicetifyPath "Extensions"
    $targetFile = Join-Path $extensionsPath "tuneport.js"

    Write-Host "Downloading TunePort script..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Microck/tuneport/main/spicetify-extension/tuneport.js" -OutFile $targetFile

    Write-Host "Configuring token..." -ForegroundColor Gray
    (Get-Content $targetFile) -replace "STATIC_TOKEN = .+", "STATIC_TOKEN = '${token}'" | Set-Content $targetFile

    Write-Host "Applying Spicetify changes..." -ForegroundColor Gray
    if ("${installSpicetify}" -eq "True") {
        spicetify backup apply
    } else {
        spicetify apply
    }

    Write-Host "Done! TunePort Bridge is now active in Spotify." -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
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
