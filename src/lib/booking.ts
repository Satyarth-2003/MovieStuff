import { redis } from "@/lib/redis";
import { allSeatIds, isAdminRowSeat } from "@/lib/seats";

export type BookingStatus = "not_booked" | "reserved";

export interface Employee {
  email: string;
  name: string;
  role: "employee";
  seat: string | null;
  status: BookingStatus;
  bookingTime: string | null;
}

const WHITELIST_KEY = "whitelist";
const employeeKey = (email: string) => `employee:${email.toLowerCase()}`;
const seatKey = (seatId: string) => `seat:${seatId}`;

export async function isWhitelisted(email: string): Promise<boolean> {
  const isMember = await redis.sismember(WHITELIST_KEY, email.toLowerCase());
  return isMember === 1;
}

export async function addToWhitelist(emails: string[]): Promise<number> {
  const clean = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (clean.length === 0) return 0;
  const [first, ...rest] = clean;
  return redis.sadd(WHITELIST_KEY, first, ...rest);
}

export async function removeFromWhitelist(email: string): Promise<void> {
  await redis.srem(WHITELIST_KEY, email.toLowerCase());
}

export async function getWhitelist(): Promise<string[]> {
  const members = await redis.smembers(WHITELIST_KEY);
  return (members as string[]).sort();
}

export async function getEmployee(email: string): Promise<Employee | null> {
  const data = await redis.hgetall<Record<string, string>>(employeeKey(email));
  if (!data || Object.keys(data).length === 0) return null;
  return {
    email: data.email,
    name: data.name || "",
    role: "employee",
    seat: data.seat || null,
    status: (data.status as BookingStatus) || "not_booked",
    bookingTime: data.bookingTime || null,
  };
}

export async function ensureEmployee(email: string, name: string): Promise<Employee> {
  const lower = email.toLowerCase().trim();
  await redis.sadd(WHITELIST_KEY, lower);

  const existing = await getEmployee(lower);
  if (existing) {
    if (name && !existing.name) {
      await redis.hset(employeeKey(lower), { name });
      existing.name = name;
    }
    return existing;
  }
  const fresh: Employee = {
    email: lower,
    name: name || lower.split("@")[0],
    role: "employee",
    seat: null,
    status: "not_booked",
    bookingTime: null,
  };
  await redis.hset(employeeKey(lower), {
    email: fresh.email,
    name: fresh.name,
    role: "employee",
    seat: "",
    status: "not_booked",
    bookingTime: "",
  });
  return fresh;
}

function placeholderEmployee(email: string): Employee {
  return {
    email: email.toLowerCase(),
    name: "",
    role: "employee",
    seat: null,
    status: "not_booked",
    bookingTime: null,
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const emails = await getWhitelist();
  const employees = await Promise.all(emails.map((e) => getEmployee(e)));
  return employees
    .map((e, i) => e ?? placeholderEmployee(emails[i]))
    .sort((a, b) => a.email.localeCompare(b.email));
}

// Returns a map of seatId -> owner email for all currently reserved seats.
export async function getReservedSeatMap(): Promise<Record<string, string>> {
  const ids = allSeatIds().filter((id) => !isAdminRowSeat(id));
  if (ids.length === 0) return {};
  const keys = ids.map(seatKey);
  const owners = await redis.mget<(string | null)[]>(...keys);
  const map: Record<string, string> = {};
  owners.forEach((owner, i) => {
    if (owner) map[ids[i]] = owner;
  });
  return map;
}

export type ConfirmResult = "OK" | "SEAT_TAKEN" | "ALREADY_HAS_SEAT" | "ADMIN_ROW";

const CONFIRM_SCRIPT = `
local seatOwner = redis.call("GET", KEYS[1])
if seatOwner then
  return "SEAT_TAKEN"
end
local currentSeat = redis.call("HGET", KEYS[2], "seat")
if currentSeat and currentSeat ~= "" then
  return "ALREADY_HAS_SEAT"
end
redis.call("SET", KEYS[1], ARGV[1])
redis.call("HSET", KEYS[2], "seat", ARGV[2], "status", "reserved", "bookingTime", ARGV[3])
return "OK"
`;

export async function confirmSeatForEmployee(
  email: string,
  seatId: string,
  isAdmin = false
): Promise<ConfirmResult> {
  if (!isAdmin && isAdminRowSeat(seatId)) return "ADMIN_ROW";
  const bookingTime = new Date().toISOString();
  const result = await redis.eval(
    CONFIRM_SCRIPT,
    [seatKey(seatId), employeeKey(email)],
    [email.toLowerCase(), seatId, bookingTime]
  );
  return result as ConfirmResult;
}

// --- Admin operations ---

const ADMIN_ASSIGN_SCRIPT = `
local seatOwner = redis.call("GET", KEYS[1])
if seatOwner and seatOwner ~= ARGV[1] then
  return "SEAT_TAKEN"
end
local prevSeat = redis.call("HGET", KEYS[2], "seat")
if prevSeat and prevSeat ~= "" and prevSeat ~= ARGV[2] then
  redis.call("DEL", "seat:" .. prevSeat)
end
redis.call("SET", KEYS[1], ARGV[1])
redis.call("HSET", KEYS[2], "seat", ARGV[2], "status", "reserved", "bookingTime", ARGV[3])
return "OK"
`;

export async function adminAssignSeat(email: string, seatId: string): Promise<ConfirmResult> {
  const bookingTime = new Date().toISOString();
  const result = await redis.eval(
    ADMIN_ASSIGN_SCRIPT,
    [seatKey(seatId), employeeKey(email)],
    [email.toLowerCase(), seatId, bookingTime]
  );
  return result as ConfirmResult;
}

export async function adminReleaseSeat(email: string): Promise<void> {
  const emp = await getEmployee(email);
  if (!emp || !emp.seat) return;
  await redis.del(seatKey(emp.seat));
  await redis.hset(employeeKey(email), { seat: "", status: "not_booked", bookingTime: "" });
}

export async function adminReleaseSeatById(seatId: string): Promise<void> {
  const allEmps = await listEmployees();
  const target = allEmps.find((e) => e.seat === seatId);
  if (target) {
    await adminReleaseSeat(target.email);
  } else {
    await redis.del(seatKey(seatId));
  }
}

export async function getStats() {
  const [employees, reserved] = await Promise.all([listEmployees(), getReservedSeatMap()]);
  const reservedCount = Object.keys(reserved).length;
  const totalBookable = allSeatIds().filter((id) => !isAdminRowSeat(id)).length;
  return {
    totalEmployees: employees.length,
    seatsReserved: reservedCount,
    seatsAvailable: totalBookable - reservedCount,
    employeesYetToSelect: employees.filter((e) => e.status !== "reserved").length,
  };
}
