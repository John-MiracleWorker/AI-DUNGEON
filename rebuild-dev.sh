#!/bin/bash
# Rebuild and restart development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/tiuni/AI DUNGEON"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    print_warning "Killing existing process on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Function to check Docker
check_docker() {
    print_status "Checking Docker status..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is running"
}

# Main execution
main() {
    print_header "🏰 AI Dungeon Adventure - Development Rebuild & Restart"
    print_header "======================================================"
    
    # Stop services
    print_status "🛑 Stopping services..."
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "expo start" 2>/dev/null || true
    
    # Kill processes on commonly used ports
    kill_port 3001 2>/dev/null || true  # Backend
    kill_port 19006 2>/dev/null || true  # Expo
    kill_port 8081 2>/dev/null || true   # Expo
    kill_port 8082 2>/dev/null || true   # Expo
    
    # Stop Docker containers
    print_status "🛑 Stopping Docker containers..."
    cd "$PROJECT_ROOT"
    if [[ -f "docker-compose.dev.yml" ]]; then
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    fi
    
    # Clean build artifacts
    print_status "🧹 Cleaning build artifacts..."
    rm -rf "$BACKEND_PATH/node_modules" "$BACKEND_PATH/dist"
    rm -rf "$FRONTEND_PATH/node_modules" "$FRONTEND_PATH/web-build"
    
    # Check Docker
    check_docker
    
    # Reinstall dependencies
    print_status "📦 Installing backend dependencies..."
    cd "$BACKEND_PATH"
    npm install --legacy-peer-deps
    
    print_status "📦 Installing frontend dependencies..."
    cd "$FRONTEND_PATH"
    npm install --legacy-peer-deps
    
    # Rebuild
    print_status "🔨 Rebuilding backend..."
    cd "$BACKEND_PATH"
    npm run build
    
    print_status "🔨 Rebuilding frontend..."
    cd "$FRONTEND_PATH"
    npx expo export:web
    
    # Restart services
    print_status "🚀 Restarting services..."
    cd "$PROJECT_ROOT"
    ./launch-game.sh
}

# Execute main function
main