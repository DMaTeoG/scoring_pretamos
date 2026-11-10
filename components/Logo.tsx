import React from "react";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", showSubtitle = true, size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblema Vectorial Institucional Bancario */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-b from-[#1b3566] to-[#0c1a36] dark:from-[#162a52] dark:to-[#0d1830] border border-blue-400/40 dark:border-[#2d4b82]/60 shadow-md shadow-blue-950/20 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 group-hover:border-amber-500 transition-colors shrink-0`}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-6 h-6 text-amber-400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Geometría de Bóveda y Escudo Institucional */}
          <path
            d="M20 4L7 9.5V19C7 27.2 12.5 34.8 20 37C27.5 34.8 33 27.2 33 19V9.5L20 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-400"
          />
          {/* Columnas clásicas de solidez bancaria */}
          <path
            d="M14 16V26M20 14V27M26 16V26"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Base y frontispicio */}
          <path
            d="M12 28H28M12 14H28"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Punto de verificación / seguridad */}
          <circle cx="20" cy="9.5" r="1.5" fill="#f59e0b" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 ${textSizes[size]} leading-tight flex items-center gap-1.5`}
        >
          <span>BANCO</span>
          <span className="text-amber-600 dark:text-amber-400 font-extrabold tracking-normal">CORP</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-700 dark:text-blue-300/80">
            División de Riesgo & Scoring
          </span>
        )}
      </div>
    </div>
  );
}
