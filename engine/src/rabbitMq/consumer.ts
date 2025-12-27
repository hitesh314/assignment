import summarizationService from "../services/summarizationService";

const QUEUE_NAME = process.env.QUEUE_NAME || "summarization_queue";

export const startConsumer = async (workerId: number): Promise<void> => {
  try {
    const amqp = await import("amqplib");
    const rabbitMQUrl =
      process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    const connection = await amqp.connect(rabbitMQUrl);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.prefetch(1);

    console.log(
      `[Worker ${workerId}] Waiting for messages in ${QUEUE_NAME}...`
    );

    channel.consume(
      QUEUE_NAME,
      async (msg: any) => {
        if (msg !== null) {
          try {
            const jobData = JSON.parse(msg.content.toString());
            console.log(
              `[Worker ${workerId}] Processing job ${jobData.job_id}`
            );

            await summarizationService.processJob(jobData);

            channel.ack(msg);
            console.log(`[Worker ${workerId}] Job ${jobData.job_id} completed`);
          } catch (error) {
            console.error(`[Worker ${workerId}] Error processing job:`, error);
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error(`[Worker ${workerId}] Failed to start consumer:`, error);
    throw error;
  }
};

export const startWorkers = async (numWorkers: number = 5): Promise<void> => {
  const workers: Promise<void>[] = [];

  for (let i = 1; i <= numWorkers; i++) {
    workers.push(startConsumer(i));
  }

  await Promise.all(workers);
  console.log(`Started ${numWorkers} workers`);
};
