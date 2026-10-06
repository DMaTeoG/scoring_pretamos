"use client";

import Link from "next/link";
import { ShieldCheck, FileText, UserCheck, LogOut, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [user, setUser] = useState<{ email: string; role_display: string } | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    const role_display = localStorage.getItem("user_role_display");
    if (email) {
      setUser({ email, role_display: role_display || "Analista" });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role_display");
    window.location.href = "/";
  };

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      {/* Banner Legal Obligatorio */}
      <div className="bg-amber-950/80 border-b border-amber-800/50 px-4 py-1.5 text-center text-xs text-amber-200">
        ⚠️ <strong>Aviso Legal Académico:</strong> El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento de una obligación y no sustituye el criterio del analista financiero.
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">ScoreEmpresarial</span>
            <span className="text-xs block text-blue-400 font-medium">Plataforma Inteligente de Riesgo</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/dashboard/analyst" className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Analista
          </Link>

          <Link href="/dashboard/company" className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors">
            <FileText className="w-4 h-4 text-emerald-400" />
            Portal Empresa
          </Link>

          <Link href="/dashboard/admin" className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors">
            <UserCheck className="w-4 h-4 text-purple-400" />
            Administrador
          </Link>

          {user ? (
            <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
              <div className="text-right">
                <p className="text-xs text-slate-200 font-medium">{user.email}</p>
                <span className="text-[10px] text-blue-400 uppercase font-semibold">{user.role_display}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Cerrar Sesión"
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
