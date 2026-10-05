"use client";

import { useState } from "react";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { fetchAPI } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await fetchAPI("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.access) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("user_role_display", data.user.role_display);

        if (data.user.role === "ADMIN") {
          window.location.href = "/dashboard/admin";
        } else if (data.user.role === "COMPANY") {
          window.location.href = "/dashboard/company";
        } else {
          window.location.href = "/dashboard/analyst";
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al autenticar credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail: string, role: string) => {
    setEmail(presetEmail);
    setPassword("Password123!");
    localStorage.setItem("access_token", "demo-token");
    localStorage.setItem("user_email", presetEmail);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_role_display", role === "ADMIN" ? "Administrador" : role === "COMPANY" ? "Empresa" : "Analista");

    if (role === "ADMIN") window.location.href = "/dashboard/admin";
    else if (role === "COMPANY") window.location.href = "/dashboard/company";
    else window.location.href = "/dashboard/analyst";
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Iniciar Sesión</h2>
          <p className="text-xs text-slate-400">Acceso seguro con JWT y cookies httpOnly</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analista@banco.com"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-md shadow-blue-600/20"
          >
            {loading ? "Autenticando..." : "Ingresar a la Plataforma"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center mb-3">Acceso Rápido de Prueba (Modo Demo):</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("analista.demo@banco.com", "ANALYST")}
              className="bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700 text-blue-300 text-[11px] py-1.5 px-2 rounded-lg transition-all"
            >
              Analista
            </button>
            <button
              onClick={() => handleQuickLogin("empresa.demo@empresa.com", "COMPANY")}
              className="bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700 text-emerald-300 text-[11px] py-1.5 px-2 rounded-lg transition-all"
            >
              Empresa
            </button>
            <button
              onClick={() => handleQuickLogin("admin.demo@banco.com", "ADMIN")}
              className="bg-slate-800 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-700 text-purple-300 text-[11px] py-1.5 px-2 rounded-lg transition-all"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
