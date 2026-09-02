import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adda247 · Teacher's Day VIP Screening | Mirzapur: The Movie",
  description:
    "Official Adda247 Teacher's Day 2026 Special Movie Screening seat selection for educators and team members.",
  icons: {
    icon: "https://www.adda247.com/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} dark`}>
      <body className="min-h-screen bg-[#090C10] text-slate-100 antialiased font-sans selection:bg-red-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

