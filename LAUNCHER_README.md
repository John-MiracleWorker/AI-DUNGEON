# AI Dungeon Game Launcher

This directory contains scripts to easily launch both the backend and frontend services for your AI Dungeon game.

## Quick Start

### Option 1: Full Launch (Recommended)
```bash
./launch-game.sh
```
This will:
1. Start MongoDB and Redis via Docker
2. Start the backend server on port 3001
3. Start the Expo frontend on port 8082
4. Configure network settings for mobile connectivity

### Option 2: Quick Launch (For daily use)
```bash
./quick-launch.sh
```
Simplified version for faster startup during development.

### Option 3: NPM Scripts
```bash
npm run start    # Full launch
npm run quick    # Quick launch
npm run backend  # Backend only
npm run frontend # Frontend only
npm run clean    # Clean up processes
npm run setup    # Install all dependencies
```

## Available Launch Options

### Full Launch Script (`./launch-game.sh`)

**Options:**
- `--help, -h` - Show help message
- `--no-docker` - Skip Docker database startup (if already running)
- `--backend-only` - Start only the backend service
- `--frontend-only` - Start only the frontend service

**Examples:**
```bash
# Full startup
./launch-game.sh

# Backend only (with databases)
./launch-game.sh --backend-only

# Frontend only (assumes backend is running)
./launch-game.sh --frontend-only

# Skip Docker (if databases already running)
./launch-game.sh --no-docker
```

### Quick Launch Script (`./quick-launch.sh`)
- Fastest way to get both services running
- Automatically detects and configures network settings
- Ideal for daily development

## Network Configuration

The scripts automatically:
- Detect your local IP address
- Update frontend `.env` with the correct API URL
- Configure CORS settings in the backend
- Set up mobile connectivity for Expo Go

## Mobile Access

After launching, you can access your app by:
1. **Scanning the QR code** displayed in the terminal with Expo Go app
2. **Opening the Expo URL** in your browser to get the QR code
3. **Using the local network** - the app will be accessible on your mobile device

## Troubleshooting

### Port Conflicts
If you get "port already in use" errors:
```bash
npm run clean
```

### Docker Issues
Make sure Docker Desktop is running:
```bash
docker info
```

### Backend API Key
Ensure your OpenAI API key is set in `/Users/tiuni/AI DUNGEON/backend/.env`:
```
OPENAI_API_KEY=your_key_here
```

### Network Issues
If mobile device can't connect:
1. Check that both devices are on the same network
2. Verify firewall settings
3. Try restarting the frontend service

## File Structure

```
/Users/tiuni/AI DUNGEON/
├── launch-game.sh       # Full launch script (Mac/Linux)
├── quick-launch.sh      # Quick launch script (Mac/Linux)
├── launch-game.ps1      # PowerShell script (Windows)
├── package.json         # NPM scripts for easy launching
├── backend/             # Backend Node.js application
├── frontend/            # React Native/Expo frontend
└── docker-compose.dev.yml # Development databases
```

## Author

**Trent Iuni** (tiuni65@gmail.com)

## Notes

- Scripts are configured for your specific setup at `/Users/tiuni/AI DUNGEON/`
- Network IP detection works for most standard network configurations
- All scripts include cleanup functions to stop services gracefully
- PowerShell version available for Windows users