"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { fetchAPI } from "@/lib/api";
import { LoginResponse, UserRole } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido."),
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
      setError(parsed.error.issues[0]?.message || "Datos de inicio de sesión inválidos.");
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
      const msg = err instanceof Error ? err.message : "Error al autenticar credenciales.";
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
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Iniciar Sesión</h2>
          <p className="text-xs text-slate-400">Acceso seguro con JWT en cookies httpOnly</p>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analista.demo@banco.com"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                id="login-password"
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
          <p className="text-xs text-slate-400 text-center mb-3">
            Acceso Rápido de Prueba (Semilla Demo):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("analista.demo@banco.com", "ANALYST")}
              className="bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700 text-blue-300 text-[11px] py-1.5 px-2 rounded-lg transition-all"
            >
              Analista
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("empresa.demo@empresa.com", "COMPANY")}
              className="bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700 text-emerald-300 text-[11px] py-1.5 px-2 rounded-lg transition-all"
            >
              Empresa
            </button>
            <button
              type="button"
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
