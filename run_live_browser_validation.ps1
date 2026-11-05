# CareerSense AI - Browser E2E Live Runner
$ErrorActionPreference = "Continue"

Write-Host "================================================================================"
Write-Host "STARTING BACKEND & FRONTEND SERVERS FOR BROWSER VERIFICATION"
Write-Host "================================================================================"

# 1. Start Backend
Write-Host "[1/3] Starting Flask Backend on http://127.0.0.1:5000..."
$backendProc = Start-Process -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "backend\app.py" -PassThru -NoNewWindow

# 2. Start Frontend
Write-Host "[2/3] Starting Vite Frontend on http://localhost:5275..."
$frontendProc = Start-Process -FilePath "npx.cmd" -ArgumentList "vite", "--port", "5275" -WorkingDirectory "frontend" -PassThru -NoNewWindow

# 3. Wait for both servers to be ready
$backendReady = $false
$frontendReady = $false
$attempts = 0

while (($attempts -lt 30) -and (-not ($backendReady -and $frontendReady))) {
    Start-Sleep -Seconds 1
    $attempts++

    if (-not $backendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) {
                $backendReady = $true
                Write-Host "  -> Flask Backend is READY on port 5000."
            }
        } catch {}
    }

    if (-not $frontendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:5275" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($resp.StatusCode -eq 200) {
                $frontendReady = $true
                Write-Host "  -> Vite Frontend is READY on port 5275."
            }
        } catch {}
    }
}

if (-not ($backendReady -and $frontendReady)) {
    Write-Host "[ERROR] Servers failed to start within 30 seconds."
    if ($backendProc -and (-not $backendProc.HasExited)) { Stop-Process -Id $backendProc.Id -Force }
    if ($frontendProc -and (-not $frontendProc.HasExited)) { Stop-Process -Id $frontendProc.Id -Force }
    exit 1
}

# 4. Run Puppeteer Browser Verification
Write-Host "`n[3/3] Launching Chrome Headless & Running Puppeteer E2E Test Suite..."
try {
    node .e2e\comprehensive_browser_test.js
    $testExitCode = $LASTEXITCODE
} catch {
    Write-Host "[ERROR] Test execution failed: $_"
    $testExitCode = 1
}

# 5. Clean up processes
Write-Host "`n[Clean-up] Terminating server processes..."
if ($backendProc -and (-not $backendProc.HasExited)) {
    Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
}
if ($frontendProc -and (-not $frontendProc.HasExited)) {
    Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
}

# Also ensure any lingering node or python processes on port 5000/5275 are terminated
Get-NetTCPConnection -LocalPort 5000, 5275 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "================================================================================"
Write-Host "BROWSER VERIFICATION FINISHED WITH EXIT CODE: $testExitCode"
Write-Host "================================================================================"

exit $testExitCode

