const ytdl = require('yt-dlp-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AudioProcessor {
  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './downloads';
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Smart source switching: Try high-res sources first, fallback to YouTube
   */
  async getFromHighResSources(metadata) {
    console.log(`Attempting high-res sources for: ${metadata.title}`);
    
    // This would integrate with Lucida or similar service
    // For now, we'll simulate the high-res search logic
    
    try {
      // Simulate searching Deezer, Tidal, Qobuz
      const hiressource = await this.searchHighResPlatforms(metadata);
      
      if (hiressource && hiressource.audioUrl) {
        console.log('Found high-res source:', hiressource.platform);
        return await this.downloadFromHighRes(hiressource.audioUrl);
      }
      
      throw new Error('No high-res sources found');
    } catch (error) {
      console.log('High-res sources unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Simulate high-res platform search
   * In production, this would integrate with Lucida or similar services
   */
  async searchHighResPlatforms(metadata) {
    // This is a placeholder for the actual Lucida integration
    // You would implement actual API calls to Deezer, Tidal, Qobuz
    
    const platforms = ['deezer', 'tidal', 'qobuz'];
    
    for (const platform of platforms) {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demonstration, we'll return null (no matches found)
        // In production, you'd check actual APIs
        console.log(`Checking ${platform} for: ${metadata.title}`);
        
        // Return null if no match found (trigger YouTube fallback)
        return null;
      } catch (error) {
        console.log(`${platform} search failed:`, error.message);
        continue;
      }
    }
    
    return null;
  }

  /**
   * Download from high-res source
   */
  async downloadFromHighRes(audioUrl) {
    const axios = require('axios');
    const response = await axios.get(audioUrl, { responseType: 'stream' });
    return response.data;
  }

  /**
   * Download audio from YouTube (Tier 2 fallback)
   */
  async downloadFromYouTube(youtubeUrl) {
    console.log('Downloading from YouTube fallback');
    
    const tempFile = path.join(this.outputDir, `temp_${uuidv4()}.%(ext)s`);
    
    try {
      // Use yt-dlp to get the best audio quality
      const info = await ytdl(youtubeUrl, {
        output: tempFile,
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0', // Best available
        noWarnings: false,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      });

      // Find the downloaded file
      const files = fs.readdirSync(this.outputDir).filter(f => f.startsWith(`temp_${uuidv4()}`));
      if (files.length === 0) {
        throw new Error('Download failed - no file created');
      }

      const downloadedFile = path.join(this.outputDir, files[0]);
      const fileBuffer = fs.readFileSync(downloadedFile);
      
      // Clean up temp file
      fs.unlinkSync(downloadedFile);
      
      return fileBuffer;

    } catch (error) {
      console.error('YouTube download error:', error);
      throw new Error(`YouTube download failed: ${error.message}`);
    }
  }

  /**
   * Convert and enhance audio with metadata embedding
   */
  async convertAndEnhance(audioBuffer, options) {
    const { format, quality, metadata } = options;
    const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4()}.${format}`;
    const outputPath = path.join(this.outputDir, filename);
    const tempInput = path.join(this.outputDir, `input_${uuidv4()}.temp`);

    try {
      // Write input buffer to temp file
      fs.writeFileSync(tempInput, audioBuffer);

      // Setup ffmpeg command
      let command = ffmpeg(tempInput);

      // Apply quality settings based on format
      if (format === 'mp3') {
        command = command.audioBitrate(quality === '320' ? '320k' : '192k');
      } else if (format === 'flac') {
        command = command.audioCodec('flac');
      }

      // Add metadata and cover art
      command = command
        .outputOptions([
          '-metadata', `title=${metadata.title}`,
          '-metadata', `artist=${metadata.artist}`,
          '-metadata', `album=${metadata.album || 'TuneFlow Download'}`,
          '-metadata', `date=${new Date().getFullYear()}`,
          '-metadata', `comment=Downloaded with TuneFlow`
        ]);

      // Add thumbnail as cover art if available
      if (metadata.thumbnail) {
        const thumbnailPath = await this.downloadThumbnail(metadata.thumbnail);
        if (thumbnailPath) {
          command = command.input(thumbnailPath).inputFormat('image2')
            .outputOptions(['-map', '0:a', '-map', '1:v', '-c:v', 'copy', '-c:a', 'copy', '-id3v2_version', '3']);
        }
      }

      // Process the audio
      await new Promise((resolve, reject) => {
        command
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Clean up temp files
      fs.unlinkSync(tempInput);
      if (metadata.thumbnail) {
        const thumbnailPath = await this.downloadThumbnail(metadata.thumbnail);
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      console.log(`Audio processing completed: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('Audio conversion error:', error);
      
      // Clean up on error
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      
      throw new Error(`Audio conversion failed: ${error.message}`);
    }
  }

  /**
   * Download thumbnail for metadata embedding
   */
  async downloadThumbnail(thumbnailUrl) {
    try {
      const axios = require('axios');
      const filename = `thumb_${uuidv4()}.jpg`;
      const filepath = path.join(this.outputDir, filename);
      
      const response = await axios({
        method: 'get',
        url: thumbnailUrl,
        responseType: 'stream'
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return filepath;
    } catch (error) {
      console.log('Thumbnail download failed:', error.message);
      return null;
    }
  }
}

module.exports = {
  audioProcessor: new AudioProcessor()
};