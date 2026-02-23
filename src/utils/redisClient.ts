import Redis from 'ioredis';
import logger from './logger';

let client: Redis | null = null;
let isAvailable = false;

/**
 * Returns the Redis singleton, connecting on first call.
 * If REDIS_URL is not configured or the connection fails, returns null
 * and the app continues to work without caching.
 */
export function getRedisClient(): Redis | null {
    if (client) return isAvailable ? client : null;

    const url = process.env.REDIS_URL;
    if (!url) {
        logger.warn('REDIS_URL not set — caching disabled');
        return null;
    }

    client = new Redis(url, {
        // Don't crash the process on connection errors
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 3) {
                logger.warn(`Redis connection failed after ${times} attempts — disabling cache`);
                isAvailable = false;
                return null; // Stop retrying
            }
            return Math.min(times * 200, 1000);
        },
    });

    client.on('connect', () => {
        isAvailable = true;
        logger.info('Redis connected');
    });

    client.on('error', (err) => {
        if (isAvailable) {
            logger.warn('Redis connection error — cache temporarily unavailable', { error: err.message });
        }
        isAvailable = false;
    });

    client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
    });

    client.connect().catch(() => {
        // Handled by the error event listener above
    });

    return isAvailable ? client : null;
}

export function isRedisAvailable(): boolean {
    return isAvailable;
}

export async function closeRedis(): Promise<void> {
    if (client) {
        await client.quit();
        client = null;
        isAvailable = false;
    }
}
