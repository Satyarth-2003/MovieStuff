import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isWhitelisted } from "@/lib/booking";

function adminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS || "satyarth.prakash@adda247.com,ayush.chauhan@adda247.com";
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function vipEmails(): string[] {
  const env = process.env.VIP_EMAILS || "anil.bhadauria@adda247.com";
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type AppRole = "admin" | "vip" | "employee";

export async function roleForEmail(email: string): Promise<AppRole | null> {
  const lower = email.toLowerCase();
  if (adminEmails().includes(lower)) return "admin";
  if (vipEmails().includes(lower)) return "vip";
  if (await isWhitelisted(lower)) return "employee";
  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const role = await roleForEmail(email);
      return role !== null;
    },
    async jwt({ token }) {
      if (token.email) {
        const role = await roleForEmail(token.email);
        if (role) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: AppRole }).role = token.role as AppRole | undefined;
      }
      return session;
    },
  },
};
