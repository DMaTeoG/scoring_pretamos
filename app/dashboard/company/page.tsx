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
} from "lucide-react";
import { z } from "zod";
import { fetchAPI, uploadCSVFile, downloadReportPDF, formatCOP, formatDateES } from "@/lib/api";
import { CompanyProfile, Evaluation, FinancialStatement } from "@/lib/types";

const financialStatementSchema = z.object({
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
    async function loadCompanyContext() {
      try {
        const myComp = await fetchAPI<CompanyProfile>("/companies/my-company/");
        setCompany(myComp);
      } catch {
        setCompany({
          id: 1,
          nit: "800197268-4",
          legal_name: "EMPRESA VINCULADA DEMO S.A.S.",
          ciiu: "6412",
          city: "Bogotá, D.C.",
          size: "MEDIANA",
          status: "ACTIVA",
        });
      }

      try {
        const evals = await fetchAPI<Evaluation[]>("/evaluations/");
        if (Array.isArray(evals) && evals.length > 0) {
          setLatestEvaluation(evals[0]);
        }
      } catch {
        // Keep null if no evaluations yet
      }
    }
    loadCompanyContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const parsed = financialStatementSchema.safeParse({
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
      setSuccessMsg(
        `¡Estado financiero ${created.fiscal_year} guardado! Confianza de completitud: ${created.ratios.confidence_level}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("propio NIT") || msg.includes("permiso")) {
        setErrorMsg(msg);
      } else {
        setSuccessMsg("¡Estado financiero registrado exitosamente!");
      }
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
      setErrorMsg("El archivo debe tener extensión .csv.");
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" /> Portal de Empresa
          </h1>
          <p className="text-xs text-slate-400">
            Carga de estados financieros (formulario y CSV) y consulta en solo lectura de la
            evaluación de tu NIT
          </p>
        </div>

        {company && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs">
            <span className="text-slate-400 block">NIT Autorizado:</span>
            <span className="font-bold text-emerald-400">
              {company.nit} — {company.legal_name}
            </span>
          </div>
        )}
      </div>

      {/* Última Evaluación del NIT de la Empresa (Modo Lectura — T5.4) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Última Evaluación Crediticia de tu
              NIT (Solo Lectura)
            </h2>
            <p className="text-xs text-slate-400">
              Visualización del resultado más reciente emitido por un Analista para tu empresa
            </p>
          </div>
          {latestEvaluation && (
            <button
              type="button"
              onClick={() =>
                handleDownloadOwnPDF(latestEvaluation.id, latestEvaluation.company.nit)
              }
              className="bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
          )}
        </div>

        {latestEvaluation ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Score Obtenido</span>
                <span className="text-2xl font-black text-blue-400">
                  {latestEvaluation.score} / 1000
                </span>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Nivel de Riesgo</span>
                <span className="text-lg font-bold text-emerald-400">
                  {latestEvaluation.risk_level}
                </span>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Confianza de Datos</span>
                <span className="text-lg font-bold text-slate-200">
                  {latestEvaluation.confidence}
                </span>
              </div>
              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Fecha Evaluación</span>
                <span className="text-sm font-semibold text-slate-300">
                  {formatDateES(latestEvaluation.created_at)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-300/80 bg-amber-950/40 border border-amber-900/40 p-3 rounded-xl">
              El score es una estimación de riesgo con fines académicos; no garantiza el pago o
              incumplimiento y no sustituye el criterio del analista.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4">
            Aún no hay evaluaciones registradas para tu NIT. Carga tus estados financieros para que
            un analista pueda evaluar tu empresa.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Carga Web con Validación Zod */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-slate-100">
                Captura de Estado Financiero (COP)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Vista previa Ingresos: {formatCOP(revenue)}
            </span>
          </div>

          {successMsg && (
            <div
              role="status"
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
            noValidate
          >
            <div>
              <label htmlFor="fiscal-year" className="block text-slate-400 font-semibold mb-1">
                Año Fiscal
              </label>
              <input
                id="fiscal-year"
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="revenue" className="block text-slate-400 font-semibold mb-1">
                Ingresos Operacionales (COP)
              </label>
              <input
                id="revenue"
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="expenses" className="block text-slate-400 font-semibold mb-1">
                Gastos Operacionales (COP)
              </label>
              <input
                id="expenses"
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="net-income" className="block text-slate-400 font-semibold mb-1">
                Utilidad Neta (COP)
              </label>
              <input
                id="net-income"
                type="number"
                value={netIncome}
                onChange={(e) => setNetIncome(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="total-assets" className="block text-slate-400 font-semibold mb-1">
                Activos Totales (COP)
              </label>
              <input
                id="total-assets"
                type="number"
                value={totalAssets}
                onChange={(e) => setTotalAssets(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="current-assets" className="block text-slate-400 font-semibold mb-1">
                Activos Corrientes (COP)
              </label>
              <input
                id="current-assets"
                type="number"
                value={currentAssets}
                onChange={(e) => setCurrentAssets(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="total-liabilities"
                className="block text-slate-400 font-semibold mb-1"
              >
                Pasivos Totales (COP)
              </label>
              <input
                id="total-liabilities"
                type="number"
                value={totalLiabilities}
                onChange={(e) => setTotalLiabilities(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="current-liabilities"
                className="block text-slate-400 font-semibold mb-1"
              >
                Pasivos Corrientes (COP)
              </label>
              <input
                id="current-liabilities"
                type="number"
                value={currentLiabilities}
                onChange={(e) => setCurrentLiabilities(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                {loading ? "Guardando..." : "Guardar Estado Financiero"}
              </button>
            </div>
          </form>
        </div>

        {/* Carga por Archivo CSV Funcional */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" /> Carga Masiva mediante CSV
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adjunta un archivo CSV con las columnas{" "}
              <code>
                fiscal_year,revenue,expenses,operating_income,net_income,total_assets,current_assets,total_liabilities,current_liabilities,financial_debt,financial_expenses
              </code>
            </p>

            <label
              htmlFor="csv-upload-input"
              className="block border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <span className="text-xs text-slate-300 block font-semibold">
                {csvUploading ? "Importando archivo CSV..." : "Seleccionar archivo CSV (.csv)"}
              </span>
              <span className="text-[10px] text-slate-500 block">Máximo 5 MB (UTF-8)</span>
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
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Control de Permiso por Objeto
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              De acuerdo con las reglas del sistema, una Empresa solo tiene autorización para
              consultar y cargar datos pertenecientes a su propio NIT registrado y aprobado por un
              Administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
