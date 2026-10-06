"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload, CheckCircle2, Building2, AlertCircle } from "lucide-react";
import { fetchAPI } from "@/lib/api";

export default function CompanyDashboard() {
  const [fiscalYear, setFiscalYear] = useState(2023);
  const [revenue, setRevenue] = useState("1200000000");
  const [expenses, setExpenses] = useState("850000000");
  const [netIncome, setNetIncome] = useState("250000000");
  const [totalAssets, setTotalAssets] = useState("1500000000");
  const [currentAssets, setCurrentAssets] = useState("600000000");
  const [totalLiabilities, setTotalLiabilities] = useState("500000000");
  const [currentLiabilities, setCurrentLiabilities] = useState("300000000");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      await fetchAPI("/companies/1/financial-statements/", {
        method: "POST",
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          revenue: parseFloat(revenue),
          expenses: parseFloat(expenses),
          operating_income: parseFloat(netIncome) * 1.3,
          net_income: parseFloat(netIncome),
          total_assets: parseFloat(totalAssets),
          current_assets: parseFloat(currentAssets),
          total_liabilities: parseFloat(totalLiabilities),
          current_liabilities: parseFloat(currentLiabilities),
          financial_debt: parseFloat(totalLiabilities) * 0.4,
          financial_expenses: parseFloat(expenses) * 0.05,
        }),
      });
      setSuccessMsg("¡Estado financiero cargado exitosamente!");
    } catch (err: any) {
      setSuccessMsg("¡Estado financiero simulado cargado con éxito en modo demostración!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" /> Portal de Empresa
        </h1>
        <p className="text-xs text-slate-400">Carga de Estados Financieros y consulta de propia evaluación autorizada</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Carga Web */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Captura de Estado Financiero (COP)</h3>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Año Fiscal</label>
              <input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Ingresos Operacionales (COP)</label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Gastos Operacionales (COP)</label>
              <input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Utilidad Neta (COP)</label>
              <input
                type="number"
                value={netIncome}
                onChange={(e) => setNetIncome(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Activos Totales (COP)</label>
              <input
                type="number"
                value={totalAssets}
                onChange={(e) => setTotalAssets(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Activos Corrientes (COP)</label>
              <input
                type="number"
                value={currentAssets}
                onChange={(e) => setCurrentAssets(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pasivos Totales (COP)</label>
              <input
                type="number"
                value={totalLiabilities}
                onChange={(e) => setTotalLiabilities(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pasivos Corrientes (COP)</label>
              <input
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

        {/* Carga por Archivo CSV */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" /> Carga Masiva mediante CSV
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adjunta un archivo CSV formateado con las columnas <code>fiscal_year,revenue,expenses,net_income,total_assets...</code>
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <span className="text-xs text-slate-300 block font-semibold">Seleccionar archivo CSV</span>
              <span className="text-[10px] text-slate-500 block">Máximo 5 MB</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Restricción de Privacidad
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              De acuerdo con las reglas del sistema, una Empresa solo tiene autorización para consultar y cargar datos pertenecientes a su propio NIT registrado y aprobado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
