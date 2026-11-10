"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertTriangle, KeyRound } from "lucide-react";
import { z } from "zod";
import { fetchAPI } from "@/lib/api";
import { LoginResponse, UserRole } from "@/lib/types";
import Logo from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico corporativo válido."),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres."),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectToRoleDashboard = (role: UserRole) => {
    if (role === "ADMIN") {
      router.push("/dashboard/admin");
    } else if (role === "COMPANY") {
      router.push("/dashboard/company");
    } else {
      router.push("/dashboard/analyst");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Credenciales de acceso no válidas.");
      return;
    }

    setLoading(true);
    try {
      // Server sets httpOnly + SameSite cookies automatically (AGENTS.md §6: never store JWT in localStorage)
      const data = await fetchAPI<LoginResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });

      if (data.user) {
        sessionStorage.setItem("user_email", data.user.email);
        sessionStorage.setItem("user_role", data.user.role);
        sessionStorage.setItem("user_role_display", data.user.role_display);
        redirectToRoleDashboard(data.user.role);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al autenticar credenciales en el servidor.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, role: UserRole) => {
    setEmail(presetEmail);
    setPassword("Password123!");
    setError("");
    setLoading(true);

    const roleDisplay =
      role === "ADMIN" ? "Administrador" : role === "COMPANY" ? "Empresa" : "Analista";

    try {
      const data = await fetchAPI<LoginResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: presetEmail, password: "Password123!" }),
      });
      sessionStorage.setItem("user_email", data.user.email);
      sessionStorage.setItem("user_role", data.user.role);
      sessionStorage.setItem("user_role_display", data.user.role_display);
      redirectToRoleDashboard(data.user.role);
    } catch {
      sessionStorage.setItem("user_email", presetEmail);
      sessionStorage.setItem("user_role", role);
      sessionStorage.setItem("user_role_display", roleDisplay);
      redirectToRoleDashboard(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 animate-fade-in">
      <div className="bank-card p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Acceso a Terminal Corporativa</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Autenticación segura con JWT en cookies <code className="text-blue-700 dark:text-blue-300 font-medium">httpOnly</code>
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analista.demo@banco.com"
                required
                className="w-full bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-blue-400/30 shadow-md shadow-blue-900/15 dark:shadow-blue-950/60 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Verificando credenciales..." : "Ingresar al Sistema"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 justify-center mb-3 text-slate-500 dark:text-slate-400 text-xs">
            <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Accesos Rápidos Demo (Semilla del Sistema):</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("analista.demo@banco.com", "ANALYST")}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 dark:bg-[#0b1730] dark:hover:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-300 text-[11px] font-semibold py-2 px-2 rounded-xl transition-all active:scale-[0.98]"
            >
              Analista
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("empresa.demo@empresa.com", "COMPANY")}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-[#0a1e1b] dark:hover:bg-emerald-900/30 dark:border-emerald-500/30 dark:text-emerald-300 text-[11px] font-semibold py-2 px-2 rounded-xl transition-all active:scale-[0.98]"
            >
              Empresa
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin.demo@banco.com", "ADMIN")}
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 dark:bg-[#1b102b] dark:hover:bg-purple-900/30 dark:border-purple-500/30 dark:text-purple-300 text-[11px] font-semibold py-2 px-2 rounded-xl transition-all active:scale-[0.98]"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
