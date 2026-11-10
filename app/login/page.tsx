"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertTriangle, KeyRound, ShieldCheck, ArrowRight } from "lucide-react";
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
    <div className="max-w-md mx-auto py-6 sm:py-10 animate-fade-in relative">
      {/* Background Ambience & Frosted Glass Card */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-8 space-y-6">
        {/* Subtle Architectural Backing */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?q=80&w=1000&auto=format&fit=crop"
            alt="Arquitectura Financiera"
            className="w-full h-full object-cover opacity-10 dark:opacity-15 blur-[2px]"
          />
        </div>

        {/* macOS Window Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d89e24] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29] inline-block" />
          </div>
          <span className="text-[10px] font-mono text-[#6e6e73] dark:text-[#a1a1a6] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#34c759]" />
            TLS 1.3 &bull; httpOnly Session
          </span>
        </div>

        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">
            Autenticación de Acceso
          </h2>
          <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
            Ingresa con tus credenciales bancarias para operar en la plataforma.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5">
              Correo Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6e6e73] dark:text-[#a1a1a6] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analista.demo@banco.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs glass-well text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6e6e73] dark:text-[#a1a1a6] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs glass-well text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full apple-btn-primary py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión Segura</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">
            <KeyRound className="w-3.5 h-3.5 text-[#ff9500]" />
            <span>Accesos Demo Rápidos (Ambiente Académico)</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("analista.demo@banco.com", "ANALYST")}
              className="apple-btn-glass py-2 px-2 rounded-xl text-[11px] font-semibold text-[#0071e3] dark:text-blue-300 text-center"
            >
              Analista
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("empresa.demo@cliente.com", "COMPANY")}
              className="apple-btn-glass py-2 px-2 rounded-xl text-[11px] font-semibold text-[#34c759] dark:text-emerald-300 text-center"
            >
              Empresa
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin.demo@banco.com", "ADMIN")}
              className="apple-btn-glass py-2 px-2 rounded-xl text-[11px] font-semibold text-[#af52de] dark:text-purple-300 text-center"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
