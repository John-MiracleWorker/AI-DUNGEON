#!/bin/bash
# Rebuild and restart production environment

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

# Main execution
main() {
    print_header "🏰 AI Dungeon Adventure - Production Rebuild & Restart"
    print_header "====================================================="
    
    # Stop services
    print_status "🛑 Stopping production services..."
    cd "$PROJECT_ROOT"
    docker-compose down 2>/dev/null || true
    
    # Clean Docker images
    print_status "🧹 Cleaning Docker images..."
    docker-compose rm -f 2>/dev/null || true
    
    # Remove dangling images
    print_status "🧹 Removing dangling Docker images..."
    docker image prune -f 2>/dev/null || true
    
    # Rebuild and restart
    print_status "🔨 Rebuilding and restarting..."
    ./deploy.sh
}

# Execute main function
main