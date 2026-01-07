#!/bin/bash

# TuneFlow Setup Script
# This script helps set up both the extension and backend components

set -e

echo "🎵 Welcome to TuneFlow Setup!"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 18+."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm detected"
echo ""

# Setup backend
echo "🔧 Setting up TuneFlow Backend..."
echo "=================================="

cd tuneflow-backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit tuneflow-backend/.env with your Spotify credentials:"
    echo "   - SPOTIFY_CLIENT_ID=your_spotify_client_id"
    echo "   - SPOTIFY_CLIENT_SECRET=your_spotify_client_secret"
    echo ""
    echo "📖 Get your Spotify credentials at: https://developer.spotify.com/dashboard"
fi

# Create necessary directories
mkdir -p downloads logs

echo "✅ Backend setup complete"
echo ""

# Setup extension
echo "🔧 Setting up TuneFlow Extension..."
echo "=================================="

cd ../tuneflow-extension

# Install extension dependencies
echo "📦 Installing extension dependencies..."
npm install

echo "✅ Extension setup complete"
echo ""

# Go back to root
cd ..

# Create sample files for testing
mkdir -p sample-files

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔑 Get Spotify credentials:"
echo "   - Visit: https://developer.spotify.com/dashboard"
echo "   - Create a new app"
echo "   - Set redirect URI: http://localhost:3000/callback"
echo "   - Edit: tuneflow-backend/.env"
echo ""
echo "2. 🚀 Start the backend:"
echo "   cd tuneflow-backend"
echo "   npm run dev"
echo ""
echo "3. 🧩 Build and install the extension:"
echo "   cd tuneflow-extension"
echo "   npm run build"
echo "   - Open Chrome: chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked' and select: tuneflow-extension/dist"
echo ""
echo "4. ⚙️  Configure the extension:"
echo "   - Click the TuneFlow icon in your browser"
echo "   - Set backend URL: http://localhost:3001"
echo "   - Connect to Spotify"
echo ""
echo "5. 🎵 Start using TuneFlow:"
echo "   - Go to any YouTube video"
echo "   - Right-click → TuneFlow Download"
echo "   - Select playlist and enjoy!"
echo ""
echo "📖 Full documentation: README.md"
echo ""
echo "🔧 Development Commands:"
echo "   npm run dev              # Start both backend and extension dev servers"
echo "   npm run build            # Build both components"
echo "   npm test                 # Run all tests"
echo ""
echo "Happy listening! 🎧✨"