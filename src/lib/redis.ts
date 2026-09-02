import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key layout
// whitelist                         -> Set<email>
// employee:{email}                  -> Hash { name, email, role, seat, status, bookingTime }
// seat:{seatId}                     -> String email (owner), only present when reserved
// seat:{seatId}:mode                -> "employee" | "admin" (who/how it was reserved), optional metadata
