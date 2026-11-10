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
  Sparkles,
  Layers,
  Lock,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 py-2 animate-fade-in">
      {/* Top Telemetry Apple Pill */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl glass-pill text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Entorno Bancario en Línea
          </span>
          <span className="text-slate-300 dark:text-white/20 hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">Inferencia en Producción: XGBoost + Calibración Sigmoide</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>v2026.1 Live</span>
        </div>
      </div>

      {/* Hero Section con Estética visionOS y Fotografía de Alta Resolución */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-10 lg:p-12">
        {/* Backdrop Image con Capa Traslúcida Esmerilada */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            alt="Centro Financiero y Rascacielos Corporativos"
            className="w-full h-full object-cover object-center opacity-25 dark:opacity-20 scale-105 filter blur-[1px] transition-transform duration-1000"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--canvas-bg)] via-white/40 dark:via-black/50 to-transparent" />
        </div>

        {/* Apple Window Chrome Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] inline-block shadow-sm" />
            <span className="ml-2 text-[11px] font-mono text-[#6e6e73] dark:text-[#a1a1a6]">
              banco-corp://scoring.terminal.preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#0071e3] dark:text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              Colombia RUES + Datos Abiertos
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold text-[#0071e3] dark:text-blue-300">
            <Landmark className="w-4 h-4 text-[#ff9500]" />
            <span>División de Riesgo de Crédito Empresarial</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">
            Scoring Inteligente y Explicable para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] via-[#5e5ce6] to-[#ff2d55] dark:from-[#2997ff] dark:via-[#7d7aff] dark:to-[#ff375f]">
              Empresas en Colombia
            </span>
          </h1>

          <p className="text-[#6e6e73] dark:text-[#a1a1a6] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Asistencia analítica cuantitativa de grado institucional. Agrega en tiempo real registros oficiales de{" "}
            <strong className="text-[#1d1d1f] dark:text-white">datos.gov.co</strong>, normaliza estados financieros auditados y calcula una probabilidad de incumplimiento calibrada con explicabilidad local <strong className="text-[#1d1d1f] dark:text-white">SHAP</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/analyst"
              className="apple-btn-primary font-semibold text-sm px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg"
            >
              <Search className="w-4 h-4 text-amber-300" />
              <span>Consultar NIT &bull; Iniciar Scoring</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="apple-btn-glass font-semibold text-sm px-6 py-3 rounded-2xl flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-[#0071e3] dark:text-blue-400" />
              <span>Acceso Institucional por Rol</span>
            </Link>
          </div>
        </div>

        {/* Floating VisionOS Glass Telemetry HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10 pt-6 border-t border-black/5 dark:border-white/10">
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] dark:text-[#a1a1a6]">
                Rendimiento ROC-AUC
              </span>
              <Cpu className="w-3.5 h-3.5 text-[#ff9500]" />
            </div>
            <div className="text-2xl font-black text-[#1d1d1f] dark:text-white font-tabular">
              92.31%
            </div>
            <div className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
              Partición temporal 2023
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] dark:text-[#a1a1a6]">
                Separación (KS)
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-[#34c759]" />
            </div>
            <div className="text-2xl font-black text-[#34c759] dark:text-emerald-400 font-tabular">
              70.23%
            </div>
            <div className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
              Máxima discriminación
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] dark:text-[#a1a1a6]">
                Escala de Scoring
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-[#0071e3]" />
            </div>
            <div className="text-2xl font-black text-[#0071e3] dark:text-blue-400 font-tabular">
              0 – 1000
            </div>
            <div className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
              Score = round((1 - PD) × 1000)
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] dark:text-[#a1a1a6]">
                Informe Técnico
              </span>
              <FileText className="w-3.5 h-3.5 text-[#af52de]" />
            </div>
            <div className="text-2xl font-black text-[#1d1d1f] dark:text-white">
              PDF Formal
            </div>
            <div className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
              Generación con ReportLab
            </div>
          </div>
        </div>
      </section>

      {/* Módulos de Operación con Imágenes Reales y Tarjetas Traslúcidas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0071e3] dark:text-blue-400">
              Arquitectura de Acceso Seguro
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] dark:text-white">
              Módulos del Sistema por Rol
            </h2>
          </div>
          <span className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] hidden sm:inline">
            Control de Acceso Basado en Roles (RBAC)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Módulo Analista con Imagen Real */}
          <div className="group rounded-3xl overflow-hidden glass-panel flex flex-col justify-between hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
                alt="Sede Corporativa de Banca Empresarial"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--glass-bg)] via-transparent to-black/30" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full glass-pill text-[10px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-blue-300">
                Módulo 01 &bull; Analista
              </div>
              <div className="absolute bottom-3 left-3 w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-[#0071e3] dark:text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2">
                  Panel de Análisis de Riesgo
                </h3>
                <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed mb-4">
                  Búsqueda de personas jurídicas mediante NIT, validación del dígito de verificación, inspección de ratios contables (liquidez, endeudamiento, ROA) y ejecución del scoring con desglose SHAP.
                </p>
              </div>

              <Link
                href="/dashboard/analyst"
                className="apple-btn-glass w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-[#0071e3] dark:text-blue-300 mt-2"
              >
                <span>Acceder a Análisis de NIT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Portal Empresa con Imagen Real */}
          <div className="group rounded-3xl overflow-hidden glass-panel flex flex-col justify-between hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop"
                alt="Gestión Contable y Estados Financieros"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--glass-bg)] via-transparent to-black/30" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full glass-pill text-[10px] font-bold uppercase tracking-wider text-[#34c759] dark:text-emerald-300">
                Módulo 02 &bull; Autogestión
              </div>
              <div className="absolute bottom-3 left-3 w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-[#34c759] dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2">
                  Portal de Empresa Jurídica
                </h3>
                <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed mb-4">
                  Carga oficial de estados financieros vía formulario web y lotes CSV, verificación de completitud de datos y consulta en solo lectura del score emitido para el NIT vinculado.
                </p>
              </div>

              <Link
                href="/dashboard/company"
                className="apple-btn-glass w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-[#34c759] dark:text-emerald-300 mt-2"
              >
                <span>Acceder a Portal Empresa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Control y Gobernanza con Imagen Real */}
          <div className="group rounded-3xl overflow-hidden glass-panel flex flex-col justify-between hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop"
                alt="Infraestructura de Datos y Servidores de Alta Seguridad"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--glass-bg)] via-transparent to-black/30" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full glass-pill text-[10px] font-bold uppercase tracking-wider text-[#af52de] dark:text-purple-300">
                Módulo 03 &bull; Gobernanza
              </div>
              <div className="absolute bottom-3 left-3 w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-[#af52de] dark:text-purple-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2">
                  Control y Auditoría de Sistema
                </h3>
                <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed mb-4">
                  Aprobación de vínculos Usuario–NIT, supervisión de modelos Machine Learning reentrenados, métricas de calibración y trazabilidad completa de consultas en AuditLog.
                </p>
              </div>

              <Link
                href="/dashboard/admin"
                className="apple-btn-glass w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-[#af52de] dark:text-purple-300 mt-2"
              >
                <span>Acceder a Administración</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Metodología Bancaria y Principios Anti-Leakage */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white">
            Metodología Cuantitativa y Principios Anti-Leakage
          </h3>
        </div>
        <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed">
          El score crediticio corporativo se computa mediante la fórmula canónica{" "}
          <code className="px-2 py-0.5 rounded-lg glass-well font-mono text-[#0071e3] dark:text-blue-300 font-semibold">
            Score = round((1 - PD) × 1000)
          </code>
          . El modelo de Machine Learning fue entrenado con una{" "}
          <strong className="text-[#1d1d1f] dark:text-white">
            partición temporal estricta por año fiscal (corte temporal)
          </strong>{" "}
          para evitar sobreajuste (*data leakage*) y utiliza la biblioteca SHAP para explicar localmente las variables financieras de mayor impacto en idioma español.
        </p>
      </section>
    </div>
  );
}
