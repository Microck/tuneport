const Queue = require('bull');
const redis = require('redis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class QueueService {
  constructor() {
    this.redisClient = null;
    this.jobQueue = null;
    this.db = null;
    this.jobs = new Map();
  }

  async initialize() {
    try {
      // Initialize Redis connection
      if (process.env.REDIS_URL) {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL
        });
        await this.redisClient.connect();
        console.log('Redis connected');
      }

      // Initialize Bull queue
      this.jobQueue = new Queue('tuneflow-processing', {
        redis: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      // Setup queue event listeners
      this.jobQueue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed:`, result);
        this.updateJobInMemory(job.id, { status: 'completed', ...result });
      });

      this.jobQueue.on('failed', (job, error) => {
        console.log(`Job ${job.id} failed:`, error);
        this.updateJobInMemory(job.id, { status: 'failed', error: error.message });
      });

      // Initialize SQLite database for job persistence
      await this.initializeDatabase();
      
      console.log('Queue service initialized successfully');
      
    } catch (error) {
      console.error('Queue service initialization failed:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    const dbPath = path.join(process.cwd(), 'jobs.db');
    this.db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            youtube_url TEXT NOT NULL,
            format TEXT NOT NULL,
            quality TEXT NOT NULL,
            playlist_id TEXT,
            access_token TEXT,
            user_id TEXT NOT NULL,
            status TEXT NOT NULL,
            output_path TEXT,
            filename TEXT,
            metadata TEXT,
            error TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async addJob(jobData) {
    const jobId = this.generateJobId();
    
    const job = {
      id: jobId,
      ...jobData,
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory
    this.jobs.set(jobId, job);

    // Store in database
    await this.saveJobToDatabase(job);

    // Add to queue
    if (this.jobQueue) {
      await this.jobQueue.add('process-youtube', {
        jobId: jobId,
        ...jobData
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 10,
        removeOnFail: 5
      });
    }

    console.log(`Job ${jobId} added to queue`);
    return jobId;
  }

  async getJobStatus(jobId) {
    // Try memory first
    let job = this.jobs.get(jobId);
    
    if (!job) {
      // Fallback to database
      job = await this.getJobFromDatabase(jobId);
      if (job) {
        this.jobs.set(jobId, job);
      }
    }

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  async updateJobStatus(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update memory
    this.jobs.set(jobId, updatedJob);

    // Update database
    await this.updateJobInDatabase(updatedJob);

    console.log(`Job ${jobId} status updated: ${updates.status}`);
    return updatedJob;
  }

  async saveJobToDatabase(job) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO jobs 
         (id, youtube_url, format, quality, playlist_id, access_token, user_id, status, output_path, filename, metadata, error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job.id,
          job.youtubeUrl,
          job.format,
          job.quality,
          job.playlistId || null,
          job.accessToken || null,
          job.userId,
          job.status,
          job.outputPath || null,
          job.filename || null,
          job.metadata ? JSON.stringify(job.metadata) : null,
          job.error || null,
          job.createdAt,
          job.updatedAt
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateJobInDatabase(job) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE jobs SET
         status = ?,
         output_path = ?,
         filename = ?,
         metadata = ?,
         error = ?,
         updated_at = ?
         WHERE id = ?`,
        [
          job.status,
          job.outputPath || null,
          job.filename || null,
          job.metadata ? JSON.stringify(job.metadata) : null,
          job.error || null,
          job.updatedAt,
          job.id
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getJobFromDatabase(jobId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM jobs WHERE id = ?',
        [jobId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            const job = {
              ...row,
              metadata: row.metadata ? JSON.parse(row.metadata) : null
            };
            resolve(job);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  updateJobInMemory(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      const updatedJob = {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.jobs.set(jobId, updatedJob);
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getUserJobs(userId, limit = 20) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const jobs = rows.map(row => ({
              ...row,
              metadata: row.metadata ? JSON.parse(row.metadata) : null
            }));
            resolve(jobs);
          }
        }
      );
    });
  }

  async cleanup() {
    try {
      if (this.jobQueue) {
        await this.jobQueue.close();
      }
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      if (this.db) {
        this.db.close();
      }
      console.log('Queue service cleanup completed');
    } catch (error) {
      console.error('Queue service cleanup error:', error);
    }
  }
}

module.exports = {
  queueService: new QueueService()
};