"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

function getSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "dark";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#0f1d38] border border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm transition-all active:scale-[0.95]"
      title={theme === "dark" ? "Cambiar a Modo Blanco (Claro)" : "Cambiar a Modo Negro (Oscuro)"}
      aria-label={theme === "dark" ? "Cambiar a Modo Blanco (Claro)" : "Cambiar a Modo Negro (Oscuro)"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-blue-600 hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}
