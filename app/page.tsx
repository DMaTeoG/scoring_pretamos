import Link from "next/link";
import {
  ShieldAlert,
  Cpu,
  FileSpreadsheet,
  FileCheck2,
  ArrowRight,
  Building2,
  Search,
  CheckCircle,
  TrendingUp,
  Landmark,
  FileText,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 py-4 animate-fade-in">
      {/* Top Banking Telemetry Badge */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2b4b] pb-3 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-subtle" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Entorno Corporativo en Línea</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Motor de Inferencia: XGBoost + Calibración Sigmoide</span>
        </div>
        <div className="font-mono text-[11px] text-amber-800 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2.5 py-0.5 rounded font-medium">
          Versión Activa: xgb-2026.1
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 dark:bg-[#101e38] dark:border-blue-500/30 dark:text-blue-300 text-xs font-semibold shadow-sm transition-colors">
          <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Banca de Empresas &bull; Evaluación Automatizada de Solvencia
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight transition-colors">
          Evaluación Técnica y Cuantitativa de{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-amber-600 dark:from-blue-400 dark:via-sky-300 dark:to-amber-300">
            Riesgo Crediticio Empresarial
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto transition-colors">
          Plataforma bancaria de asistencia a la decisión crediticia para personas jurídicas en Colombia. Conecta datos abiertos oficiales de <span className="font-semibold text-slate-800 dark:text-white">datos.gov.co</span>, computa estados financieros auditados y genera un score probabilístico calibrado (0–1000) con explicabilidad SHAP.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard/analyst"
            className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-blue-400/40 shadow-lg shadow-blue-900/15 dark:shadow-blue-950/60 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Search className="w-4 h-4 text-amber-300" /> Consultar NIT &bull; Scoring <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 dark:bg-[#0f1d38] dark:hover:bg-[#15274d] dark:text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl border dark:border-slate-700/80 transition-all hover:border-slate-400 dark:hover:border-slate-500 active:scale-[0.98] shadow-sm"
          >
            Acceso Autenticado por Rol
          </Link>
        </div>
      </section>

      {/* Banking Key Indicators */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="bank-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rendimiento ROC-AUC</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-tabular">92.31%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Validación temporal 2023</div>
        </div>

        <div className="bank-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Poder Separación (KS)</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-tabular">70.23%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Máxima discriminación</div>
        </div>

        <div className="bank-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Escala de Scoring</span>
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-tabular">0 – 1000</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Score = round((1 - PD) × 1000)</div>
        </div>

        <div className="bank-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Informe Técnico</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">PDF Formal</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Generación con ReportLab</div>
        </div>
      </section>

      {/* Grid de Modulos por Rol con Estética Bancaria */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Modulo 1: Analista */}
        <div className="bank-card p-6 rounded-2xl flex flex-col justify-between group transition-all duration-200 hover:-translate-y-1">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-gradient-to-b dark:from-[#1b3566] dark:to-[#0f2142] border border-blue-200 dark:border-blue-400/30 flex items-center justify-center text-blue-700 dark:text-blue-300 mb-4 shadow-sm group-hover:border-blue-500 transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 dark:text-blue-400 block mb-1">
              Módulo de Operación 01
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Panel del Analista de Riesgo</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Búsqueda de personas jurídicas mediante NIT, validación del dígito de verificación, inspección de ratios contables (liquidez, endeudamiento, ROA, margen) y ejecución del scoring con desglose SHAP.
            </p>
          </div>
          <Link
            href="/dashboard/analyst"
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white inline-flex items-center gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 transition-colors"
          >
            Acceder a Análisis de NIT &rarr;
          </Link>
        </div>

        {/* Modulo 2: Portal Empresa */}
        <div className="bank-card p-6 rounded-2xl flex flex-col justify-between group transition-all duration-200 hover:-translate-y-1">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-gradient-to-b dark:from-[#133e38] dark:to-[#0a2320] border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-4 shadow-sm group-hover:border-emerald-500 transition-colors">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
              Módulo de Autogestión 02
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Portal de Empresa Jurídica</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Carga oficial de estados financieros vía formulario web y lotes CSV, verificación de completitud de datos y consulta en solo lectura del score emitido para el NIT vinculado.
            </p>
          </div>
          <Link
            href="/dashboard/company"
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white inline-flex items-center gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 transition-colors"
          >
            Acceder a Portal Empresa &rarr;
          </Link>
        </div>

        {/* Modulo 3: Administrador */}
        <div className="bank-card p-6 rounded-2xl flex flex-col justify-between group transition-all duration-200 hover:-translate-y-1">
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-gradient-to-b dark:from-[#341d4c] dark:to-[#1c0f2b] border border-purple-200 dark:border-purple-400/30 flex items-center justify-center text-purple-700 dark:text-purple-300 mb-4 shadow-sm group-hover:border-purple-500 transition-colors">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700 dark:text-purple-400 block mb-1">
              Gobernanza & Auditoría 03
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Control y Auditoría de Sistema</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Aprobación y rechazo de vínculos Usuario–NIT, supervisión de modelos Machine Learning entrenados, métricas de calibración y trazabilidad completa de consultas en AuditLog.
            </p>
          </div>
          <Link
            href="/dashboard/admin"
            className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white inline-flex items-center gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 transition-colors"
          >
            Acceder a Administración &rarr;
          </Link>
        </div>
      </section>

      {/* Banner Informativo sobre Metodología */}
      <section className="bank-panel p-6 sm:p-8 rounded-2xl space-y-3">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Metodología Bancaria y Principios Anti-Leakage</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          El score crediticio corporativo se computa mediante la fórmula <code className="bg-slate-100 dark:bg-[#091122] px-2 py-0.5 rounded border border-slate-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 font-mono font-medium">Score = round((1 - PD) × 1000)</code>. El modelo de Machine Learning fue entrenado con una <strong>partición temporal estricta por año fiscal (corte temporal)</strong> para evitar sobreajuste (*data leakage*) y utiliza la biblioteca SHAP para explicar localmente las variables financieras de mayor impacto en idioma español.
        </p>
      </section>
    </div>
  );
}
