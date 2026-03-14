$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root ".codex-test-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-Section([string]$Message) {
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Stop-Port([int]$Port) {
  $matches = netstat -ano -p TCP | Select-String ":$Port\s"
  $pids = @()
  foreach ($match in $matches) {
    $parts = ($match.Line -split "\s+") | Where-Object { $_ }
    if ($parts.Length -ge 5) {
      $processIdText = $parts[-1]
      if ($processIdText -match "^\d+$" -and $processIdText -ne "0") {
        $pids += [int]$processIdText
      }
    }
  }
  $pids = $pids | Select-Object -Unique
  foreach ($processId in $pids) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Host "Stopped process $processId on port $Port"
    } catch {
      Write-Warning "Could not stop process $processId on port ${Port}: $($_.Exception.Message)"
    }
  }
}

function Wait-HttpOk([string]$Url, [int]$Attempts = 40, [int]$DelayMs = 1000) {
  for ($i = 0; $i -lt $Attempts; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
      if ($response.StatusCode -eq 200) {
        return $true
      }
    } catch {
    }
    Start-Sleep -Milliseconds $DelayMs
  }
  return $false
}

function Start-BackgroundProcess(
  [string]$Name,
  [string]$FilePath,
  [string[]]$Arguments,
  [string]$WorkingDirectory,
  [hashtable]$Environment
) {
  $outLog = Join-Path $logDir "$Name.out.log"
  $errLog = Join-Path $logDir "$Name.err.log"
  if (Test-Path $outLog) { Remove-Item $outLog -Force }
  if (Test-Path $errLog) { Remove-Item $errLog -Force }

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $escapedArguments = $Arguments | ForEach-Object {
    if ($_ -match '\s') {
      '"' + ($_ -replace '"', '\"') + '"'
    } else {
      $_
    }
  }
  $psi.Arguments = [string]::Join(" ", $escapedArguments)
  foreach ($entry in $Environment.GetEnumerator()) {
    $psi.Environment[$entry.Key] = $entry.Value
  }

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi
  $null = $process.Start()

  $stdoutWriter = [System.IO.StreamWriter]::new($outLog, $false)
  $stderrWriter = [System.IO.StreamWriter]::new($errLog, $false)

  Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action {
    if ($EventArgs.Data) { $stdoutWriter.WriteLine($EventArgs.Data); $stdoutWriter.Flush() }
  } | Out-Null
  Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action {
    if ($EventArgs.Data) { $stderrWriter.WriteLine($EventArgs.Data); $stderrWriter.Flush() }
  } | Out-Null

  $process.BeginOutputReadLine()
  $process.BeginErrorReadLine()

  return [PSCustomObject]@{
    Name = $Name
    Process = $process
    OutLog = $outLog
    ErrLog = $errLog
  }
}

Write-Section "Cleaning ports"
Stop-Port 8000
Stop-Port 3000
Stop-Port 8082

Write-Section "Installing dependencies"
Push-Location $root
npm install
Push-Location (Join-Path $root "apps\backend")
python -m pip install -r requirements.txt
Pop-Location

Write-Section "Verification"
python -m pytest (Join-Path $root "apps\backend\tests") -q
npm run typecheck --workspace @fieldlens/shared
npm run typecheck --workspace @fieldlens/web
npm run build --workspace @fieldlens/web

$commonEnv = @{
  AUTH_MODE = "jwt"
  AI_MODE = "mock"
  STORAGE_MODE = "local"
  DATABASE_URL = "sqlite+aiosqlite:///./fieldlens.db"
  JWT_SECRET_KEY = "local-dev-secret"
  RUN_MIGRATIONS_ON_STARTUP = "true"
  SEED_DEFAULT_USERS = "true"
  FRONTEND_URL = "http://127.0.0.1:3000"
  NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000"
  EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000"
  RCT_METRO_PORT = "8082"
  EXPO_PORT = "8082"
}

Write-Section "Starting backend"
$backend = Start-BackgroundProcess `
  -Name "backend" `
  -FilePath "python" `
  -Arguments @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
  -WorkingDirectory (Join-Path $root "apps\backend") `
  -Environment $commonEnv

if (-not (Wait-HttpOk "http://127.0.0.1:8000/health")) {
  throw "Backend did not become ready. See $($backend.ErrLog)"
}

Write-Section "Starting web"
$web = Start-BackgroundProcess `
  -Name "web" `
  -FilePath "cmd.exe" `
  -Arguments @("/c", "npm", "run", "dev", "--workspace", "@fieldlens/web", "--", "--hostname", "127.0.0.1", "--port", "3000") `
  -WorkingDirectory $root `
  -Environment $commonEnv

if (-not (Wait-HttpOk "http://127.0.0.1:3000/login" 60 1000)) {
  throw "Web did not become ready. See $($web.ErrLog)"
}

Write-Section "Starting mobile"
$mobileWorkingDirectory = Join-Path $root "apps\mobile"
$mobileCommand = "set RCT_METRO_PORT=8082&& set EXPO_PORT=8082&& set EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000&& npx expo start --non-interactive --port 8082"
Start-Process cmd.exe -WorkingDirectory $mobileWorkingDirectory -ArgumentList "/k", $mobileCommand | Out-Null

if (-not (Wait-HttpOk "http://127.0.0.1:8082/status" 40 1000)) {
  throw "Expo Metro did not become ready on port 8082."
}

Write-Section "Ready"
Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Web:     http://127.0.0.1:3000/login" -ForegroundColor Green
Write-Host "Mobile:  exp://<your-local-ip>:8082" -ForegroundColor Green
Write-Host "Note:    use an Expo Go build compatible with SDK 52, or a dev build." -ForegroundColor Yellow
Write-Host ""
Write-Host "Logs:"
Write-Host "  Backend out: $($backend.OutLog)"
Write-Host "  Backend err: $($backend.ErrLog)"
Write-Host "  Web out:     $($web.OutLog)"
Write-Host "  Web err:     $($web.ErrLog)"
Write-Host "  Mobile:      launched in a separate cmd window"

Pop-Location
