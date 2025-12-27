import OpenAI from "openai";
import Job from "../models/Job";
import RedisClient from "../config/redis";
import crypto from "crypto";

class SummarizationService {
  private openai: OpenAI | null = null;
  private readonly OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || "60000");

  private getOpenAIClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: this.OPENAI_TIMEOUT_MS,
        maxRetries: 2,
      });
    }
    return this.openai;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  private async generateCacheKey(url?: string, text?: string): Promise<string> {
    const content = url || text || "";
    return crypto.createHash("md5").update(content).digest("hex");
  }

  public async processJob(jobData: any): Promise<void> {
    const startTime = Date.now();

    try {
      await Job.updateOne({ job_id: jobData.job_id }, { status: 1 });

      const textToSummarize = jobData.text || "";

      if (!textToSummarize) {
        throw new Error("No text to summarize");
      }

      const openai = this.getOpenAIClient();
      const completion = await this.withTimeout(
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that summarizes text concisely and accurately.",
            },
            {
              role: "user",
              content: `Please summarize the following text:\n\n${textToSummarize}`,
            },
          ],
          max_tokens: 250,
          temperature: 0.7,
        }),
        this.OPENAI_TIMEOUT_MS,
        `OpenAI API request timed out after ${this.OPENAI_TIMEOUT_MS}ms`
      );

      const summary =
        completion.choices[0]?.message?.content || "No summary generated";
      const processingTime = Date.now() - startTime;

      const cacheKey = await this.generateCacheKey(jobData.url, jobData.text);
      const redis = await RedisClient.getInstance();
      await redis.set(`summary:${cacheKey}`, summary, {
        EX: parseInt(process.env.CACHE_TTL || "3600"),
      });

      await Job.updateOne(
        { job_id: jobData.job_id },
        {
          status: 2,
          summary: summary,
          processing_time_ms: processingTime,
        }
      );

      console.log(`Job ${jobData.job_id} completed in ${processingTime}ms`);
    } catch (error: any) {
      console.error(`Job ${jobData.job_id} failed:`, error);

      let errorMessage = error.message || "Unknown error";

      if (error.message?.includes("timed out")) {
        errorMessage = `Request timed out: OpenAI API did not respond within ${this.OPENAI_TIMEOUT_MS / 1000} seconds`;
      } else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMessage = "Network timeout: Unable to connect to OpenAI API";
      } else if (error.status === 429) {
        errorMessage = "Rate limit exceeded: Too many requests to OpenAI API";
      } else if (error.status === 500 || error.status === 503) {
        errorMessage = "OpenAI API service unavailable";
      } else if (error.status === 401) {
        errorMessage = "Invalid OpenAI API key";
      }

      await Job.updateOne(
        { job_id: jobData.job_id },
        {
          status: 3,
          error_message: errorMessage,
        }
      );
    }
  }
}

export default new SummarizationService();
