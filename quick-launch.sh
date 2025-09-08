#!/bin/bash

# Quick AI Dungeon Launcher
# Simple script for daily development

cd "/Users/tiuni/AI DUNGEON"

echo "🏰 Quick launching AI Dungeon..."

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

# Start databases
echo "Starting databases..."
docker-compose -f docker-compose.dev.yml up -d

# Wait a moment for databases
sleep 3

# Start backend
echo "Starting backend..."
cd backend
npm run dev &
backend_pid=$!

# Wait for backend to start
echo "Waiting for backend..."
sleep 5

# Start frontend
echo "Starting frontend..."
cd ../frontend

# Get local IP
local_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "EXPO_PUBLIC_API_URL=http://$local_ip:3001/api" > .env

echo "Starting Expo on port 8082..."
echo "Scan QR code with Expo Go app on your phone"
EXPO_CLI_BEHAVIOR=non-interactive npx expo start --port 8082

# Cleanup on exit
trap 'kill $backend_pid 2>/dev/null; docker-compose -f ../docker-compose.dev.yml down' EXIT