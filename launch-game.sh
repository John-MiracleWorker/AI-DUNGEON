#!/bin/bash

# AI Dungeon Game Launcher Script
# This script launches both backend and frontend services
# Author: Trent Iuni (tiuni65@gmail.com)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# Function to get local IP address
get_local_ip() {
    # Try different methods to get local IP
    local ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    if [[ -z "$ip" ]]; then
        ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "192.168.1.100")
    fi
    echo $ip
}

# Function to update frontend .env with current IP
update_frontend_env() {
    local ip=$1
    local env_file="$FRONTEND_PATH/.env"
    
    print_status "Updating frontend .env with IP: $ip"
    echo "EXPO_PUBLIC_API_URL=http://$ip:3001/api" > "$env_file"
    print_success "Frontend .env updated"
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

# Function to start databases
start_databases() {
    print_header "=== Starting Databases ==="
    
    cd "$PROJECT_ROOT"
    
    if [[ -f "docker-compose.dev.yml" ]]; then
        print_status "Starting MongoDB and Redis with docker-compose..."
        docker-compose -f docker-compose.dev.yml up -d
        
        print_status "Waiting for databases to be ready..."
        sleep 5
        
        # Check if MongoDB is ready
        local mongo_ready=false
        for i in {1..30}; do
            if docker-compose -f docker-compose.dev.yml exec -T mongodb mongosh --eval "db.admin.command('ping')" &>/dev/null; then
                mongo_ready=true
                break
            fi
            sleep 1
        done
        
        if [[ "$mongo_ready" == true ]]; then
            print_success "MongoDB is ready"
        else
            print_warning "MongoDB may not be fully ready, but continuing..."
        fi
        
        # Check if Redis is ready
        if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping | grep -q "PONG"; then
            print_success "Redis is ready"
        else
            print_warning "Redis may not be ready, but continuing..."
        fi
        
    else
        print_error "docker-compose.dev.yml not found"
        exit 1
    fi
}

# Function to start backend
start_backend() {
    print_header "=== Starting Backend ==="
    
    # Kill existing backend process if running
    if check_port 3001; then
        kill_port 3001
    fi
    
    cd "$BACKEND_PATH"
    
    # Check if .env exists and has OpenAI key
    if [[ -f ".env" ]]; then
        if grep -q "OPENAI_API_KEY=" ".env"; then
            print_success "Backend .env file found with OpenAI API key"
        else
            print_warning "OpenAI API key not found in backend .env"
        fi
    else
        print_error "Backend .env file not found"
        exit 1
    fi
    
    print_status "Installing backend dependencies..."
    npm install --legacy-peer-deps
    
    print_status "Starting backend server..."
    # Start backend in background
    nohup npm run dev > backend.log 2>&1 &
    backend_pid=$!
    
    # Wait for backend to start
    print_status "Waiting for backend to start on port 3001..."
    for i in {1..30}; do
        if check_port 3001; then
            if curl -s http://localhost:3001/health > /dev/null; then
                print_success "Backend is running on port 3001"
                return 0
            fi
        fi
        sleep 2
    done
    
    print_error "Backend failed to start properly"
    exit 1
}

# Function to start frontend
start_frontend() {
    print_header "=== Starting Frontend ==="
    
    cd "$FRONTEND_PATH"
    
    # Get local IP for mobile connectivity
    local local_ip=$(get_local_ip)
    print_status "Detected local IP: $local_ip"
    
    # Update frontend .env
    update_frontend_env "$local_ip"
    
    # Update backend CORS if needed
    local backend_env="$BACKEND_PATH/.env"
    if [[ -f "$backend_env" ]]; then
        if ! grep -q "exp://$local_ip:8081" "$backend_env"; then
            print_status "Updating backend CORS settings..."
            sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://$local_ip:8081,exp://$local_ip:8081|" "$backend_env"
            print_warning "Backend CORS updated. You may need to restart the backend for changes to take effect."
        fi
    fi
    
    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    
    # Kill existing Expo processes
    if check_port 8081; then
        kill_port 8081
    fi
    if check_port 8082; then
        kill_port 8082
    fi
    
    print_status "Starting Expo development server..."
    print_status "Frontend will be available at: http://$local_ip:8082"
    print_status "Scan the QR code with Expo Go app on your mobile device"
    
    # Start Expo on port 8082 to avoid conflicts
    EXPO_CLI_BEHAVIOR=non-interactive npx expo start --port 8082
}

# Function to cleanup on exit
cleanup() {
    print_header "=== Cleanup ==="
    print_status "Stopping services..."
    
    # Kill backend
    if [[ -n "$backend_pid" ]]; then
        kill $backend_pid 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    kill_port 3001 2>/dev/null || true
    kill_port 8081 2>/dev/null || true
    kill_port 8082 2>/dev/null || true
    
    print_success "Cleanup complete"
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Main execution
main() {
    print_header "🏰 AI Dungeon Game Launcher"
    print_header "=========================="
    
    # Check prerequisites
    check_docker
    
    # Start services in order
    start_databases
    start_backend
    start_frontend
}

# Help function
show_help() {
    echo "AI Dungeon Game Launcher"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --no-docker    Skip Docker database startup (use if databases are already running)"
    echo "  --backend-only Start only the backend service"
    echo "  --frontend-only Start only the frontend service"
    echo ""
    echo "This script will:"
    echo "1. Start MongoDB and Redis via Docker"
    echo "2. Start the backend server on port 3001"
    echo "3. Start the Expo frontend on port 8082"
    echo "4. Configure network settings for mobile connectivity"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --no-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute based on options
if [[ "$BACKEND_ONLY" == true ]]; then
    print_header "🏰 Starting Backend Only"
    if [[ "$SKIP_DOCKER" != true ]]; then
        check_docker
        start_databases
    fi
    start_backend
    print_success "Backend is running. Press Ctrl+C to stop."
    wait
elif [[ "$FRONTEND_ONLY" == true ]]; then
    print_header "🏰 Starting Frontend Only"
    start_frontend
else
    # Run full startup
    if [[ "$SKIP_DOCKER" != true ]]; then
        main
    else
        print_header "🏰 AI Dungeon Game Launcher (Skipping Docker)"
        print_header "============================================="
        start_backend
        start_frontend
    fi
fi