# TuneFlow - YouTube to Spotify High-Fidelity Bridge

A powerful browser extension and backend service that enables users to download YouTube content in high fidelity and sync it to Spotify playlists with smart source switching.

## 🎵 Features

- **High-Fidelity Audio**: Smart source switching between Deezer, Tidal, Qobuz (via Lucida) and YouTube fallback
- **Context Menu Integration**: Right-click on YouTube videos to download directly
- **Spotify Integration**: Automatic playlist synchronization using Spotify Web API
- **Multiple Formats**: Support for MP3 (320kbps) and FLAC (lossless)
- **Metadata Embedding**: Automatic ID3 tag generation with cover art
- **Progress Tracking**: Real-time download and processing status
- **Cross-Browser**: Works on Chrome, Firefox, and other Chromium-based browsers

## 🏗️ Architecture

### Frontend (Extension)
- **Framework**: React with TypeScript
- **Build Tool**: Plasmo Framework for cross-browser compatibility
- **Styling**: TailwindCSS with custom theme
- **APIs**: Chrome Extension APIs, Spotify Web API

### Backend (Processing Service)
- **Runtime**: Node.js with Express
- **Queue System**: Bull with Redis for job management
- **Audio Processing**: FFmpeg with fluent-ffmpeg
- **Storage**: SQLite for job persistence
- **APIs**: yt-dlp, Spotify Web API integration

## 📁 Project Structure

```
tuneflow/
├── tuneflow-extension/          # Browser Extension
│   ├── src/
│   │   ├── background/         # Service worker
│   │   ├── content/            # Content scripts
│   │   ├── popup/             # Extension popup UI
│   │   ├── services/          # API and business logic
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Utility functions
│   ├── assets/                 # Icons and resources
│   ├── public/                 # Static files
│   └── manifest.json          # Extension manifest
├── tuneflow-backend/           # Backend Service
│   ├── src/
│   │   ├── services/          # Core business logic
│   │   ├── controllers/       # API endpoints
│   │   ├── utils/             # Helper functions
│   │   ├── types/             # TypeScript definitions
│   │   └── middleware/        # Express middleware
│   ├── config/                 # Configuration files
│   └── package.json           # Dependencies
├── docs/                      # Documentation
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- FFmpeg installed on your system
- Redis (optional, for job queue)
- Spotify Developer Account

### 1. Clone and Setup

```bash
git clone <repository-url>
cd tuneflow
```

### 2. Backend Setup

```bash
cd tuneflow-backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your Spotify credentials

# Create downloads directory
mkdir downloads

# Start the backend service
npm run dev
```

### 3. Extension Setup

```bash
cd ../tuneflow-extension
npm install

# Build the extension
npm run build
```

### 4. Install Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `tuneflow-extension/dist` folder
4. The TuneFlow extension should now be installed

### 5. Configure Extension

1. Click the TuneFlow icon in your browser toolbar
2. Set your backend URL (default: `http://localhost:3001`)
3. Click "Connect to Spotify" and authorize the app
4. Test the connection

## ⚙️ Configuration

### Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your Client ID and Client Secret
4. Set redirect URI to `http://localhost:3000/callback`
5. Update your `.env` file with these credentials

### Environment Variables

```env
# Backend Configuration
PORT=3001
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
REDIS_URL=redis://localhost:6379

# Optional: API keys for high-res sources
LUCIDA_API_KEY=your_lucida_key
DEEZER_API_KEY=your_deezer_key
```

## 🎯 Usage

### Basic Download

1. Go to any YouTube video
2. Right-click on the video
3. Select "TuneFlow Download" → "Save to Library"
4. Choose format and quality
5. The file will be downloaded and processed

### Playlist Integration

1. Right-click on a YouTube video
2. Select "TuneFlow Download" → "Add to Spotify Playlist"
3. Choose your playlist from the submenu
4. The extension will:
   - Download the audio file
   - Save it to your local Spotify folder
   - Add the track to your selected playlist

### Settings

Access the extension popup to configure:
- Backend URL
- Default audio format and quality
- Auto-sync preferences
- Spotify connection status

## 🔧 API Endpoints

### Core Processing
- `POST /process` - Start download job
- `GET /status/:jobId` - Get job status
- `GET /download/:jobId` - Download processed file

### Spotify Integration
- `GET /spotify/playlists` - Get user playlists
- `POST /spotify/playlist/:playlistId/tracks` - Add tracks to playlist

## 🏭 Architecture Details

### Smart Source Switching

The backend implements a tiered approach to audio sourcing:

1. **Tier 1 - High-Res Sources**: 
   - Search Deezer, Tidal, Qobuz via Lucida API
   - Prioritize lossless formats (FLAC, ALAC)
   - Fallback to high-quality streams

2. **Tier 2 - YouTube Fallback**:
   - Use yt-dlp for YouTube audio extraction
   - Select best available quality (Opus/AAC)
   - Normalize to target format

### Job Queue System

- Uses Bull queue with Redis for reliability
- Supports concurrent processing with rate limiting
- Persistent job storage in SQLite
- Automatic retry with exponential backoff

### Audio Processing Pipeline

1. **Metadata Extraction**: Parse YouTube video metadata
2. **Source Selection**: Apply smart switching logic
3. **Download**: Retrieve audio from selected source
4. **Conversion**: Normalize with FFmpeg
5. **Enhancement**: Embed metadata and cover art
6. **Storage**: Save to downloads directory

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd tuneflow-backend
npm test

# Extension tests
cd tuneflow-extension
npm test
```

### Building for Production

```bash
# Build extension
cd tuneflow-extension
npm run build

# Build backend
cd ../tuneflow-backend
npm run build
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check
```

## 🔒 Security & Privacy

- **No Telemetry**: The extension collects no user data
- **Local Processing**: All audio processing happens locally
- **Secure Storage**: OAuth tokens encrypted in browser storage
- **Rate Limiting**: Prevents abuse of source platforms
- **Permission-Based**: Only requests necessary browser permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

This tool is for educational and personal use only. Users are responsible for:
- Complying with YouTube's Terms of Service
- Respecting copyright laws in their jurisdiction
- Ensuring they have rights to download and use the content
- Following Spotify's API Terms of Service

The developers are not responsible for any misuse of this software.

## 🆘 Support

- **Documentation**: Check the `docs/` folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join our GitHub Discussions for community support

## 🎉 Acknowledgments

- **yt-dlp** for YouTube audio extraction
- **FFmpeg** for audio processing capabilities
- **Spotify** for their comprehensive Web API
- **Plasmo** for the excellent extension framework
- **Lucida** for high-resolution audio source integration

---

**Built with ❤️ for music lovers who demand quality**