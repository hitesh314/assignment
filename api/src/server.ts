import dotenv from "dotenv";

dotenv.config();

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import connectDB from "./config/db";
import jobRoutes from "./routes/jobRoutes";

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3000");

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeDatabase();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json({ limit: "5mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(mongoSanitize());
  }

  private initializeRoutes(): void {
    this.app.get("/", (req, res) => {
      res.json({ message: " API - Async Content Summarizer" });
    });

    this.app.use("/api", jobRoutes);
  }

  private async initializeDatabase(): Promise<void> {
    await connectDB();
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

const server = new Server();
server.start();
