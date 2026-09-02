import { Redis } from "@upstash/redis";

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const hasUpstash =
  !!redisUrl && !!redisToken && redisUrl.startsWith("http");

// In-Memory Storage for local development when Upstash credentials are not set
class LocalMemoryRedis {
  private sets: Map<string, Set<string>> = new Map();
  private hashes: Map<string, Record<string, string>> = new Map();
  private strings: Map<string, string> = new Map();

  constructor() {
    // Seed initial admin/test whitelist if empty
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

  async set(key: string, value: string): Promise<"OK"> {
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
  ): Promise<string> {
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
      // Reassignment: delete old seat
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

// Global singleton to persist in Next.js hot reload
const globalForRedis = globalThis as unknown as {
  localRedisSingleton?: LocalMemoryRedis;
};

export const redis: Redis = hasUpstash
  ? new Redis({
      url: redisUrl!,
      token: redisToken!,
    })
  : ((globalForRedis.localRedisSingleton ??= new LocalMemoryRedis()) as unknown as Redis);
