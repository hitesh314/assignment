import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/db";
import { initializeRabbitMQ } from "./rabbitMq/producer";
import { startWorkers } from "./rabbitMq/consumer";
import { startScheduler } from "./cron/scheduler";

class Engine {
  public async start(): Promise<void> {
    try {
      console.log("Starting  Engine...");

      await connectDB();

      await initializeRabbitMQ();

      startScheduler();

      const numWorkers = parseInt(process.env.NUM_WORKERS || "5");
      await startWorkers(numWorkers);

      console.log(" Engine started successfully");
    } catch (error) {
      console.error("Failed to start engine:", error);
      process.exit(1);
    }
  }
}

const engine = new Engine();
engine.start();
