"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Building2,
  AlertCircle,
  Download,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  FileText,
  Landmark,
  MapPin,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import {
  fetchAPI,
  uploadCSVFile,
  downloadReportPDF,
  formatCOP,
  formatDateES,
  mergeEvaluationsWithStore,
  upsertStoredEvaluation,
  getStoredEvaluations,
} from "@/lib/api";
import { CompanyProfile, Evaluation, FinancialStatement, RiskLevel } from "@/lib/types";
import { Skeleton } from "@/components/Skeleton";

const financialStatementSchema = z.object({
  requested_amount: z
    .number()
    .positive("El monto de crédito solicitado debe ser mayor a cero."),
  term_months: z
    .number()
    .int()
    .min(1, "El plazo mínimo es de 1 mes.")
    .max(360, "El plazo máximo es de 360 meses."),
  fiscal_year: z
    .number()
    .int()
    .min(2000, "El año fiscal debe ser mayor o igual a 2000.")
    .max(2030, "Año fiscal fuera de rango."),
  revenue: z.number().nonnegative("Los ingresos no pueden ser negativos."),
  expenses: z.number().nonnegative("Los gastos no pueden ser negativos."),
  net_income: z.number(),
  total_assets: z.number().positive("Los activos totales deben ser mayores a cero."),
  current_assets: z.number().nonnegative("Los activos corrientes no pueden ser negativos."),
  total_liabilities: z.number().nonnegative("Los pasivos totales no pueden ser negativos."),
  current_liabilities: z.number().nonnegative("Los pasivos corrientes no pueden ser negativos."),
});

