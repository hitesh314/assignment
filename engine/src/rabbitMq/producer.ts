const QUEUE_NAME = process.env.QUEUE_NAME || 'summarization_queue';

let connection: any = null;
let channel: any = null;

export const initializeRabbitMQ = async (): Promise<void> => {
  try {
    const amqp = await import('amqplib');
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    connection = await amqp.connect(rabbitMQUrl);
    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log('RabbitMQ Producer Initialized');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    throw error;
  }
};

export const publishToQueue = async (jobData: any): Promise<void> => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(jobData)), {
      persistent: true,
    });

    console.log(`Published job ${jobData.job_id} to queue`);
  } catch (error) {
    console.error('Failed to publish to queue:', error);
    throw error;
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};
