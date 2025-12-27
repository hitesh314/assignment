import Job, { IJob } from '../models/Job';
import RedisClient from '../config/redis';
import { extract } from '@extractus/article-extractor';
import crypto from 'crypto';

class JobService {
  private async getRedisClient() {
    return await RedisClient.getInstance();
  }

  private generateJobId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private async generateCacheKey(url?: string, text?: string): Promise<string> {
    const content = url || text || '';
    return crypto.createHash('md5').update(content).digest('hex');
  }

  public async submitJob(url?: string, text?: string): Promise<{ job_id: string; status: string }> {
    try {
      if (!url && !text) {
        throw new Error('Either url or text must be provided');
      }

      if (!url && text) {
        if (!text.trim()) {
          throw new Error('Text cannot be empty or contain only whitespace');
        }

        const MAX_TEXT_LENGTH = 50000;
        if (text.length > MAX_TEXT_LENGTH) {
          throw new Error(`Text is too long. Maximum allowed length is ${MAX_TEXT_LENGTH} characters, but received ${text.length} characters`);
        }
      }

      let contentToSummarize = text;

      if (url) {
        try {
          const article = await extract(url);
          if (article && article.content) {
            contentToSummarize = article.content;
          } else {
            throw new Error('Failed to extract content from URL');
          }
        } catch (error) {
          throw new Error(`Invalid URL or failed to fetch content: ${error}`);
        }
      }

      const cacheKey = await this.generateCacheKey(url, contentToSummarize);
      const redis = await this.getRedisClient();

      const cachedResult = await redis.get(`summary:${cacheKey}`);

      const jobId = this.generateJobId();

      if (cachedResult) {
        const job = await Job.create({
          job_id: jobId,
          url,
          text: contentToSummarize,
          status: 2,
          summary: cachedResult,
          cached: true,
          processing_time_ms: 0,
        });

        return {
          job_id: jobId,
          status: 'completed',
        };
      } else {
        const job = await Job.create({
          job_id: jobId,
          url,
          text: contentToSummarize,
          status: 0,
          cached: false,
        });

        return {
          job_id: jobId,
          status: 'queued',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  public async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await Job.findOne({ job_id: jobId });

      if (!job) {
        return null;
      }

      const statusMap: { [key: number]: string } = {
        0: 'queued',
        1: 'processing',
        2: 'completed',
        3: 'failed',
      };

      const response: any = {
        job_id: job.job_id,
        status: statusMap[job.status],
        created_at: job.created_at,
      };

      if (job.status === 3 && job.error_message) {
        response.error_message = job.error_message;
      }

      if (job.status === 2) {
        response.cached = job.cached;
        response.processing_time_ms = job.processing_time_ms;
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  public async getJobResult(jobId: string): Promise<any> {
    try {
      const job = await Job.findOne({ job_id: jobId });

      if (!job) {
        return null;
      }

      const statusMap: { [key: number]: string } = {
        0: 'queued',
        1: 'processing',
        2: 'completed',
        3: 'failed',
      };

      if (job.status !== 2) {
        const response: any = {
          job_id: job.job_id,
          status: statusMap[job.status],
          created_at: job.created_at,
        };

        if (job.status === 3) {
          response.error_message = job.error_message || 'Job processing failed';
        } else {
          response.message = 'Job is not yet completed';
        }

        return response;
      }

      return {
        job_id: job.job_id,
        original_url: job.url,
        summary: job.summary,
        cached: job.cached,
        processing_time_ms: job.processing_time_ms,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new JobService();
