# Starts a local web server and opens the game in your default browser.
# Double-click Start-Game.bat on Windows to run.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$port = 8000
$url = "http://localhost:$port"

Write-Host "Starting local server with: py -m http.server $port" -ForegroundColor Cyan
Write-Host "Game URL: $url" -ForegroundColor Cyan

# Open browser after a short delay so the server has time to initialize.
Start-Job -ScriptBlock {
    param($launchUrl)
    Start-Sleep -Seconds 1
    Start-Process $launchUrl
} -ArgumentList $url | Out-Null

py -m http.server $port
