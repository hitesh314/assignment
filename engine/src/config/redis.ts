import { createClient } from 'redis';

class RedisClient {
  private static instance: ReturnType<typeof createClient>;

  public static async getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = createClient({
        socket: {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
      });

      RedisClient.instance.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await RedisClient.instance.connect();
      console.log('Redis Connected Successfully');
    }

    return RedisClient.instance;
  }
}

export default RedisClient;
