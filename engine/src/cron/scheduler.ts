import cron from "node-cron";
import Job from "../models/Job";
import { publishToQueue } from "../rabbitMq/producer";

export const startScheduler = (): void => {
  cron.schedule("*/1 * * * * *", async () => {
    try {
      const queuedJobs = await Job.find({ status: 0 });

      if (queuedJobs.length > 0) {
        console.log(`Found ${queuedJobs.length} queued jobs`);

        for (const job of queuedJobs) {
          await publishToQueue({
            job_id: job.job_id,
            url: job.url,
            text: job.text,
          });

          console.log(`Job ${job.job_id} pushed to queue`);
        }
      }
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  });

  console.log("Cron scheduler started - checking for queued jobs every second");
};
