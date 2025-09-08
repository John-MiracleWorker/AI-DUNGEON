# AI Dungeon Game Launcher - PowerShell Version
# This script launches both backend and frontend services for Windows users

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$NoDocker,
    [switch]$Help
)

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

function Write-Status($Message) {
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success($Message) {
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning($Message) {
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error($Message) {
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Show-Help {
    Write-Host "AI Dungeon Game Launcher (PowerShell)" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Usage: .\launch-game.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help          Show this help message"
    Write-Host "  -NoDocker      Skip Docker database startup"
    Write-Host "  -BackendOnly   Start only the backend service"
    Write-Host "  -FrontendOnly  Start only the frontend service"
    Write-Host ""
}

if ($Help) {
    Show-Help
    exit 0
}

# Project paths
$ProjectRoot = "C:\Users\$env:USERNAME\AI DUNGEON"  # Adjust this path as needed
$BackendPath = "$ProjectRoot\backend"
$FrontendPath = "$ProjectRoot\frontend"

function Test-Port($Port) {
    try {
        $Connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $Connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

function Stop-ProcessOnPort($Port) {
    Write-Warning "Stopping processes on port $Port..."
    try {
        Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        # Ignore errors
    }
}

function Start-Databases {
    Write-Host "=== Starting Databases ===" -ForegroundColor $Cyan
    
    Set-Location $ProjectRoot
    
    if (Test-Path "docker-compose.dev.yml") {
        Write-Status "Starting MongoDB and Redis with docker-compose..."
        docker-compose -f docker-compose.dev.yml up -d
        
        Write-Status "Waiting for databases..."
        Start-Sleep -Seconds 5
        
        Write-Success "Databases started"
    }
    else {
        Write-Error "docker-compose.dev.yml not found"
        exit 1
    }
}

function Start-Backend {
    Write-Host "=== Starting Backend ===" -ForegroundColor $Cyan
    
    if (Test-Port 3001) {
        Stop-ProcessOnPort 3001
    }
    
    Set-Location $BackendPath
    
    Write-Status "Installing backend dependencies..."
    npm install --legacy-peer-deps
    
    Write-Status "Starting backend server..."
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    Write-Status "Waiting for backend to start..."
    $count = 0
    while (-not (Test-Port 3001) -and $count -lt 30) {
        Start-Sleep -Seconds 2
        $count++
    }
    
    if (Test-Port 3001) {
        Write-Success "Backend is running on port 3001"
    }
    else {
        Write-Error "Backend failed to start"
        exit 1
    }
}

function Start-Frontend {
    Write-Host "=== Starting Frontend ===" -ForegroundColor $Cyan
    
    Set-Location $FrontendPath
    
    # Get local IP
    $LocalIP = (Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null}).IPv4Address.IPAddress | Select-Object -First 1
    Write-Status "Detected local IP: $LocalIP"
    
    # Update .env
    "EXPO_PUBLIC_API_URL=http://$LocalIP:3001/api" | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Status "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    
    if (Test-Port 8082) {
        Stop-ProcessOnPort 8082
    }
    
    Write-Status "Starting Expo development server..."
    Write-Status "Frontend will be available at: http://$LocalIP:8082"
    
    $env:EXPO_CLI_BEHAVIOR = "non-interactive"
    npx expo start --port 8082
}

# Main execution
Write-Host "🏰 AI Dungeon Game Launcher" -ForegroundColor $Cyan
Write-Host "==========================" -ForegroundColor $Cyan

try {
    if ($BackendOnly) {
        if (-not $NoDocker) { Start-Databases }
        Start-Backend
        Write-Host "Backend is running. Press Ctrl+C to stop." -ForegroundColor $Green
        Read-Host "Press Enter to stop"
    }
    elseif ($FrontendOnly) {
        Start-Frontend
    }
    else {
        if (-not $NoDocker) { Start-Databases }
        Start-Backend
        Start-Frontend
    }
}
catch {
    Write-Error "An error occurred: $_"
    exit 1
}