#!/bin/bash

# AI Dungeon APK Build Helper Script
# This script helps you prepare for APK builds

echo "🏰 AI Dungeon APK Build Helper"
echo "=============================="

# Check if backend is running
echo ""
echo "📡 Checking backend status..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running locally on port 3001"
else
    echo "❌ Backend is not running locally"
fi

echo ""
echo "🚀 APK Build Options:"
echo ""
echo "1. 🌐 EAS Build (Cloud - Recommended)"
echo "   - Builds APK in the cloud"
echo "   - No local Android setup required"
echo "   - Requires Expo account"
echo ""
echo "2. 🔧 Local Build"
echo "   - Requires Android Studio"
echo "   - Builds locally on your machine"
echo ""
echo "3. 🧪 Testing with ngrok"
echo "   - Exposes local backend to internet"
echo "   - Good for testing APK with local backend"
echo ""

echo "📋 Next Steps:"
echo ""
echo "For EAS Build (Recommended):"
echo "1. Run: npx eas login"
echo "2. Run: npx eas build --platform android --profile preview"
echo ""
echo "For ngrok testing:"
echo "1. Install ngrok: brew install ngrok"
echo "2. Run: ngrok http 3001"
echo "3. Update .env.production with ngrok URL"
echo "4. Build APK with: npx eas build --platform android --profile preview"
echo ""
echo "🔑 Important: Update EXPO_PUBLIC_API_URL in .env.production"
echo "Current: $(cat .env.production | grep EXPO_PUBLIC_API_URL)"