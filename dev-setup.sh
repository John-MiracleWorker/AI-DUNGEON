#!/bin/bash

# Dungeon AI Adventure - Development Deployment Script

set -e

echo "🏰 Starting Dungeon AI Adventure Development Environment..."

# Check if .env file exists, if not copy from backend
if [ ! -f .env ]; then
    if [ -f backend/.env ]; then
        echo "📋 Copying .env from backend..."
        cp backend/.env .env
    else
        echo "❌ No .env file found. Please configure environment variables."
        exit 1
    fi
fi

# Start development services (MongoDB + Redis only)
echo "🔨 Starting development databases..."
docker-compose -f docker-compose.dev.yml up -d mongodb redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

echo ""
echo "✅ Development environment ready!"
echo ""
echo "🚀 To start the application:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run web"
echo "   Or use:   ./start.sh"
echo ""
echo "🗄️ Database URLs:"
echo "   MongoDB: mongodb://localhost:27017/dungeon-ai"
echo "   Redis: redis://localhost:6379"
echo ""
echo "📊 Database Management:"
echo "   Stop: docker-compose -f docker-compose.dev.yml down"
echo "   Logs: docker-compose -f docker-compose.dev.yml logs [mongodb|redis]"
echo ""