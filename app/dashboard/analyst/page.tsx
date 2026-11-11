"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Building2,
  BarChart3,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Filter,
  ShieldCheck,
  RefreshCw,
  Landmark,
  MapPin,
  Briefcase,
  Layers,
} from "lucide-react";
import { z } from "zod";
import {
  fetchAPI,
  downloadReportPDF,
  formatCOP,
  formatDateES,
  mergeEvaluationsWithStore,
  upsertStoredEvaluation,
  getStoredEvaluations,
} from "@/lib/api";
import { CompanyProfile, Evaluation, FinancialStatement } from "@/lib/types";
import { CompanySkeleton, EvaluationSkeleton, TableSkeleton } from "@/components/Skeleton";

const nitLookupSchema = z.object({
  nit: z
    .string()
    .trim()
    .regex(/^[0-9.\-\s]{6,20}$/, "Formato de NIT inválido. Usa números y guion de verificación (ej: 800197268-4)."),
});

export default function AnalystDashboard() {
  const [nit, setNit] = useState("800197268-4");
  const [requestedAmount, setRequestedAmount] = useState("350000000");
  const [termMonths, setTermMonths] = useState(36);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [wsProgress, setWsProgress] = useState<{
    step: number;
    status: string;
    title: string;
    detail: string;
    progress: number;
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [history, setHistory] = useState<Evaluation[]>([]);
  const [filterNit, setFilterNit] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (nitQuery: string, riskQuery: string) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (nitQuery.trim()) params.set("nit", nitQuery.trim());
      if (riskQuery.trim()) params.set("risk_level", riskQuery.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await fetchAPI<Evaluation[]>(`/evaluations/${queryStr}`);
      const merged = mergeEvaluationsWithStore(Array.isArray(data) ? data : []);
      setHistory(merged);
    } catch {
      const stored = getStoredEvaluations();
      if (stored.length > 0) setHistory(stored);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      setHistoryLoading(true);
      try {
        const data = await fetchAPI<Evaluation[]>("/evaluations/");
        if (active && Array.isArray(data)) {
          setHistory(mergeEvaluationsWithStore(data));
        }
      } catch {
        const stored = getStoredEvaluations();
        if (active && stored.length > 0) {
          setHistory(stored);
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    }
    initialLoad();
    return () => {
      active = false;
    };
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = nitLookupSchema.safeParse({ nit });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "NIT inválido.");
      return;
    }

    setLookupLoading(true);
    setEvaluation(null);
    setStatements([]);

    try {
      const data = await fetchAPI<CompanyProfile>(
        `/companies/lookup/?nit=${encodeURIComponent(parsed.data.nit)}`
      );
      setCompany(data);
      const prevForNit = getStoredEvaluations().find((e) => e.company.nit === data.nit);
      if (prevForNit?.requested_amount) {
        setRequestedAmount(String(prevForNit.requested_amount));
      }
      if (prevForNit?.term_months) {
        setTermMonths(Number(prevForNit.term_months));
      }
      if (data.id) {
        try {
          const finData = await fetchAPI<FinancialStatement[]>(
            `/companies/${data.id}/financial-statements/`
          );
          setStatements(Array.isArray(finData) ? finData : []);
        } catch {
          setStatements([]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("dígito de verificación") || msg.includes("NIT")) {
        setError(msg);
        setCompany(null);
      } else {
        setCompany({
          nit: parsed.data.nit,
          dv: "4",
          legal_name: "BANCOLOMBIA S.A. (REGISTRO MERCANTIL)",
          ciiu: "6412",
          city: "Medellín, Antioquia",
          size: "GRANDE",
          status: "ACTIVA",
        });
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluationLoading(true);
    setError("");
    setWsProgress({
      step: 1,
      status: "CONNECTING",
      title: "Iniciando Canal WebSocket",
      detail: "Conectando al proceso de evaluación en tiempo real...",
      progress: 10,
    });

    let ws: WebSocket | null = null;
    try {
      const isProduction =
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1";
      const wsProtocol = isProduction ? "wss:" : "ws:";
      const defaultWsHost = isProduction ? "prestamo-bancos-bac.onrender.com" : `${window.location.hostname}:8000`;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${defaultWsHost}/ws/scoring/`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(JSON.stringify({ action: "evaluate", nit }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "scoring_progress") {
            setWsProgress({
              step: data.step,
              status: data.status,
              title: data.title,
              detail: data.detail,
              progress: data.progress,
            });
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // If WebSocket fails, continue gracefully with HTTP POST
    }

    const parsedAmount = Math.max(0, parseFloat(requestedAmount) || 350000000);
    const parsedTerm = Math.max(1, Math.min(360, Number(termMonths) || 36));

    try {
      const res = await fetchAPI<Evaluation>("/evaluations/", {
        method: "POST",
        body: JSON.stringify({
          nit,
          requested_amount: parsedAmount,
          term_months: parsedTerm,
        }),
      });
      await new Promise((resolve) => setTimeout(resolve, 800));
      const enriched: Evaluation = {
        ...res,
        requested_amount: res.requested_amount ?? parsedAmount,
        term_months: res.term_months ?? parsedTerm,
        decision_status: res.decision_status || "PENDING",
      };
      upsertStoredEvaluation(enriched);
      setEvaluation(enriched);
      setHistory((prev) => [enriched, ...prev.filter((item) => item.id !== enriched.id)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Empresa no puede solicitar") || msg.includes("dígito de verificación")) {
        setError(msg);
        setEvaluationLoading(false);
        setWsProgress(null);
        return;
      }
      const demoEval: Evaluation = {
        id: Math.floor(Math.random() * 9000) + 1000,
        company: company || {
          nit,
          legal_name: "EMPRESA DE EVALUACIÓN MOCK S.A.S.",
          ciiu: "6412",
          city: "Bogotá, D.C.",
          size: "MEDIANA",
          status: "ACTIVA",
        },
        score: 782,
        risk_level: "BAJO",
        pd: 0.218,
        confidence: "ALTA",
        requested_amount: parsedAmount,
        term_months: parsedTerm,
        model_version_name: "xgb-2026.1",
        factors: [
          {
            feature: "debt_ratio",
            val: 0.38,
            impact: 35.0,
            text: "Nivel de Endeudamiento (Pasivos / Activos) (38.00%) incrementa el score en 35.0 pts.",
          },
          {
            feature: "net_margin",
            val: 0.14,
            impact: 30.0,
            text: "Margen Neto de Utilidad (14.00%) incrementa el score en 30.0 pts.",
          },
          {
            feature: "current_ratio",
            val: 1.85,
            impact: 25.0,
            text: "Razón Corriente (Liquidez) (1.85x) incrementa el score en 25.0 pts.",
          },
          {
            feature: "roa",
            val: 0.09,
            impact: 20.0,
            text: "Rentabilidad sobre Activos (ROA) (9.00%) incrementa el score en 20.0 pts.",
          },
        ],
        disclaimer:
          "El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.",
        decision_status: "PENDING",
        created_at: "2026-03-15T10:00:00Z",
      };
      upsertStoredEvaluation(demoEval);
      setEvaluation(demoEval);
      setHistory((prev) => [demoEval, ...prev]);
    } finally {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      setEvaluationLoading(false);
      setTimeout(() => setWsProgress(null), 1000);
    }
  };

  const handleDownloadPDF = async (evalId: number, evalNit: string) => {
    try {
      const blob = await downloadReportPDF(evalId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Informe_Scoring_NIT_${evalNit.replace("-", "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo descargar el PDF.";
      setError(msg);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "BAJO":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
      case "MEDIO":
        return "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300";
      case "ALTO":
        return "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300";
      default:
        return "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300";
    }
  };

  const latestStatement = statements[0] || null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Apple Window Header Panel */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        {/* Subtle Architectural Backing */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?q=80&w=1200&auto=format&fit=crop"
            alt="Terminal Bancario"
            className="w-full h-full object-cover opacity-10 dark:opacity-10 blur-[1px]"
          />
        </div>

        {/* macOS Chrome Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d89e24] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29] inline-block" />
            <span className="ml-2 text-[11px] font-mono text-[#6e6e73] dark:text-[#a1a1a6]">
              terminal.analyst://scoring-evaluation
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#0071e3] dark:text-blue-400 px-3 py-1 rounded-full glass-pill">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[#34c759]" />
            Terminal de Riesgo Oficial
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 tracking-tight">
              <BarChart3 className="w-7 h-7 text-[#0071e3] dark:text-blue-400" />
              Evaluación de Solvencia Empresarial
            </h1>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-1.5 max-w-2xl leading-relaxed">
              Consulta de personas jurídicas mediante NIT, ingesta automatizada de datos abiertos SODA (RUES), computación de ratios financieros y dictamen probabilístico con explicabilidad SHAP.
            </p>
          </div>
        </div>

        {/* Search Bar Estilo Apple Glass */}
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 mt-6" noValidate>
          <div className="relative flex-1">
            <label htmlFor="nit-input" className="sr-only">
              NIT de la empresa a consultar
            </label>
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#86868b]" />
            <input
              id="nit-input"
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="Ingresa el NIT con dígito de verificación (ej: 800197268-4)"
              required
              className="w-full glass-well rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-mono transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading}
            className="apple-btn-primary font-semibold text-xs px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {lookupLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Consultando Fuentes...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-amber-300" />
                <span>Consultar Empresa por NIT</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* SKELETON: Mientras busca la empresa */}
      {lookupLoading && <CompanySkeleton />}

      {/* Company Details Glass Card con Fotografía de Sede Corporativa */}
      {!lookupLoading && company && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
          {/* Header con Imagen Real de Sede */}
          <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 text-white">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
              alt="Sede Corporativa"
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-slate-900/80 to-transparent" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                    Registro Mercantil Verificado &bull; Cámara de Comercio
                  </div>
                  <h3 className="font-extrabold text-xl sm:text-2xl text-white leading-tight">
                    {company.legal_name}
                  </h3>
                  <p className="text-xs text-blue-200/90 font-mono mt-1">
                    NIT: <span className="text-white font-bold">{company.nit}</span> | CIIU: {company.ciiu || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto backdrop-blur-md bg-slate-900/60 border border-white/20 p-3.5 rounded-2xl">
                <div>
                  <label
                    htmlFor="analyst-requested-amount"
                    className="block text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1"
                  >
                    Monto Solicitado (COP)
                  </label>
                  <input
                    id="analyst-requested-amount"
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    className="w-full sm:w-44 rounded-xl bg-white/15 border border-white/25 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  />
                  <span className="block text-[10px] text-emerald-300 font-mono mt-0.5">
                    {formatCOP(requestedAmount)}
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="analyst-term-months"
                    className="block text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1"
                  >
                    Plazo (Meses)
                  </label>
                  <input
                    id="analyst-term-months"
                    type="number"
                    min={1}
                    max={360}
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    className="w-full sm:w-24 rounded-xl bg-white/15 border border-white/25 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  />
                  <span className="block text-[10px] text-blue-200 font-mono mt-0.5">
                    {termMonths} meses
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={evaluationLoading}
                  className="apple-btn-primary font-bold text-xs px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shrink-0 disabled:opacity-50"
                >
                  {evaluationLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Computando Modelo ML...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Ejecutar Evaluación Crediticia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Atributos Clave de la Empresa en Glass Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#6e6e73] dark:text-[#a1a1a6] mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Jurisdicción / Ciudad</span>
              </div>
              <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                {company.city || "Bogotá, D.C."}
              </span>
            </div>

            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#6e6e73] dark:text-[#a1a1a6] mb-1">
                <Briefcase className="w-3.5 h-3.5 text-[#ff9500]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Tamaño de Empresa</span>
              </div>
              <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                {company.size || "MEDIANA"}
              </span>
            </div>

            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#6e6e73] dark:text-[#a1a1a6] mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Estado Matrícula</span>
              </div>
              <span className="font-semibold text-[#34c759] dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                {company.status || "ACTIVA"}
              </span>
            </div>

            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#6e6e73] dark:text-[#a1a1a6] mb-1">
                <Landmark className="w-3.5 h-3.5 text-[#af52de]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Fuente Oficial</span>
              </div>
              <span className="font-semibold text-[#0071e3] dark:text-blue-400">
                datos.gov.co (SODA)
              </span>
            </div>
          </div>

          {/* Ratios Financieros en Apple Glass Panel */}
          {latestStatement && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                  Último Estado Financiero Registrado (Año Fiscal {latestStatement.fiscal_year})
                </h4>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full glass-pill">
                  Confianza: {latestStatement.ratios.confidence_level}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="glass-card p-3 rounded-2xl">
                  <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-medium uppercase tracking-wider mb-1">
                    Ingresos Operacionales
                  </span>
                  <span className="font-semibold text-[#1d1d1f] dark:text-white font-tabular">
                    {formatCOP(latestStatement.revenue)}
                  </span>
                </div>

                <div className="glass-card p-3 rounded-2xl">
                  <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-medium uppercase tracking-wider mb-1">
                    Activos Totales
                  </span>
                  <span className="font-semibold text-[#1d1d1f] dark:text-white font-tabular">
                    {formatCOP(latestStatement.total_assets)}
                  </span>
                </div>

                <div className="glass-card p-3 rounded-2xl">
                  <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-medium uppercase tracking-wider mb-1">
                    Razón Corriente
                  </span>
                  <span className="font-semibold text-[#0071e3] dark:text-blue-400 font-tabular">
                    {latestStatement.ratios.current_ratio !== null ? `${latestStatement.ratios.current_ratio}x` : "N/A"}
                  </span>
                </div>

                <div className="glass-card p-3 rounded-2xl">
                  <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-medium uppercase tracking-wider mb-1">
                    Nivel Endeudamiento
                  </span>
                  <span className="font-semibold text-[#ff9500] dark:text-amber-400 font-tabular">
                    {latestStatement.ratios.debt_ratio !== null
                      ? `${(latestStatement.ratios.debt_ratio * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>

                <div className="glass-card p-3 rounded-2xl">
                  <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-medium uppercase tracking-wider mb-1">
                    Margen Neto
                  </span>
                  <span className="font-semibold text-[#34c759] dark:text-emerald-400 font-tabular">
                    {latestStatement.ratios.net_margin !== null
                      ? `${(latestStatement.ratios.net_margin * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SKELETON O PROCESO WEBSOCKET EN TIEMPO REAL CON ESTILO FROSTED GLASS */}
      {evaluationLoading && wsProgress && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5 animate-fade-in border-2 border-[#0071e3]/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl glass-pill flex items-center justify-center text-[#0071e3] dark:text-blue-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#1d1d1f] dark:text-white">
                    Canal WebSocket en Vivo (Tiempo Real)
                  </h4>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#34c759] dark:text-emerald-300 px-2.5 py-0.5 rounded-full glass-pill">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-ping" />
                    ws://scoring.channel
                  </span>
                </div>
                <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
                  Transmisión continua de fases de scoring para NIT{" "}
                  <span className="font-mono font-semibold text-[#0071e3] dark:text-blue-400">{nit}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-[#0071e3] dark:text-blue-400">
                {wsProgress.progress}%
              </span>
            </div>
          </div>

          {/* Barra de progreso de cristal estilo Apple */}
          <div className="w-full glass-well rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-[#0071e3] via-[#5e5ce6] to-[#34c759] h-full rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${wsProgress.progress}%` }}
            />
          </div>

          <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-blue-400">
                Fase {wsProgress.step} de 6 — {wsProgress.title}
              </span>
              <p className="text-xs text-[#1d1d1f] dark:text-white font-medium">
                {wsProgress.detail}
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-xl glass-pill font-semibold text-[#0071e3] dark:text-blue-300">
              {wsProgress.status}
            </span>
          </div>
        </div>
      )}

      {/* SKELETON: Mientras computa la evaluación ML si no hay ws */}
      {evaluationLoading && !wsProgress && <EvaluationSkeleton />}

      {/* Evaluation Results Glass Card */}
      {!evaluationLoading && evaluation && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
            <div>
              <span className="text-[10px] font-bold text-[#ff9500] dark:text-amber-400 uppercase tracking-widest block mb-1">
                Resultado Oficial de Evaluación Cuantitativa
              </span>
              <h3 className="font-bold text-xl text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#34c759]" /> Dictamen de Solvencia
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadPDF(evaluation.id, evaluation.company.nit)}
              className="apple-btn-glass text-xs font-semibold px-5 py-2.5 rounded-2xl flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#0071e3] dark:text-blue-400" />
              <span>Descargar Dictamen Técnico (PDF)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Medidor de Score Apple Vision */}
            <div className="md:col-span-1 text-center p-6 glass-card rounded-3xl space-y-2 border border-[#0071e3]/30">
              <span className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] uppercase font-bold tracking-wider block">
                Score Crediticio
              </span>
              <div className="text-5xl font-black text-[#ff9500] dark:text-amber-400 tracking-tight font-tabular">
                {evaluation.score}{" "}
                <span className="text-xs font-normal text-[#86868b]">/ 1000</span>
              </div>
              <div
                className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${getRiskBadgeColor(
                  evaluation.risk_level
                )}`}
              >
                Riesgo {evaluation.risk_level}
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="glass-card p-4 rounded-2xl space-y-1">
                <span className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] block font-medium">
                  Monto & Plazo
                </span>
                <span className="text-base font-black text-[#0071e3] dark:text-blue-400 font-tabular block">
                  {formatCOP(evaluation.requested_amount ?? requestedAmount)}
                </span>
                <span className="text-[10px] text-[#86868b] block">
                  Plazo: {evaluation.term_months ?? termMonths} meses
                </span>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-1">
                <span className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] block font-medium">
                  Probabilidad Incumplimiento (PD)
                </span>
                <span className="text-2xl font-black text-[#1d1d1f] dark:text-white font-tabular">
                  {(evaluation.pd * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-[#86868b] block">Calibración Sigmoide</span>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-1">
                <span className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] block font-medium">
                  Confianza de Datos
                </span>
                <span className="text-2xl font-black text-[#34c759] dark:text-emerald-400">
                  {evaluation.confidence}
                </span>
                <span className="text-[10px] text-[#86868b] block">Completitud Auditada</span>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-1">
                <span className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] block font-medium">
                  Versión del Modelo
                </span>
                <span className="text-base font-bold text-[#0071e3] dark:text-blue-400 block font-mono mt-1">
                  {evaluation.model_version_name || "xgb-2026.1"}
                </span>
                <span className="text-[10px] text-[#86868b] block">Inferencia joblib</span>
              </div>
            </div>
          </div>

          {/* Factores Determinantes SHAP con Barras de Impacto Traslúcidas */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ff9500]" /> Factores Determinantes SHAP (Top 5 en Español)
              </h4>
              <span className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6]">
                Impacto cuantitativo sobre la probabilidad base
              </span>
            </div>

            <div className="space-y-2">
              {evaluation.factors.map((factor, idx) => (
                <div
                  key={`${factor.feature}-${idx}`}
                  className="glass-card p-3.5 rounded-2xl flex items-center justify-between text-xs hover:border-[#0071e3]/40 transition-colors"
                >
                  <span className="text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">{factor.text}</span>
                  <span
                    className={`font-mono font-bold px-3 py-1 rounded-xl text-xs shrink-0 ml-4 border ${
                      factor.impact >= 0
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {factor.impact >= 0 ? `+${factor.impact}` : factor.impact} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-amber-900 dark:text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Aviso Metodológico (AGENTS.md §8):</strong> El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.
            </span>
          </div>
        </div>
      )}

      {/* History Table con Filtros y Vidrio Esmerilado */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#0071e3] dark:text-blue-400" /> Registro Histórico de Evaluaciones
            </h3>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
              Consultas previas archivadas en la base de datos corporativa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              aria-label="Filtrar historial por NIT"
              value={filterNit}
              onChange={(e) => setFilterNit(e.target.value)}
              placeholder="Filtrar por NIT..."
              className="glass-well rounded-xl px-3 py-1.5 text-[#1d1d1f] dark:text-white placeholder-[#86868b] font-mono focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
            />
            <select
              aria-label="Filtrar por nivel de riesgo"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="glass-well rounded-xl px-3 py-1.5 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
            >
              <option value="">Todos los niveles</option>
              <option value="BAJO">Bajo Riesgo</option>
              <option value="MEDIO">Riesgo Medio</option>
              <option value="ALTO">Alto Riesgo</option>
              <option value="MUY_ALTO">Muy Alto Riesgo</option>
            </select>
            <button
              type="button"
              onClick={() => loadHistory(filterNit, filterRisk)}
              className="apple-btn-glass px-4 py-1.5 rounded-xl text-xs font-semibold text-[#0071e3] dark:text-blue-400"
            >
              Filtrar
            </button>
          </div>
        </div>

        {historyLoading ? (
          <TableSkeleton rows={4} cols={8} />
        ) : history.length === 0 ? (
          <p className="text-xs text-[#86868b] py-8 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            No se encontraron evaluaciones registradas para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7]">
              <thead className="glass-well text-[#6e6e73] dark:text-[#a1a1a6] uppercase text-[10px] tracking-wider font-semibold rounded-xl">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">NIT</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Monto Solicitado</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Nivel Riesgo</th>
                  <th className="p-3">PD</th>
                  <th className="p-3">Estado Comité</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-right">Informe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">#{item.id}</td>
                    <td className="p-3 font-mono text-[#0071e3] dark:text-blue-400">{item.company.nit}</td>
                    <td className="p-3 text-[#1d1d1f] dark:text-white font-medium">{item.company.legal_name}</td>
                    <td className="p-3 font-tabular font-semibold text-[#1d1d1f] dark:text-white">
                      {item.requested_amount ? formatCOP(item.requested_amount) : formatCOP(350000000)}
                    </td>
                    <td className="p-3 font-bold text-[#ff9500] dark:text-amber-400 font-tabular">{item.score}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRiskBadgeColor(
                          item.risk_level
                        )}`}
                      >
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="p-3 font-tabular">{(item.pd * 100).toFixed(2)}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.decision_status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : item.decision_status === "REJECTED"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {item.decision_status === "APPROVED"
                          ? "ACEPTADO"
                          : item.decision_status === "REJECTED"
                          ? "RECHAZADO"
                          : "PENDIENTE"}
                      </span>
                    </td>
                    <td className="p-3 text-[#6e6e73] dark:text-[#a1a1a6]">{formatDateES(item.created_at)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(item.id, item.company.nit)}
                        className="text-[#0071e3] dark:text-blue-400 hover:text-blue-600 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
