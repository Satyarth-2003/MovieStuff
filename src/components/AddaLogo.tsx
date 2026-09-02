import React from "react";

interface AddaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  tagline?: string;
  variant?: "dark" | "light" | "gold";
}

export default function AddaLogo({
  className = "",
  size = "md",
  showTagline = false,
  tagline = "Teacher's Day Special Screening",
  variant = "light",
}: AddaLogoProps) {
  const sizeMap = {
    sm: { height: 28, text: "text-lg", badge: "text-xs px-1.5 py-0.5" },
    md: { height: 38, text: "text-2xl", badge: "text-sm px-2 py-0.5" },
    lg: { height: 48, text: "text-3xl", badge: "text-base px-2.5 py-1" },
    xl: { height: 60, text: "text-4xl", badge: "text-lg px-3 py-1" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-1.5 font-sans tracking-tight">
        {/* Official Adda247 Logo Brand Vector & Typography */}
        <div className="flex items-center">
          {/* Stylized Logo mark */}
          <div className="relative flex items-center">
            <span
              className={`font-black tracking-tighter ${
                variant === "dark" ? "text-slate-900" : "text-white"
              } ${currentSize.text}`}
              style={{
                fontFamily: "var(--font-outfit), system-ui, -apple-system, sans-serif",
                letterSpacing: "-0.04em",
              }}
            >
              adda
            </span>
            <div
              className={`ml-1 flex items-center justify-center rounded-lg font-black font-sans leading-none text-white shadow-sm ${
                currentSize.badge
              } ${
                variant === "gold"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 shadow-glow-gold"
                  : "bg-gradient-to-r from-[#ED1C24] via-[#F33E3E] to-[#D9141B] shadow-glow"
              }`}
              style={{
                letterSpacing: "0.02em",
              }}
            >
              247
            </div>
          </div>
        </div>

        {/* Official verified badge or crown icon */}
        <div className="ml-1 flex items-center justify-center">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Live Event" />
        </div>
      </div>

      {showTagline && (
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/90 flex items-center gap-1">
            <svg className="w-3 h-3 text-amber-400 inline" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
            </svg>
            {tagline}
          </span>
        </div>
      )}
    </div>
  );
}
