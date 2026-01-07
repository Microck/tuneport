const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { audioProcessor } = require('./services/audioProcessor');
const { spotifyService } = require('./services/spotifyService');
const { metadataExtractor } = require('./services/metadataExtractor');
const { queueService } = require('./services/queueService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
queueService.initialize();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main processing endpoint
app.post('/process', async (req, res) => {
  try {
    const { youtubeUrl, format = 'mp3', quality = '320', playlistId, accessToken } = req.body;
    
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Add to processing queue
    const jobId = await queueService.addJob({
      youtubeUrl,
      format,
      quality,
      playlistId,
      accessToken,
      userId: req.headers['x-user-id'] || 'anonymous'
    });

    res.json({ jobId, status: 'queued' });

    // Process asynchronously
    processJob(jobId).catch(console.error);

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job status
app.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await queueService.getJobStatus(jobId);
    res.json(status);
  } catch (error) {
    res.status(404).json({ error: 'Job not found' });
  }
});

// Get processed file
app.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await queueService.getJobStatus(jobId);
    
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed' });
    }

    res.download(job.outputPath, job.filename);

  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Get Spotify playlists
app.get('/spotify/playlists', async (req, res) => {
  try {
    const { accessToken } = req.query;
    const playlists = await spotifyService.getUserPlaylists(accessToken);
    res.json(playlists);
  } catch (error) {
    console.error('Spotify playlists error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Add track to Spotify playlist
app.post('/spotify/playlist/:playlistId/tracks', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { accessToken, trackUri } = req.body;
    
    if (!trackUri) {
      return res.status(400).json({ error: 'Track URI is required' });
    }

    const result = await spotifyService.addToPlaylist(playlistId, [trackUri], accessToken);
    res.json(result);
  } catch (error) {
    console.error('Add to playlist error:', error);
    res.status(500).json({ error: 'Failed to add track to playlist' });
  }
});

// Core processing function
async function processJob(jobId) {
  const job = await queueService.getJobStatus(jobId);
  
  try {
    await queueService.updateJobStatus(jobId, { status: 'processing' });

    // Extract metadata from YouTube
    const metadata = await metadataExtractor.extractFromYouTube(job.youtubeUrl);
    
    // Smart source switching logic
    let audioBuffer;
    let source = 'youtube';
    
    try {
      // Tier 1: Try high-res sources (Deezer, Tidal, Qobuz via Lucida)
      audioBuffer = await audioProcessor.getFromHighResSources(metadata);
      source = 'hires';
    } catch (error) {
      console.log('High-res source failed, falling back to YouTube:', error.message);
      
      // Tier 2: Fallback to YouTube
      audioBuffer = await audioProcessor.downloadFromYouTube(job.youtubeUrl);
      source = 'youtube';
    }

    // Convert and normalize audio
    const outputPath = await audioProcessor.convertAndEnhance(audioBuffer, {
      format: job.format,
      quality: job.quality,
      metadata: metadata
    });

    // Update job status
    await queueService.updateJobStatus(jobId, {
      status: 'completed',
      outputPath,
      filename: `${metadata.title}.${job.format}`,
      metadata: metadata,
      source: source
    });

    console.log(`Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await queueService.updateJobStatus(jobId, {
      status: 'failed',
      error: error.message
    });
  }
}

app.listen(PORT, () => {
  console.log(`TuneFlow Backend running on port ${PORT}`);
});