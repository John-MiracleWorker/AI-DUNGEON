#!/bin/bash

# Dungeon AI Adventure - Production Deployment Script

set -e

echo "🏰 Deploying Dungeon AI Adventure to Production..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.docker.example to .env and configure it."
    exit 1
fi

# Check if OpenAI API key is set
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "your_openai_api_key_here" .env; then
    echo "❌ OpenAI API key not configured in .env file."
    exit 1
fi

# Check if EXPO_PUBLIC_API_URL is set
if ! grep -q "EXPO_PUBLIC_API_URL=" .env; then
    echo "❌ EXPO_PUBLIC_API_URL not configured in .env file."
    exit 1
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting production services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "🌐 Access URLs:"
echo "   Game: http://localhost:3000"
echo "   API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo ""
echo "📊 Service Management:"
echo "   View logs: docker-compose logs [service]"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart [service]"
echo ""