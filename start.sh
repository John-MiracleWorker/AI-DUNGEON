#!/bin/bash

# Dungeon AI Adventure - Start Script
# This script starts both backend and frontend services

echo "🏰 Starting Dungeon AI Adventure..."

# Check if MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo "🗄️ Starting MongoDB..."
    brew services start mongodb/brew/mongodb-community
fi

# Check if Redis is running
if ! pgrep -x redis-server > /dev/null; then
    echo "⚡ Starting Redis..."
    brew services start redis
fi

# Start backend and frontend concurrently
echo "🚀 Starting backend and frontend..."

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd ../frontend
npm run web &
FRONTEND_PID=$!

echo ""
echo "🎮 Dungeon AI Adventure is starting up..."
echo ""
echo "🌐 URLs:"
echo "   Game: http://localhost:19006"
echo "   API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo ""
echo "📱 You can also scan the QR code to open on mobile device"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit 0' INT

# Keep script running
wait