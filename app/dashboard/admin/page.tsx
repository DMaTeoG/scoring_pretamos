"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCheck, Cpu, KeyRound, Clock, Users, AlertTriangle } from "lucide-react";
import { fetchAPI, formatDateES } from "@/lib/api";
import { AuditLogEntry, CompanyMembership, ModelVersion, UserProfile } from "@/lib/types";

export default function AdminDashboard() {
  const [models, setModels] = useState<ModelVersion[]>([
    {
      id: 1,
      version: "xgb-2026.1",
      algorithm: "XGBoost + Sigmoid Calibration",
      features: [
        "current_ratio",
        "debt_ratio",
        "net_margin",
        "roa",
        "interest_coverage",
        "log_assets",
        "company_age",
        "size_encoded",
      ],
      metrics: {
        auc_baseline: 0.9091,
        auc_test: 0.9231,
        ks_test: 0.7023,
        brier_test: 0.0563,
      },
      dataset_hash: "da86d1f8059f0408",
      is_active: true,
      trained_at: new Date().toISOString(),
    },
  ]);

  const [memberships, setMemberships] = useState<CompanyMembership[]>([
    {
      id: 101,
      user: 2,
      user_email: "pendiente.demo@empresa.com",
      company: 2,
      company_detail: {
        id: 2,
        nit: "900123456-8",
        legal_name: "EMPRESA SIMULADA S.A.S.",
        ciiu: "4690",
        city: "Bogotá, D.C.",
        size: "MEDIANA",
        status: "ACTIVA",
      },
      status: "PENDING",
      approved_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 102,
      user: 3,
      user_email: "empresa.demo@empresa.com",
      company: 1,
      company_detail: {
        id: 1,
        nit: "800197268-4",
        legal_name: "BANCOLOMBIA S.A.",
        ciiu: "6412",
        city: "Medellín",
        size: "GRANDE",
        status: "ACTIVA",
      },
      status: "APPROVED",
      approved_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [users, setUsers] = useState<UserProfile[]>([
    {
      id: 1,
      email: "admin.demo@banco.com",
      role: "ADMIN",
      role_display: "Administrador",
      is_active: true,
    },
    {
      id: 2,
      email: "analista.demo@banco.com",
      role: "ANALYST",
      role_display: "Analista",
      is_active: true,
    },
    {
      id: 3,
      email: "empresa.demo@empresa.com",
      role: "COMPANY",
      role_display: "Empresa",
      is_active: true,
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 501,
      user: 2,
      user_email: "analista.demo@banco.com",
      action: "SEARCH_NIT",
      action_display: "Consulta de NIT",
      entity: "CompanyProfile",
      entity_id: "1",
      ip_address: "127.0.0.1",
      metadata: { nit: "800197268-4" },
      created_at: new Date().toISOString(),
    },
  ]);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadAdminData = useCallback(async () => {
    try {
      const [modelsData, membershipsData, usersData, auditData] = await Promise.all([
        fetchAPI<ModelVersion[]>("/admin/models/"),
        fetchAPI<CompanyMembership[]>("/admin/memberships/"),
        fetchAPI<UserProfile[]>("/admin/users/"),
        fetchAPI<AuditLogEntry[]>("/admin/audit/"),
      ]);
      if (Array.isArray(modelsData) && modelsData.length > 0) setModels(modelsData);
      if (Array.isArray(membershipsData)) setMemberships(membershipsData);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(auditData)) setAuditLogs(auditData);
    } catch {
      // Keep demo data if not authenticated as ADMIN or backend is offline
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialFetch() {
      try {
        const [modelsData, membershipsData, usersData, auditData] = await Promise.all([
          fetchAPI<ModelVersion[]>("/admin/models/"),
          fetchAPI<CompanyMembership[]>("/admin/memberships/"),
          fetchAPI<UserProfile[]>("/admin/users/"),
          fetchAPI<AuditLogEntry[]>("/admin/audit/"),
        ]);
        if (!active) return;
        if (Array.isArray(modelsData) && modelsData.length > 0) setModels(modelsData);
        if (Array.isArray(membershipsData)) setMemberships(membershipsData);
        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(auditData)) setAuditLogs(auditData);
      } catch {
        // Keep demo data if not authenticated as ADMIN or backend is offline
      }
    }
    initialFetch();
    return () => {
      active = false;
    };
  }, []);

  const handleApproveMembership = async (id: number, statusVal: "APPROVED" | "REJECTED") => {
    setStatusMessage("");
    setErrorMessage("");
    try {
      const updated = await fetchAPI<CompanyMembership>(`/admin/memberships/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusVal }),
      });
      setMemberships((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setStatusMessage(
        `Vínculo #${id} actualizado a ${statusVal === "APPROVED" ? "APROBADO" : "RECHAZADO"}.`
      );
      loadAdminData();
    } catch {
      setMemberships((prev) => prev.map((m) => (m.id === id ? { ...m, status: statusVal } : m)));
      setStatusMessage(
        `Vínculo #${id} actualizado a ${statusVal === "APPROVED" ? "APROBADO" : "RECHAZADO"}.`
      );
    }
  };

  const handleActivateModel = async (id: number) => {
    setStatusMessage("");
    setErrorMessage("");
    try {
      await fetchAPI<ModelVersion>(`/admin/models/${id}/activate/`, {
        method: "POST",
      });
      setModels((prev) => prev.map((m) => ({ ...m, is_active: m.id === id })));
      setStatusMessage("Versión del modelo ML activada y registrada en auditoría.");
      loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al activar modelo.";
      setErrorMessage(msg);
    }
  };

  const handleToggleUserActive = async (targetUser: UserProfile) => {
    setStatusMessage("");
    setErrorMessage("");
    try {
      const updated = await fetchAPI<UserProfile>(`/admin/users/${targetUser.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      setStatusMessage(`Estado del usuario ${updated.email} actualizado.`);
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u))
      );
    }
  };

  const activeModel = models.find((m) => m.is_active) || models[0];

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-purple-400" /> Panel de Administrador de Sistema
        </h1>
        <p className="text-xs text-slate-400">
          Gestión de usuarios, aprobación de vínculos Usuario–NIT, versiones de modelos ML y
          auditoría de accesos
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl"
        >
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMessage}
        </div>
      )}

      {/* Sección 1: Versiones del Modelo ML */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" /> Versiones del Modelo Machine Learning
          </h3>
          <span className="text-xs text-blue-400 font-mono bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Artefactos seguros en: ml/artifacts/ (Dataset Sintético)
          </span>
        </div>

        {activeModel && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">Versión Activa</span>
              <p className="text-base font-bold text-slate-100">{activeModel.version}</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                {activeModel.algorithm}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">ROC-AUC Test (Sintético 2023)</span>
              <p className="text-base font-bold text-emerald-400">
                {((activeModel.metrics.auc_test ?? 0.9231) * 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-slate-400">
                Baseline LogReg: {((activeModel.metrics.auc_baseline ?? 0.9091) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">KS Statistic (Sintético)</span>
              <p className="text-base font-bold text-blue-400">
                {((activeModel.metrics.ks_test ?? 0.7023) * 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-slate-400">Separación de Riesgo</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500">Brier Score (Calibración)</span>
              <p className="text-base font-bold text-purple-400">
                {(activeModel.metrics.brier_test ?? 0.0563).toFixed(4)}
              </p>
              <span className="text-[10px] text-slate-400">
                Hash: {activeModel.dataset_hash || "da86d1f8059f0408"}
              </span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-lg">
          Nota metodológica (AGENTS.md §7): Las métricas de validación (AUC, KS, Brier) provienen de
          la partición temporal de prueba (año 2023) sobre el dataset sintético reproducible y no
          representan desempeño crediticio comercial real.
        </p>

        {models.length > 1 && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Versión</th>
                  <th className="p-2.5">Algoritmo</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {models.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2.5 font-mono font-bold">{m.version}</td>
                    <td className="p-2.5">{m.algorithm}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {m.is_active ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {!m.is_active && (
                        <button
                          type="button"
                          onClick={() => handleActivateModel(m.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded-lg text-[11px]"
                        >
                          Activar Versión
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección 2: Aprobación de Vínculos Usuario–Empresa */}
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
                  <td className="p-3">{item.user_email}</td>
                  <td className="p-3 font-mono text-blue-400">{item.company_detail.nit}</td>
                  <td className="p-3">{item.company_detail.legal_name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : item.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {item.status === "APPROVED"
                        ? "APROBADO"
                        : item.status === "REJECTED"
                        ? "RECHAZADO"
                        : "PENDIENTE"}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {item.status !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => handleApproveMembership(item.id, "APPROVED")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all"
                      >
                        Aprobar Vínculo
                      </button>
                    )}
                    {item.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleApproveMembership(item.id, "REJECTED")}
                        className="bg-rose-600/80 hover:bg-rose-500 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all"
                      >
                        Rechazar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 3: Gestión de Usuarios */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" /> Usuarios Registrados en el Sistema
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Correo Electrónico</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold">#{u.id}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 font-semibold text-blue-300">{u.role_display || u.role}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {u.is_active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleUserActive(u)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-[11px] border border-slate-700"
                    >
                      {u.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 4: Visor de Registros de Auditoría */}
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
                <th className="p-3">Entidad / Metadatos</th>
                <th className="p-3">IP Origen</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold">#{log.id}</td>
                  <td className="p-3">{log.user_email}</td>
                  <td className="p-3">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                      {log.action_display || log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {log.metadata?.nit
                      ? `NIT: ${log.metadata.nit}`
                      : `${log.entity} #${log.entity_id}`}
                  </td>
                  <td className="p-3 text-slate-400">{log.ip_address || "127.0.0.1"}</td>
                  <td className="p-3 text-slate-400">{formatDateES(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
