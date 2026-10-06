"use client";

import Link from "next/link";
import { ShieldAlert, Cpu, FileSpreadsheet, FileCheck2, ArrowRight, Building2, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" /> Modelo XGBoost Calibrado + SHAP (AUC: 92.3%)
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Evaluación Inteligente de <span className="gradient-text">Riesgo Crediticio Empresarial</span>
        </h1>
        
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Asistencia técnica y cuantitativa para analistas financieros mediante la recopilación de fuentes de datos abiertas en Colombia, cálculo de ratios de solvencia y modelos de Machine Learning explicables.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard/analyst"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
          >
            <Search className="w-4 h-4" /> Consultar NIT / Probar Scoring <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-slate-700 transition-all"
          >
            Acceso con Roles
          </Link>
        </div>
      </section>

      {/* Grid de Modulos por Rol */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">1. Módulo Analista</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Búsqueda de personas jurídicas por NIT, evaluación cuantitativa en segundos, desglose visual de score (0–1000) y exportación de informe en PDF.
          </p>
          <Link href="/dashboard/analyst" className="text-xs font-semibold text-blue-400 hover:underline inline-flex items-center gap-1">
            Ir a Panel Analista &rarr;
          </Link>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">2. Portal Empresa</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Carga de estados financieros mediante formulario web y archivos CSV, con cálculo automático de ratios e indicador de completitud de datos.
          </p>
          <Link href="/dashboard/company" className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1">
            Ir a Portal Empresa &rarr;
          </Link>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">3. Módulo Administrador</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Aprobación de vínculos usuario–NIT, monitoreo de versiones del modelo XGBoost (métricas AUC/KS) y explorador de auditoría en tiempo real.
          </p>
          <Link href="/dashboard/admin" className="text-xs font-semibold text-purple-400 hover:underline inline-flex items-center gap-1">
            Ir a Administración &rarr;
          </Link>
        </div>
      </section>

      {/* Banner Informativo sobre Metodología */}
      <section className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">Metodología y Principios Anti-Leakage</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          El score crediticio se computa mediante la fórmula <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-300">Score = round((1 - PD) × 1000)</code>. El modelo de Machine Learning fue entrenado con una <strong>partición temporal estricta por año fiscal</strong> para evitar sobreajuste (*data leakage*) y utiliza la biblioteca SHAP para explicar localmente las 5 variables de mayor impacto en español.
        </p>
      </section>
    </div>
  );
}
