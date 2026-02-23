import { getRedisClient } from './redisClient';
import logger from './logger';

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

/**
 * Get a cached value. Returns null on miss or Redis unavailability.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
        const value = await redis.get(key);
        if (value === null) return null;
        return JSON.parse(value) as T;
    } catch (err: any) {
        logger.warn(`Cache GET failed for key "${key}"`, { error: err.message });
        return null;
    }
}

/**
 * Set a cached value with optional TTL in seconds (default 5 minutes).
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err: any) {
        logger.warn(`Cache SET failed for key "${key}"`, { error: err.message });
    }
}

/**
 * Delete one or more cache keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
    const redis = getRedisClient();
    if (!redis || keys.length === 0) return;

    try {
        await redis.del(...keys);
    } catch (err: any) {
        logger.warn(`Cache DEL failed for keys "${keys.join(', ')}"`, { error: err.message });
    }
}

/**
 * Delete all keys matching a pattern (e.g. "business:*").
 * Use sparingly — SCAN is O(N) over the keyspace.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');
    } catch (err: any) {
        logger.warn(`Cache DEL pattern failed for "${pattern}"`, { error: err.message });
    }
}

// ─── Cache key builders ──────────────────────────────────────────────────────
// Centralised so refactoring a key name is a one-line change.

export const CacheKeys = {
    businessBySubDomain: (subDomain: string) =>
        `business:subDomain:${subDomain.toLowerCase()}`,

    businessByWabaId: (wabaId: string) =>
        `business:wabaId:${wabaId}`,

    businessByPhoneNumberId: (phoneNumberId: string) =>
        `business:phoneNumberId:${phoneNumberId}`,

    /** Bust all business-related keys for a given subDomain */
    allBusinessKeys: (subDomain: string) => [
        `business:subDomain:${subDomain.toLowerCase()}`,
    ],

    metaTemplates: (subDomain: string) =>
        `meta:templates:${subDomain.toLowerCase()}`,

    metaPhoneNumbers: (subDomain: string) =>
        `meta:phoneNumbers:${subDomain.toLowerCase()}`,

    metaAccountStatus: (subDomain: string) =>
        `meta:accountStatus:${subDomain.toLowerCase()}`,
};

// ─── TTL constants ────────────────────────────────────────────────────────────
export const CacheTTL = {
    BUSINESS: 300,         // 5 min — business config changes infrequently
    META_TEMPLATES: 600,   // 10 min — template approval can take hours
    META_PHONE_NUMBERS: 300,
    META_ACCOUNT_STATUS: 120,
};
