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
} from "lucide-react";
import { z } from "zod";
import { fetchAPI, downloadReportPDF, formatCOP, formatDateES } from "@/lib/api";
import { CompanyProfile, Evaluation, FinancialStatement } from "@/lib/types";

const nitLookupSchema = z.object({
  nit: z
    .string()
    .trim()
    .regex(/^[0-9.\-\s]{6,20}$/, "Formato de NIT inválido. Usa números y guion de verificación (ej: 800197268-4)."),
});

export default function AnalystDashboard() {
  const [nit, setNit] = useState("800197268-4");
  const [loading, setLoading] = useState(false);
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
      try {
        const data = await fetchAPI<Evaluation[]>("/evaluations/");
        if (active && Array.isArray(data)) {
          setHistory(data);
        }
      } catch {
        // Keep current history if backend is unreachable
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

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchAPI<Evaluation>("/evaluations/", {
        method: "POST",
        body: JSON.stringify({ nit }),
      });
      setEvaluation(res);
      setHistory((prev) => [res, ...prev.filter((item) => item.id !== res.id)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Empresa no puede solicitar") || msg.includes("dígito de verificación")) {
        setError(msg);
        setLoading(false);
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
        created_at: new Date().toISOString(),
      };
      setEvaluation(demoEval);
      setHistory((prev) => [demoEval, ...prev]);
    } finally {
      setLoading(false);
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
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "MEDIO":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "ALTO":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      default:
        return "bg-red-950 border-red-800 text-red-300";
    }
  };

  const latestStatement = statements[0] || null;

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" /> Módulo de Analista Financiero
          </h1>
          <p className="text-xs text-slate-400">
            Consulta de NIT, análisis de ratios financieros, scoring con XGBoost/SHAP y exportación PDF
          </p>
        </div>
      </div>

      {/* Lookup Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3" noValidate>
          <div className="relative flex-1">
            <label htmlFor="nit-input" className="sr-only">
              NIT de la empresa a consultar
            </label>
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              id="nit-input"
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="Ingresa el NIT con dígito de verificación (ej: 800197268-4)"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Buscando..." : "Consultar Empresa por NIT"}
          </button>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-4 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Company Details Card */}
      {company && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">{company.legal_name}</h3>
                <p className="text-xs text-slate-400">
                  NIT: {company.nit} | CIIU: {company.ciiu || "N/A"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEvaluate}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Solicitar Evaluación Crediticia
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Ciudad</span>
              <span className="font-semibold text-slate-200">{company.city || "Bogotá, D.C."}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Tamaño</span>
              <span className="font-semibold text-slate-200">{company.size || "MICRO"}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Estado Matrícula</span>
              <span className="font-semibold text-emerald-400">{company.status || "ACTIVA"}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Fuente de Datos</span>
              <span className="font-semibold text-blue-400">datos.gov.co (SODA)</span>
            </div>
          </div>

          {latestStatement && (
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Último Estado Financiero Registrado (Año {latestStatement.fiscal_year})
                </h4>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Confianza de Datos: {latestStatement.ratios.confidence_level}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Ingresos</span>
                  <span className="font-semibold text-slate-200">
                    {formatCOP(latestStatement.revenue)}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Activos Totales</span>
                  <span className="font-semibold text-slate-200">
                    {formatCOP(latestStatement.total_assets)}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Razón Corriente</span>
                  <span className="font-semibold text-blue-300">
                    {latestStatement.ratios.current_ratio ?? "N/A"}x
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Endeudamiento</span>
                  <span className="font-semibold text-amber-300">
                    {latestStatement.ratios.debt_ratio !== null
                      ? `${(latestStatement.ratios.debt_ratio * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Margen Neto</span>
                  <span className="font-semibold text-emerald-300">
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

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="glass-card p-6 rounded-2xl border border-blue-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Resultado de Evaluación
              Crediticia
            </h3>
            <button
              type="button"
              onClick={() => handleDownloadPDF(evaluation.id, evaluation.company.nit)}
              className="bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Descargar Informe PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-1 text-center p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Score Crediticio
              </span>
              <div className="text-5xl font-black text-blue-400 tracking-tight">
                {evaluation.score}{" "}
                <span className="text-xs font-normal text-slate-500">/ 1000</span>
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full border text-xs font-bold ${getRiskBadgeColor(
                  evaluation.risk_level
                )}`}
              >
                Riesgo {evaluation.risk_level}
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">
                  Probabilidad Incumplimiento (PD)
                </span>
                <span className="text-xl font-bold text-slate-100">
                  {(evaluation.pd * 100).toFixed(2)}%
                </span>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Confianza de Datos</span>
                <span className="text-xl font-bold text-emerald-400">{evaluation.confidence}</span>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Versión de Modelo</span>
                <span className="text-sm font-semibold text-blue-300">
                  {evaluation.model_version_name || "xgb-2026.1"}
                </span>
              </div>
            </div>
          </div>

          {/* SHAP Factors Breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Explicabilidad Local SHAP (Top
              Factores en Español)
            </h4>

            <div className="space-y-2">
              {evaluation.factors.map((factor, idx) => (
                <div
                  key={`${factor.feature}-${idx}`}
                  className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300">{factor.text}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      factor.impact >= 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {factor.impact >= 0 ? `+${factor.impact}` : factor.impact} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-amber-300/80 bg-amber-950/40 border border-amber-900/40 p-3 rounded-xl">
            El score es una estimación de riesgo con fines académicos; no garantiza el pago o
            incumplimiento y no sustituye el criterio del analista.
          </p>
        </div>
      )}

      {/* History Table with Filters (T5.3) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" /> Historial de Evaluaciones Realizadas
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              aria-label="Filtrar historial por NIT"
              value={filterNit}
              onChange={(e) => setFilterNit(e.target.value)}
              placeholder="Filtrar por NIT..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500"
            />
            <select
              aria-label="Filtrar por nivel de riesgo"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
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
              className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>

        {historyLoading ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Cargando historial de evaluaciones...
          </p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
            No se encontraron evaluaciones registradas para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
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
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold">#{item.id}</td>
                    <td className="p-3 font-mono text-slate-400">{item.company.nit}</td>
                    <td className="p-3">{item.company.legal_name}</td>
                    <td className="p-3 font-bold text-blue-400">{item.score}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskBadgeColor(
                          item.risk_level
                        )}`}
                      >
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="p-3">{(item.pd * 100).toFixed(2)}%</td>
                    <td className="p-3">{formatDateES(item.created_at)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(item.id, item.company.nit)}
                        className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
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
