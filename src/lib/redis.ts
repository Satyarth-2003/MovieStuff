import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

export interface UnifiedRedisClient {
  sismember(key: string, member: string): Promise<number | boolean>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  hgetall<T extends Record<string, string>>(key: string): Promise<T | null>;
  hset(key: string, data: Record<string, string>): Promise<number>;
  del(...keys: string[]): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  mget<T extends (string | null)[]>(...keys: string[]): Promise<T>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
}

// 1. Adapter for standard TCP Redis URLs (redis:// or rediss://) via ioredis
class IoRedisAdapter implements UnifiedRedisClient {
  private client: IORedis;

  constructor(url: string) {
    this.client = new IORedis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      connectTimeout: 10000,
    });
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.client.sismember(key, member);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, member: string): Promise<number> {
    return this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async hgetall<T extends Record<string, string>>(key: string): Promise<T | null> {
    const res = await this.client.hgetall(key);
    if (!res || Object.keys(res).length === 0) return null;
    return res as T;
  }

  async hset(key: string, data: Record<string, string>): Promise<number> {
    return this.client.hset(key, data);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<unknown> {
    return this.client.set(key, value);
  }

  async mget<T extends (string | null)[]>(...keys: string[]): Promise<T> {
    if (keys.length === 0) return [] as unknown as T;
    const res = await this.client.mget(...keys);
    return res as unknown as T;
  }

  async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.client.eval(script, keys.length, ...keys, ...args.map(String));
  }
}

// 2. Adapter for Upstash REST client
class UpstashAdapter implements UnifiedRedisClient {
  private client: UpstashRedis;

  constructor(url: string, token: string) {
    this.client = new UpstashRedis({ url, token });
  }

  async sismember(key: string, member: string): Promise<number> {
    const res = await this.client.sismember(key, member);
    return Number(res) === 1 ? 1 : 0;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const [first, ...rest] = members;
    return this.client.sadd(key, first, ...rest);
  }

  async srem(key: string, member: string): Promise<number> {
    return this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return (await this.client.smembers(key)) as string[];
  }

  async hgetall<T extends Record<string, string>>(key: string): Promise<T | null> {
    return this.client.hgetall<T>(key);
  }

  async hset(key: string, data: Record<string, string>): Promise<number> {
    return this.client.hset(key, data);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get<string>(key);
  }

  async set(key: string, value: string): Promise<unknown> {
    return this.client.set(key, value);
  }

  async mget<T extends (string | null)[]>(...keys: string[]): Promise<T> {
    if (keys.length === 0) return [] as unknown as T;
    return this.client.mget<T>(...keys);
  }

  async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.client.eval(script, keys, args);
  }
}

// 3. In-Memory fallback for local dev when no Redis URL is provided
class LocalMemoryRedis implements UnifiedRedisClient {
  private sets: Map<string, Set<string>> = new Map();
  private hashes: Map<string, Record<string, string>> = new Map();
  private strings: Map<string, string> = new Map();

  constructor() {
    const initialWhitelist = new Set([
      "satyarth.prakash@adda247.com",
      "ayush.chauhan@adda247.com",
    ]);
    this.sets.set("whitelist", initialWhitelist);
  }

  async sismember(key: string, member: string): Promise<number> {
    const set = this.sets.get(key);
    return set && set.has(member) ? 1 : 0;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    const set = this.sets.get(key)!;
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, member: string): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    return set.delete(member) ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async hgetall<T extends Record<string, string>>(key: string): Promise<T | null> {
    const hash = this.hashes.get(key);
    return hash ? ({ ...hash } as T) : null;
  }

  async hset(key: string, data: Record<string, string>): Promise<number> {
    const existing = this.hashes.get(key) || {};
    this.hashes.set(key, { ...existing, ...data });
    return Object.keys(data).length;
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const k of keys) {
      if (this.strings.delete(k) || this.hashes.delete(k) || this.sets.delete(k)) {
        count++;
      }
    }
    return count;
  }

  async get(key: string): Promise<string | null> {
    return this.strings.get(key) || null;
  }

  async set(key: string, value: string): Promise<string> {
    this.strings.set(key, value);
    return "OK";
  }

  async mget<T extends (string | null)[]>(...keys: string[]): Promise<T> {
    const result = keys.map((k) => this.strings.get(k) || null);
    return result as unknown as T;
  }

  async eval(
    _script: string,
    keys: string[],
    args: (string | number)[]
  ): Promise<unknown> {
    const seatKey = keys[0];
    const employeeKey = keys[1];
    const userEmail = String(args[0]).toLowerCase();
    const seatId = String(args[1]);
    const bookingTime = String(args[2]);

    const seatOwner = this.strings.get(seatKey);
    if (seatOwner && seatOwner !== userEmail) {
      return "SEAT_TAKEN";
    }

    const currentSeat = this.hashes.get(employeeKey)?.seat;
    if (currentSeat && currentSeat !== seatId && currentSeat !== "") {
      this.strings.delete(`seat:${currentSeat}`);
    }

    this.strings.set(seatKey, userEmail);
    const existingEmp = this.hashes.get(employeeKey) || {};
    this.hashes.set(employeeKey, {
      ...existingEmp,
      email: userEmail,
      seat: seatId,
      status: "reserved",
      bookingTime,
    });

    return "OK";
  }
}

// Global singleton across Next.js reloads
const globalForRedis = globalThis as unknown as {
  redisClientSingleton?: UnifiedRedisClient;
};

function initRedis(): UnifiedRedisClient {
  const tcpUrl = process.env.REDIS_URL;
  if (tcpUrl && (tcpUrl.startsWith("redis://") || tcpUrl.startsWith("rediss://"))) {
    return new IoRedisAdapter(tcpUrl);
  }

  const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (restUrl && restToken && restUrl.startsWith("http")) {
    return new UpstashAdapter(restUrl, restToken);
  }

  return new LocalMemoryRedis();
}

export const redis: UnifiedRedisClient = (globalForRedis.redisClientSingleton ??= initRedis());
