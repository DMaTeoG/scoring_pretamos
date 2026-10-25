"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, FileText, UserCheck, LogOut, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { UserProfile } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
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
      // Proceed with client session cleanup even if backend is offline
    }
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role_display");
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      {/* Banner Legal Obligatorio (AGENTS.md §8) */}
      <div className="bg-amber-950/80 border-b border-amber-800/50 px-4 py-1.5 text-center text-xs text-amber-200">
        ⚠️ <strong>Aviso Legal Académico:</strong> El score es una estimación de riesgo con fines
        académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">
              ScoreEmpresarial
            </span>
            <span className="text-xs block text-blue-400 font-medium">
              Plataforma Inteligente de Riesgo
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6" aria-label="Navegación principal">
          <Link
            href="/dashboard/analyst"
            className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Analista
          </Link>

          <Link
            href="/dashboard/company"
            className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Portal Empresa
          </Link>

          <Link
            href="/dashboard/admin"
            className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
          >
            <UserCheck className="w-4 h-4 text-purple-400" />
            Administrador
          </Link>

          {user ? (
            <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
              <div className="text-right">
                <p className="text-xs text-slate-200 font-medium">{user.email}</p>
                <span className="text-[10px] text-blue-400 uppercase font-semibold">
                  {user.role_display}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 transition-all"
            >
              Iniciar Sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
