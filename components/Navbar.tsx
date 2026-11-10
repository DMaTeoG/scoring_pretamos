"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, UserCheck, LogOut, BarChart3, AlertCircle } from "lucide-react";
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
    <header className="w-full border-b border-slate-200 dark:border-[#1b2b4b] bg-white/95 dark:bg-[#091122]/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      {/* Banner Legal Obligatorio (AGENTS.md §8) adaptable a modo claro y oscuro */}
      <div className="bg-amber-50 dark:bg-[#18150a] border-b border-amber-200 dark:border-amber-900/40 px-4 py-1.5 text-center text-xs text-amber-900 dark:text-amber-300/90 flex items-center justify-center gap-2 transition-colors">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Aviso Legal Institucional (Fines Académicos):</strong> El score es una estimación de riesgo cuantitativo; no garantiza el pago o incumplimiento y no sustituye el criterio técnico del analista.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-center transition-transform active:scale-[0.98]">
          <Logo size="md" />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegación principal">
          <Link
            href="/dashboard/analyst"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              isActive("/dashboard/analyst")
                ? "bg-blue-50 text-blue-800 border border-blue-200 shadow-sm dark:bg-[#182848] dark:text-blue-200 dark:border-blue-400/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Módulo</span> Analista
          </Link>

          <Link
            href="/dashboard/company"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              isActive("/dashboard/company")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm dark:bg-[#142e2b] dark:text-emerald-200 dark:border-emerald-400/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Portal</span> Empresa
          </Link>

          <Link
            href="/dashboard/admin"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              isActive("/dashboard/admin")
                ? "bg-purple-50 text-purple-800 border border-purple-200 shadow-sm dark:bg-[#281b36] dark:text-purple-200 dark:border-purple-400/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
            }`}
          >
            <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">Panel</span> Admin
          </Link>

          {/* Theme Toggle (Modo Blanco / Modo Negro) */}
          <div className="ml-1 sm:ml-2">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800/80 pl-3 ml-1 sm:ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-tight">{user.email}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  {user.role_display}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                title="Cerrar Sesión Segura"
                aria-label="Cerrar Sesión Segura"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-blue-400/30 shadow-md shadow-blue-900/10 dark:shadow-blue-900/30 transition-all active:scale-[0.98]"
            >
              Ingreso Seguro
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
