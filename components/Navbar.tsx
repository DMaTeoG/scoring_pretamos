"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, UserCheck, LogOut, BarChart3, AlertCircle, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; role: string; role_display: string } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    async function loadCurrentUser() {
      try {
        const profile = await fetchAPI<UserProfile>("/auth/me/");
        if (active && profile.email) {
          setUser({
            email: profile.email,
            role: profile.role,
            role_display: profile.role_display,
          });
          sessionStorage.setItem("user_email", profile.email);
          sessionStorage.setItem("user_role", profile.role);
          sessionStorage.setItem("user_role_display", profile.role_display);
          return;
        }
      } catch {
        const email = sessionStorage.getItem("user_email");
        const role = sessionStorage.getItem("user_role");
        const roleDisplay = sessionStorage.getItem("user_role_display");
        if (active && email) {
          setUser({
            email,
            role: role || "ANALYST",
            role_display: roleDisplay || "Analista",
          });
        }
      }
    }
    loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetchAPI<{ message: string }>("/auth/logout/", { method: "POST" });
    } catch {
      // Clean up local session even if backend offline
    }
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role_display");
    setUser(null);
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full sticky top-0 z-50 transition-all duration-300">
      {/* Banner Legal Obligatorio (AGENTS.md §8) con Efecto Traslúcido de Cristal */}
      <div className="backdrop-blur-xl bg-amber-500/10 dark:bg-amber-400/5 border-b border-amber-500/20 px-4 py-1.5 text-center text-[11px] sm:text-xs text-amber-900 dark:text-amber-200/90 flex items-center justify-center gap-2 transition-colors">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Aviso Legal Institucional (Fines Académicos):</strong> El score es una estimación de riesgo cuantitativo; no garantiza el pago o incumplimiento y no sustituye el criterio técnico del analista.
        </span>
      </div>

      {/* Barra de Navegación Estilo Apple Glassmorphism */}
      <div className="backdrop-blur-2xl bg-white/70 dark:bg-[#12141a]/70 border-b border-white/60 dark:border-white/10 shadow-[0_4px_24px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo y Controles de Ventana Apple */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 pr-2 border-r border-slate-300/60 dark:border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e] inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d89e24] inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29] inline-block shadow-sm" />
            </div>
            <Link href="/" className="group flex items-center transition-transform active:scale-[0.98]">
              <Logo size="md" />
            </Link>
          </div>

          {/* Segmented Glass Navigation Pills */}
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl glass-pill" aria-label="Navegación principal">
            <Link
              href="/dashboard/analyst"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                isActive("/dashboard/analyst")
                  ? "bg-white dark:bg-white/15 text-[#0071e3] dark:text-white shadow-sm border border-black/5 dark:border-white/10"
                  : "text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Módulo</span> Analista
            </Link>

            <Link
              href="/dashboard/company"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                isActive("/dashboard/company")
                  ? "bg-white dark:bg-white/15 text-[#34c759] dark:text-emerald-300 shadow-sm border border-black/5 dark:border-white/10"
                  : "text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Portal</span> Empresa
            </Link>

            <Link
              href="/dashboard/admin"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                isActive("/dashboard/admin")
                  ? "bg-white dark:bg-white/15 text-[#af52de] dark:text-purple-300 shadow-sm border border-black/5 dark:border-white/10"
                  : "text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Panel</span> Admin
            </Link>
          </nav>

          {/* User Profile Glass Pill & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 pl-3 pr-2 py-1 rounded-2xl glass-pill">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left leading-none pr-1">
                    <span className="text-[11px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate max-w-[130px]">
                      {user.email}
                    </span>
                    <span className="text-[9px] font-bold text-[#0071e3] dark:text-blue-400 uppercase tracking-wider">
                      {user.role_display}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="apple-btn-glass px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400"
                  title="Cerrar Sesión Segura"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="apple-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
