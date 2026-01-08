# TuneFlow - YouTube to Spotify

A simple browser extension that lets you add YouTube videos to your Spotify playlists with just one click.

## 🎵 Features

- **One-Click Adding**: Right-click any YouTube video to add it to your Spotify playlists
- **Smart Matching**: Automatically finds the matching track on Spotify
- **No Setup Required**: Just install and connect to Spotify
- **100% Client-Side**: No backend, no configuration, no hassle
- **Cross-Browser**: Works on Chrome, Firefox, and other Chromium-based browsers

## 🚀 Installation

### Option 1: Chrome Web Store (Coming Soon)

Search for "TuneFlow" in the Chrome Web Store and click "Add to Chrome"

### Option 2: Manual Installation (For Development)

1. Download the latest release
2. Unzip the downloaded file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder
6. TuneFlow is now installed!

## 📝 How to Use

1. **Install the extension** (see above)
2. **Click the TuneFlow icon** in your browser toolbar
3. **Click "Connect to Spotify"** to authorize the extension
4. **Open any YouTube video** you want to add
5. **Right-click** on the video and select "Add to Spotify Playlist"
6. **Choose your playlist** from the menu
7. **Done!** The track is now in your Spotify playlist

Alternatively, you can:
- Click the TuneFlow icon while on a YouTube video
- Select a playlist from the popup
- The track will be added automatically

## ✨ What It Does

TuneFlow makes it easy to build your Spotify playlists from YouTube content:

1. **Extracts metadata** from YouTube videos (title, artist, etc.)
2. **Searches Spotify** for the matching track
3. **Adds the track** to your selected playlist

**Note**: TuneFlow does NOT download audio files. It finds and adds the Spotify version of the track to your playlists. This ensures high-quality streaming and supports the artists directly.

## 🔒 Privacy & Security

- **No Data Collection**: We don't collect or store any user data
- **Local Storage**: Your Spotify tokens are stored only in your browser
- **Secure OAuth**: Uses Spotify's official OAuth 2.0 authentication
- **No Backend**: All processing happens in your browser
- **Open Source**: The code is publicly available for review

## ⚙️ Troubleshooting

### "Could not find matching track on Spotify"

This happens when TuneFlow can't find a good match. Try:
- Videos with clear artist and title information
- Popular or well-known songs
- Checking if the track exists on Spotify first

### "Not authenticated with Spotify"

Click the TuneFlow icon and connect to Spotify again. Your session may have expired.

### Extension not working

Try these steps:
1. Refresh the YouTube page
2. Disable and re-enable the extension
3. Check that you have an active internet connection
4. Make sure you're logged into Spotify

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd tuneflow/tuneflow-extension

# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build
```

### Project Structure

```
tuneflow-extension/
├── src/
│   ├── background/       # Service worker (main logic)
│   ├── popup/           # Extension popup UI
│   ├── services/        # API and business logic
│   └── types/          # TypeScript definitions
├── assets/             # Icons and images
└── manifest.json       # Extension manifest
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

- This extension is for personal use only
- Please respect copyright laws in your jurisdiction
- Users are responsible for ensuring they have rights to use the content
- This extension does NOT download or distribute copyrighted material
- It helps you find and add tracks available on Spotify to your playlists

## 🆘 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our GitHub Discussions for community support
- **Email**: support@tuneflow.dev (for critical issues only)

## 🎉 Acknowledgments

- **Spotify** for their comprehensive Web API
- **Plasmo** for the excellent extension framework
- The open-source community for inspiration and tools

---

**Made with ❤️ for music lovers who want an easier way to build their playlists**
