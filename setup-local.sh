#!/bin/bash

# Dungeon AI Adventure - Local Setup Script
# This script will install all necessary dependencies for local development

echo "🏰 Setting up Dungeon AI Adventure for local development..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please install MongoDB and Redis manually on your system."
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
fi

# Install MongoDB Community Edition
echo "🗄️ Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    brew tap mongodb/brew
    brew install mongodb-community
    
    # Start MongoDB service
    brew services start mongodb/brew/mongodb-community
    echo "✅ MongoDB installed and started"
else
    echo "✅ MongoDB already installed"
    # Ensure it's running
    brew services restart mongodb/brew/mongodb-community
fi

# Install Redis
echo "⚡ Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    brew install redis
    
    # Start Redis service
    brew services start redis
    echo "✅ Redis installed and started"
else
    echo "✅ Redis already installed"
    # Ensure it's running
    brew services restart redis
fi

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📱 Installing frontend dependencies..."
cd ../frontend
npm install --legacy-peer-deps

# Create necessary directories
echo "📁 Creating log directories..."
cd ../backend
mkdir -p logs

echo ""
echo "🎉 Setup complete! Your local environment is ready."
echo ""
echo "🔑 Next steps:"
echo "1. The OpenAI API key is already configured in backend/.env"
echo "2. MongoDB is running on mongodb://localhost:27017"
echo "3. Redis is running on redis://localhost:6379"
echo ""
echo "🚀 To start the application:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run web"
echo ""
echo "🌐 The game will be available at:"
echo "   Web: http://localhost:19006"
echo "   API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo ""

cd ..