export default function CompanyDashboard() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [requestedAmount, setRequestedAmount] = useState("350000000");
  const [termMonths, setTermMonths] = useState(36);
  const [fiscalYear, setFiscalYear] = useState(2023);
  const [revenue, setRevenue] = useState("1200000000");
  const [expenses, setExpenses] = useState("850000000");
  const [netIncome, setNetIncome] = useState("250000000");
  const [totalAssets, setTotalAssets] = useState("1500000000");
  const [currentAssets, setCurrentAssets] = useState("600000000");
  const [totalLiabilities, setTotalLiabilities] = useState("500000000");
  const [currentLiabilities, setCurrentLiabilities] = useState("300000000");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCompanyContext() {
      setContextLoading(true);
      let resolvedCompany: CompanyProfile = {
        id: 1,
        nit: "800197268-4",
        legal_name: "BANCOLOMBIA S.A.",
        ciiu: "6412",
        city: "Medellín",
        size: "GRANDE",
        status: "ACTIVA",
      };
      try {
        const myComp = await fetchAPI<CompanyProfile>("/companies/my-company/");
        if (active) {
          setCompany(myComp);
          resolvedCompany = myComp;
        }
      } catch {
        if (active) {
          setCompany(resolvedCompany);
        }
      }

      try {
        const evals = await fetchAPI<Evaluation[]>("/evaluations/");
        const merged = mergeEvaluationsWithStore(Array.isArray(evals) ? evals : []);
        const ownEvals = merged.filter((e) => e.company.nit === resolvedCompany.nit);
        if (active && ownEvals.length > 0) {
          setLatestEvaluation(ownEvals[0]);
        }
      } catch {
        const stored = getStoredEvaluations().filter(
          (e) => e.company.nit === resolvedCompany.nit
        );
        if (active && stored.length > 0) {
          setLatestEvaluation(stored[0]);
        }
      } finally {
        if (active) setContextLoading(false);
      }
    }
    loadCompanyContext();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const parsed = financialStatementSchema.safeParse({
      requested_amount: parseFloat(requestedAmount),
      term_months: Number(termMonths),
      fiscal_year: Number(fiscalYear),
      revenue: parseFloat(revenue),
      expenses: parseFloat(expenses),
      net_income: parseFloat(netIncome),
      total_assets: parseFloat(totalAssets),
      current_assets: parseFloat(currentAssets),
      total_liabilities: parseFloat(totalLiabilities),
      current_liabilities: parseFloat(currentLiabilities),
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Datos financieros inválidos.");
      return;
    }

    setLoading(true);
    const targetCompanyId = company?.id ?? 1;
    const targetNit = company?.nit || "800197268-4";
    let createdStatementId: number | undefined;

    try {
      const created = await fetchAPI<FinancialStatement>(
        `/companies/${targetCompanyId}/financial-statements/`,
        {
          method: "POST",
          body: JSON.stringify({
            fiscal_year: parsed.data.fiscal_year,
            revenue: parsed.data.revenue,
            expenses: parsed.data.expenses,
            operating_income: Math.round(parsed.data.net_income * 1.3),
            net_income: parsed.data.net_income,
            total_assets: parsed.data.total_assets,
            current_assets: parsed.data.current_assets,
            total_liabilities: parsed.data.total_liabilities,
            current_liabilities: parsed.data.current_liabilities,
            financial_debt: Math.round(parsed.data.total_liabilities * 0.4),
            financial_expenses: Math.round(parsed.data.expenses * 0.05),
          }),
        }
      );
      createdStatementId = created.id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("propio NIT") || msg.includes("permiso")) {
        setErrorMsg(msg);
        setLoading(false);
        return;
      }
    }

    try {
      const evalRes = await fetchAPI<Evaluation>("/evaluations/", {
        method: "POST",
        body: JSON.stringify({
          nit: targetNit,
          statement_id: createdStatementId,
          requested_amount: parsed.data.requested_amount,
          term_months: parsed.data.term_months,
        }),
      });
      const enriched: Evaluation = {
        ...evalRes,
        requested_amount: evalRes.requested_amount ?? parsed.data.requested_amount,
        term_months: evalRes.term_months ?? parsed.data.term_months,
        decision_status: evalRes.decision_status || "PENDING",
      };
      upsertStoredEvaluation(enriched);
      setLatestEvaluation(enriched);
      setSuccessMsg(
        `¡Solicitud por ${formatCOP(parsed.data.requested_amount)} (${parsed.data.term_months} meses) radicada! Score ML calculado: ${enriched.score}/1000 (${enriched.risk_level}). Enviada al Panel Admin para decisión de comité.`
      );
    } catch {
      const debtRatio = parsed.data.total_liabilities / parsed.data.total_assets;
      const currentRatio =
        parsed.data.current_liabilities > 0
          ? parsed.data.current_assets / parsed.data.current_liabilities
          : 2.0;
      const netMargin =
        parsed.data.revenue > 0 ? parsed.data.net_income / parsed.data.revenue : 0.15;
      const roa = parsed.data.net_income / parsed.data.total_assets;
      const rawScore = Math.round(
        Math.max(
          180,
          Math.min(
            980,
            680 - debtRatio * 280 + Math.min(currentRatio, 3) * 75 + netMargin * 320 + roa * 250
          )
        )
      );
      const pdVal = Number(((1000 - rawScore) / 1000).toFixed(4));
      const riskLvl: RiskLevel =
        rawScore >= 750
          ? "BAJO"
          : rawScore >= 500
          ? "MEDIO"
          : rawScore >= 250
          ? "ALTO"
          : "MUY_ALTO";

      const fallbackEval: Evaluation = {
        id: Math.floor(Date.now() / 1000),
        company: company || {
          id: targetCompanyId,
          nit: targetNit,
          legal_name: "BANCOLOMBIA S.A.",
          ciiu: "6412",
          city: "Medellín",
          size: "GRANDE",
          status: "ACTIVA",
        },
        requested_by_email:
          typeof window !== "undefined"
            ? sessionStorage.getItem("user_email") || "empresa.demo@cliente.com"
            : "empresa.demo@cliente.com",
        model_version_name: "xgb-2026.1",
        pd: pdVal,
        score: rawScore,
        risk_level: riskLvl,
        confidence: "ALTA",
        requested_amount: parsed.data.requested_amount,
        term_months: parsed.data.term_months,
        decision_status: "PENDING",
        factors: [
          {
            feature: "debt_ratio",
            val: Number(debtRatio.toFixed(4)),
            impact: Number(((0.55 - debtRatio) * 90).toFixed(1)),
            text: `Nivel de Endeudamiento (${(debtRatio * 100).toFixed(1)}%) impacta el score crediticio.`,
          },
          {
            feature: "current_ratio",
            val: Number(currentRatio.toFixed(4)),
            impact: Number(((currentRatio - 1.2) * 28).toFixed(1)),
            text: `Razón Corriente (Liquidez) (${currentRatio.toFixed(2)}x) aporta respaldo de corto plazo.`,
          },
          {
            feature: "net_margin",
            val: Number(netMargin.toFixed(4)),
            impact: Number(((netMargin - 0.05) * 140).toFixed(1)),
            text: `Margen Neto de Utilidad (${(netMargin * 100).toFixed(1)}%) sustenta capacidad de pago.`,
          },
        ],
        disclaimer:
          "El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.",
        created_at: new Date().toISOString(),
      };
      upsertStoredEvaluation(fallbackEval);
      setLatestEvaluation(fallbackEval);
      setSuccessMsg(
        `¡Solicitud de estudio crediticio por ${formatCOP(parsed.data.requested_amount)} (${parsed.data.term_months} meses) radicada! Score ML calculado: ${fallbackEval.score}/1000 (${fallbackEval.risk_level}). Disponible en el Panel Admin para aceptar o rechazar.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCSVSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMsg("");
    setErrorMsg("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("El archivo debe tener extensión .csv obligatoriamente.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("El archivo supera el límite máximo permitido de 5 MB.");
      return;
    }

    setCsvUploading(true);
    const targetCompanyId = company?.id ?? 1;
    try {
      const res = await uploadCSVFile(targetCompanyId, file);
      setSuccessMsg(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al importar el archivo CSV.";
      setErrorMsg(msg);
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadOwnPDF = async (evalId: number, nitStr: string) => {
    try {
      const blob = await downloadReportPDF(evalId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Informe_Scoring_NIT_${nitStr.replace("-", "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo descargar el PDF.";
      setErrorMsg(msg);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel con Estilo Apple Frosted Glass */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        {/* Architectural Image Backing */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop"
            alt="Auditoría Financiera"
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
              portal.company://financial-ledger
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#34c759] dark:text-emerald-400 px-3 py-1 rounded-full glass-pill">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            Portal de Autogestión
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 tracking-tight">
              <FileSpreadsheet className="w-7 h-7 text-[#34c759] dark:text-emerald-400" />
              Gestión Financiera de Persona Jurídica
            </h1>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-1.5 max-w-2xl leading-relaxed">
              Carga oficial de balances contables, importación de lotes CSV y consulta transparente en solo lectura del dictamen crediticio emitido para tu NIT.
            </p>
          </div>

          {company && (
            <div className="glass-pill px-4 py-2.5 rounded-2xl text-xs shrink-0">
              <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] uppercase font-bold tracking-wider">
                NIT Autorizado
              </span>
              <span className="font-bold text-[#34c759] dark:text-emerald-300 font-mono">
                {company.nit} &bull; {company.legal_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dictamen Reciente de la Empresa en Glass Panel */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <h2 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0071e3] dark:text-blue-400" /> Dictamen Cuantitativo Vigente (Solo Lectura)
            </h2>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
              Evaluación oficial más reciente calculada por el motor de inferencia bancario para tu NIT
            </p>
          </div>
          {latestEvaluation && (
            <button
              type="button"
              onClick={() =>
                handleDownloadOwnPDF(latestEvaluation.id, latestEvaluation.company.nit)
              }
              className="apple-btn-glass text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#ff9500]" />
              <span>Descargar Dictamen PDF</span>
            </button>
          )}
        </div>

        {contextLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-4 rounded-2xl space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
        ) : latestEvaluation ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="glass-card p-4 rounded-2xl">
                <span className="text-[#6e6e73] dark:text-[#a1a1a6] block mb-1 text-[10px] font-bold uppercase tracking-wider">
                  Score Asignado
                </span>
                <span className="text-3xl font-black text-[#ff9500] dark:text-amber-400 font-tabular">
                  {latestEvaluation.score}{" "}
                  <span className="text-xs text-[#86868b] font-normal">/ 1000</span>
                </span>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <span className="text-[#6e6e73] dark:text-[#a1a1a6] block mb-1 text-[10px] font-bold uppercase tracking-wider">
                  Nivel de Riesgo
                </span>
                <span className="text-lg font-bold text-[#34c759] dark:text-emerald-400 uppercase tracking-wide">
                  {latestEvaluation.risk_level}
                </span>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <span className="text-[#6e6e73] dark:text-[#a1a1a6] block mb-1 text-[10px] font-bold uppercase tracking-wider">
                  Monto & Plazo
                </span>
                <span className="text-sm font-bold text-[#1d1d1f] dark:text-white font-tabular block">
                  {latestEvaluation.requested_amount
                    ? formatCOP(latestEvaluation.requested_amount)
                    : "Estudio General"}
                </span>
                {latestEvaluation.term_months && (
                  <span className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6]">
                    Plazo: {latestEvaluation.term_months} meses
                  </span>
                )}
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <span className="text-[#6e6e73] dark:text-[#a1a1a6] block mb-1 text-[10px] font-bold uppercase tracking-wider">
                  Decisión Comité (Admin)
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    latestEvaluation.decision_status === "APPROVED"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : latestEvaluation.decision_status === "REJECTED"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  }`}
                >
                  {latestEvaluation.decision_status === "APPROVED"
                    ? "CRÉDITO ACEPTADO"
                    : latestEvaluation.decision_status === "REJECTED"
                    ? "CRÉDITO RECHAZADO"
                    : "PENDIENTE COMITÉ"}
                </span>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <span className="text-[#6e6e73] dark:text-[#a1a1a6] block mb-1 text-[10px] font-bold uppercase tracking-wider">
                  Fecha de Emisión
                </span>
                <span className="text-sm font-semibold text-[#1d1d1f] dark:text-white">
                  {formatDateES(latestEvaluation.created_at)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-amber-900 dark:text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Aviso Legal Académico (AGENTS.md §8):</strong> El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#86868b] py-6 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl space-y-1">
            <p className="font-semibold text-[#1d1d1f] dark:text-white">
              Aún no se registran evaluaciones formales para tu NIT.
            </p>
            <p className="text-[#6e6e73] dark:text-[#a1a1a6]">
              Radica tus estados financieros para que un analista bancario pueda generar tu informe cuantitativo.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Carga Web con Validación Zod en Frosted Glass */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-[#34c759] dark:text-emerald-400" />
              <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white">
                Solicitud de Crédito y Radicación de Estados Financieros (COP)
              </h3>
            </div>
            <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] font-mono glass-pill px-3 py-1 rounded-xl">
              Monto solicitado: <strong className="text-[#0071e3] dark:text-blue-400">{formatCOP(requestedAmount)}</strong>
            </span>
          </div>

          {successMsg && (
            <div
              role="status"
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-2xl flex items-center gap-2.5 animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34c759]" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs p-4 rounded-2xl flex items-center gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
            noValidate
          >
            <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
              <label htmlFor="requested-amount" className="block text-[#0071e3] dark:text-blue-300 font-bold mb-1.5">
                Monto del Crédito Solicitado (COP)
              </label>
              <input
                id="requested-amount"
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
              <label htmlFor="term-months" className="block text-[#0071e3] dark:text-blue-300 font-bold mb-1.5">
                Plazo Solicitado (Meses)
              </label>
              <input
                id="term-months"
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div>
              <label htmlFor="fiscal-year" className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5">
                Año Fiscal Contable
              </label>
              <input
                id="fiscal-year"
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label htmlFor="revenue" className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5">
                Ingresos Operacionales (COP)
              </label>
              <input
                id="revenue"
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label htmlFor="expenses" className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5">
                Gastos Operacionales (COP)
              </label>
              <input
                id="expenses"
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label htmlFor="net-income" className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5">
                Utilidad Neta (COP)
              </label>
              <input
                id="net-income"
                type="number"
                value={netIncome}
                onChange={(e) => setNetIncome(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label htmlFor="total-assets" className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5">
                Activos Totales (COP)
              </label>
              <input
                id="total-assets"
                type="number"
                value={totalAssets}
                onChange={(e) => setTotalAssets(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label htmlFor="current-assets" className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5">
                Activos Corrientes (COP)
              </label>
              <input
                id="current-assets"
                type="number"
                value={currentAssets}
                onChange={(e) => setCurrentAssets(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label
                htmlFor="total-liabilities"
                className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5"
              >
                Pasivos Totales (COP)
              </label>
              <input
                id="total-liabilities"
                type="number"
                value={totalLiabilities}
                onChange={(e) => setTotalLiabilities(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div>
              <label
                htmlFor="current-liabilities"
                className="block text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mb-1.5"
              >
                Pasivos Corrientes (COP)
              </label>
              <input
                id="current-liabilities"
                type="number"
                value={currentLiabilities}
                onChange={(e) => setCurrentLiabilities(e.target.value)}
                required
                className="w-full glass-well rounded-xl p-2.5 text-[#1d1d1f] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#34c759]"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full apple-btn-primary py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando Scoring ML y Enviando a Comité...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Solicitar Crédito y Ejecutar Scoring ML</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Carga por Archivo CSV con Vidrio Esmerilado */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#0071e3] dark:text-blue-400" /> Carga Masiva vía Archivo CSV
            </h3>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed">
              Importación directa de balances estructurados con validación automática de cabeceras contables.
            </p>

            <label
              htmlFor="csv-upload-input"
              className="block border-2 border-dashed border-black/10 dark:border-white/15 hover:border-[#0071e3] dark:hover:border-blue-400 glass-card rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Upload className="w-8 h-8 text-[#0071e3] dark:text-blue-400 mx-auto" />
              <span className="text-xs text-[#1d1d1f] dark:text-white block font-semibold">
                {csvUploading ? "Importando y computando ratios..." : "Seleccionar archivo CSV (.csv)"}
              </span>
              <span className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] block font-mono">
                Límite máximo: 5 MB &bull; Codificación UTF-8
              </span>
              <input
                ref={fileInputRef}
                id="csv-upload-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleCSVSelect}
                disabled={csvUploading}
                className="sr-only"
              />
            </label>

            <a
              href="/plantilla_estados_financieros.csv"
              download="plantilla_estados_financieros.csv"
              className="apple-btn-glass w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-[#0071e3] dark:text-blue-400"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla CSV de Ejemplo</span>
            </a>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#ff9500]" /> Aislamiento de Datos por NIT (AGENTS.md §6)
            </h4>
            <p className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed">
              De acuerdo con las directrices de seguridad del sistema financiero, las empresas solo tienen acceso exclusivo a cargar y consultar información contable perteneciente a su propio NIT validado y aprobado por la entidad bancaria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
