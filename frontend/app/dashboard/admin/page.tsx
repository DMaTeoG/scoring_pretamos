"use client";

import { useState } from "react";
import { UserCheck, Cpu, ShieldAlert, CheckCircle2, RefreshCw, KeyRound, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [modelActive, setModelActive] = useState(true);
  const [memberships, setMemberships] = useState([
    { id: 101, email: "representante@empresa.com", nit: "900123456-7", company_name: "EMPRESA SIMULADA S.A.S.", status: "PENDING", date: "2026-10-06" },
    { id: 102, email: "contacto@bancolombia.com", nit: "800197268-4", company_name: "BANCOLOMBIA S.A.", status: "APPROVED", date: "2026-10-05" },
  ]);

  const [auditLogs] = useState([
    { id: 501, user: "analista@banco.com", action: "SEARCH_NIT", nit: "800197268-4", date: "2026-10-06 14:50:12", ip: "127.0.0.1" },
    { id: 502, user: "analista@banco.com", action: "EVALUATION_REQUEST", nit: "800197268-4", date: "2026-10-06 14:52:05", ip: "127.0.0.1" },
    { id: 503, user: "analista@banco.com", action: "REPORT_DOWNLOAD", nit: "800197268-4", date: "2026-10-06 14:53:22", ip: "127.0.0.1" },
  ]);

  const handleApprove = (id: number) => {
    setMemberships((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "APPROVED" } : m))
    );
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-purple-400" /> Panel de Administrador de Sistema
        </h1>
        <p className="text-xs text-slate-400">Gestión de usuarios, aprobación de vínculos, modelos de ML y registros de auditoría</p>
      </div>

      {/* Seccion 1: Versiones del Modelo ML */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" /> Versiones del Modelo Machine Learning
          </h3>
          <span className="text-xs text-blue-400 font-mono bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Artefactos en: ml/artifacts/
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500">Versión</span>
            <p className="text-base font-bold text-slate-100">xgb-2026.1</p>
            <span className="text-[10px] text-emerald-400 font-semibold block">ACTIVO</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500">ROC-AUC Test</span>
            <p className="text-base font-bold text-emerald-400">92.31%</p>
            <span className="text-[10px] text-slate-400">Partición Temporal 2023</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500">KS Statistic</span>
            <p className="text-base font-bold text-blue-400">70.23%</p>
            <span className="text-[10px] text-slate-400">Separación de Riesgo</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500">Brier Score</span>
            <p className="text-base font-bold text-purple-400">0.0563</p>
            <span className="text-[10px] text-slate-400">Calibración Sigmoide</span>
          </div>
        </div>
      </div>

      {/* Seccion 2: Aprobacion de Vínculos Usuario-Empresa */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-400" /> Aprobación de Vínculos Usuario – NIT
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Usuario Empresa</th>
                <th className="p-3">NIT Solicitado</th>
                <th className="p-3">Razón Social</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memberships.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold">#{item.id}</td>
                  <td className="p-3">{item.email}</td>
                  <td className="p-3 font-mono text-blue-400">{item.nit}</td>
                  <td className="p-3">{item.company_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {item.status === "APPROVED" ? "APROBADO" : "PENDIENTE"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {item.status === "PENDING" && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all"
                      >
                        Aprobar Vínculo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seccion 3: Visor de Registros de Auditoria */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" /> Registro de Auditoría (AuditLog)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">ID Audit</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Acción Registrada</th>
                <th className="p-3">NIT / Entidad</th>
                <th className="p-3">IP Origen</th>
                <th className="p-3">Fecha / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold">#{log.id}</td>
                  <td className="p-3">{log.user}</td>
                  <td className="p-3">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{log.nit}</td>
                  <td className="p-3 text-slate-400">{log.ip}</td>
                  <td className="p-3 text-slate-400">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
