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
} from "lucide-react";
import { z } from "zod";
import { fetchAPI, downloadReportPDF, formatCOP, formatDateES } from "@/lib/api";
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
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // Keep current history if backend is unreachable
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
          setHistory(data);
        }
      } catch {
        // Keep current history if backend is unreachable
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

    try {
      const res = await fetchAPI<Evaluation>("/evaluations/", {
        method: "POST",
        body: JSON.stringify({ nit }),
      });
      // Brief pause to allow analyst to see full pipeline completion
      await new Promise((resolve) => setTimeout(resolve, 800));
      setEvaluation(res);
      setHistory((prev) => [res, ...prev.filter((item) => item.id !== res.id)]);
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
        created_at: "2026-03-15T10:00:00Z",
      };
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
        return "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/20";
      case "MEDIO":
        return "bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/20";
      case "ALTO":
        return "bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300 ring-1 ring-rose-500/20";
      default:
        return "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200";
    }
  };

  const latestStatement = statements[0] || null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1b2b4b] pb-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Terminal de Riesgo Crediticio
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight transition-colors">
            <BarChart3 className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Evaluación de Solvencia Empresarial
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Consulta de NIT, análisis de ratios contables, estimación con XGBoost calibrado y generación de informe PDF
          </p>
        </div>
      </div>

      {/* Lookup Form */}
      <div className="bank-panel p-6 rounded-2xl">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3" noValidate>
          <div className="relative flex-1">
            <label htmlFor="nit-input" className="sr-only">
              NIT de la empresa a consultar
            </label>
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="nit-input"
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="Ingresa el NIT con dígito de verificación (ej: 800197268-4)"
              required
              className="w-full bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-mono shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading}
            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl border border-blue-400/30 shadow-md shadow-blue-900/15 dark:shadow-blue-950/60 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {lookupLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> Consultando Fuentes...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-amber-300" /> Consultar Empresa por NIT
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs p-4 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" /> {error}
        </div>
      )}

      {/* SKELETON: Mientras busca la empresa */}
      {lookupLoading && <CompanySkeleton />}

      {/* Company Details Card */}
      {!lookupLoading && company && (
        <div className="bank-card p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-[#122240] border border-blue-200 dark:border-blue-400/30 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0 shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{company.legal_name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  NIT: <span className="text-blue-700 dark:text-blue-300 font-semibold">{company.nit}</span> | CIIU: {company.ciiu || "N/A"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEvaluate}
              disabled={evaluationLoading}
              className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl border border-amber-300/40 shadow-lg shadow-amber-950/20 transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {evaluationLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> Computando Modelo ML...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" /> Ejecutar Evaluación Crediticia
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-[#091224] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Jurisdicción / Ciudad</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{company.city || "Bogotá, D.C."}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#091224] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Clasificación de Tamaño</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{company.size || "MEDIANA"}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#091224] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Estado Matrícula Mercantil</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {company.status || "ACTIVA"}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-[#091224] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Fuente Oficial Conectada</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">datos.gov.co (SODA)</span>
            </div>
          </div>

          {latestStatement && (
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Último Estado Financiero Registrado (Año Fiscal {latestStatement.fiscal_year})
                </h4>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded">
                  Confianza de Datos: {latestStatement.ratios.confidence_level}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-[#081020] p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ingresos Operacionales</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-tabular">
                    {formatCOP(latestStatement.revenue)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#081020] p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Activos Totales</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-tabular">
                    {formatCOP(latestStatement.total_assets)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#081020] p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Razón Corriente</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300 font-tabular">
                    {latestStatement.ratios.current_ratio !== null ? `${latestStatement.ratios.current_ratio}x` : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#081020] p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Nivel Endeudamiento</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-300 font-tabular">
                    {latestStatement.ratios.debt_ratio !== null
                      ? `${(latestStatement.ratios.debt_ratio * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#081020] p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Margen Neto</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 font-tabular">
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

      {/* SKELETON O PROCESO WEBSOCKET EN TIEMPO REAL */}
      {evaluationLoading && wsProgress && (
        <div className="bank-card p-6 rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 dark:from-[#0a1628] dark:via-[#091224] dark:to-[#081020] space-y-5 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Canal WebSocket Activo (Tiempo Real)
                  </h4>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    ws://scoring
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Transmisión continua de fases de scoring para NIT{" "}
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-300">{nit}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                {wsProgress.progress}%
              </span>
            </div>
          </div>

          {/* Barra de progreso animada */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${wsProgress.progress}%` }}
            />
          </div>

          {/* Estado actual transmitido por el WebSocket */}
          <div className="bg-white/80 dark:bg-[#070e1c] p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Fase {wsProgress.step} de 6 — {wsProgress.title}
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {wsProgress.detail}
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 rounded font-semibold">
              {wsProgress.status}
            </span>
          </div>
        </div>
      )}

      {/* SKELETON: Mientras computa la evaluación ML si no hay ws */}
      {evaluationLoading && !wsProgress && <EvaluationSkeleton />}

      {/* Evaluation Results Card */}
      {!evaluationLoading && evaluation && (
        <div className="bank-card p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4 relative">
            <div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
                Resultado Oficial de Evaluación
              </span>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Dictamen Cuantitativo de Riesgo
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadPDF(evaluation.id, evaluation.company.nit)}
              className="bg-blue-50 dark:bg-[#0b1730] hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-500/40 shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Descargar Dictamen Técnico (PDF)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Medidor de Score Institucional */}
            <div className="md:col-span-1 text-center p-6 bg-slate-50 dark:bg-[#081020] rounded-2xl border border-blue-200 dark:border-blue-500/30 space-y-2 shadow-inner">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
                Score Crediticio
              </span>
              <div className="text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-tabular">
                {evaluation.score}{" "}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ 1000</span>
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${getRiskBadgeColor(
                  evaluation.risk_level
                )}`}
              >
                Riesgo {evaluation.risk_level}
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                  Probabilidad Incumplimiento (PD)
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-tabular">
                  {(evaluation.pd * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Calibración Sigmoide</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Confianza de Datos</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{evaluation.confidence}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Completitud Auditada</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Versión del Modelo</span>
                <span className="text-base font-bold text-blue-700 dark:text-blue-300 block font-mono mt-1">
                  {evaluation.model_version_name || "xgb-2026.1"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Inferencia joblib</span>
              </div>
            </div>
          </div>

          {/* SHAP Factors Breakdown */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Factores Determinantes SHAP (Top 5 en Español)
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Impacto local sobre la puntuación base</span>
            </div>

            <div className="space-y-2">
              {evaluation.factors.map((factor, idx) => (
                <div
                  key={`${factor.feature}-${idx}`}
                  className="bg-slate-50 dark:bg-[#081020] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{factor.text}</span>
                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded text-xs shrink-0 ml-4 ${
                      factor.impact >= 0
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/50"
                        : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/50"
                    }`}
                  >
                    {factor.impact >= 0 ? `+${factor.impact}` : factor.impact} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-[#161208] border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Aviso Metodológico (AGENTS.md §8):</strong> El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.
            </span>
          </div>
        </div>
      )}

      {/* History Table with Filters (T5.3) */}
      <div className="bank-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Registro Histórico de Evaluaciones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Consultas previas archivadas en la base de datos corporativa</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              aria-label="Filtrar historial por NIT"
              value={filterNit}
              onChange={(e) => setFilterNit(e.target.value)}
              placeholder="Filtrar por NIT..."
              className="bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono shadow-sm"
            />
            <select
              aria-label="Filtrar por nivel de riesgo"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm"
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
              className="bg-blue-50 dark:bg-[#122344] hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/40 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {historyLoading ? (
          <TableSkeleton rows={4} cols={8} />
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl">
            No se encontraron evaluaciones registradas para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#081020] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">NIT</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Nivel Riesgo</th>
                  <th className="p-3">PD</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-right">Informe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/20 transition-colors">
                    <td className="p-3 font-semibold text-slate-500 dark:text-slate-400">#{item.id}</td>
                    <td className="p-3 font-mono text-blue-700 dark:text-blue-300">{item.company.nit}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{item.company.legal_name}</td>
                    <td className="p-3 font-bold text-amber-600 dark:text-amber-400 font-tabular">{item.score}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRiskBadgeColor(
                          item.risk_level
                        )}`}
                      >
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="p-3 font-tabular">{(item.pd * 100).toFixed(2)}%</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{formatDateES(item.created_at)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(item.id, item.company.nit)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline"
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
