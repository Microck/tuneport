#!/bin/bash

# TuneFlow Setup Script
# This script helps set up the extension for development

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

# Setup extension
echo "🔧 Setting up TuneFlow Extension..."
echo "=================================="

cd tuneflow-extension

# Install extension dependencies
echo "📦 Installing extension dependencies..."
npm install

echo "✅ Extension setup complete"
echo ""

# Go back to root
cd ..

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🧩 Build the extension:"
echo "   npm run build"
echo ""
echo "2. 🚀 Install in Chrome:"
echo "   - Open Chrome: chrome://extensions/"
echo "   - Enable Developer mode (top right)"
echo "   - Click 'Load unpacked'"
echo "   - Select: tuneflow-extension/dist"
echo ""
echo "3. 🎵 Start using TuneFlow:"
echo "   - Click TuneFlow icon in your browser"
echo "   - Connect to Spotify"
echo "   - Open any YouTube video"
echo "   - Right-click → Add to Spotify Playlist"
echo "   - Select playlist and enjoy!"
echo ""
echo "🔧 Development Commands:"
echo "   npm run dev              # Start extension dev server"
echo "   npm run build            # Build extension for production"
echo "   npm run package          # Create .zip package for distribution"
echo ""
echo "📖 Full documentation: README.md"
echo ""
echo "Happy listening! 🎧✨"
