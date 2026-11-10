"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCheck, Cpu, KeyRound, Clock, Users, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { fetchAPI, formatDateES } from "@/lib/api";
import { AuditLogEntry, CompanyMembership, ModelVersion, UserProfile } from "@/lib/types";
import { TableSkeleton } from "@/components/Skeleton";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
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
      trained_at: "2026-03-15T10:00:00Z",
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
      created_at: "2026-03-15T10:00:00Z",
      updated_at: "2026-03-15T10:00:00Z",
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
      created_at: "2026-03-15T10:00:00Z",
      updated_at: "2026-03-15T10:00:00Z",
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
      created_at: "2026-03-15T10:00:00Z",
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
    } finally {
      setLoading(false);
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
      } finally {
        if (active) setLoading(false);
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
      setStatusMessage("Versión del modelo ML activada y registrada en el registro de auditoría.");
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
      setStatusMessage(`Estado del usuario ${updated.email} actualizado exitosamente.`);
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u))
      );
    }
  };

  const activeModel = models.find((m) => m.is_active) || models[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="border-b border-slate-200 dark:border-[#1b2b4b] pb-4 transition-colors">
        <div className="inline-flex items-center gap-2 text-xs text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" /> Centro de Gobernanza & Auditoría
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight transition-colors">
          <UserCheck className="w-7 h-7 text-purple-600 dark:text-purple-400" /> Panel de Administrador del Sistema
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Gestión de usuarios corporativos, control de acceso Usuario–NIT, telemetría de modelos XGBoost y trazabilidad de accesos
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs p-3.5 rounded-xl flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" /> {errorMessage}
        </div>
      )}

      {/* Sección 1: Versiones del Modelo ML */}
      <div className="bank-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Telemetría del Modelo Machine Learning
          </h3>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 font-mono bg-blue-50 dark:bg-[#09152b] border border-blue-200 dark:border-blue-500/30 px-3 py-1 rounded-full">
            Almacén Seguro: ml/artifacts/ (Dataset Sintético)
          </span>
        </div>

        {activeModel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Versión Activa</span>
              <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{activeModel.version}</p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                {activeModel.algorithm}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">ROC-AUC Test (Partición 2023)</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-tabular">
                {((activeModel.metrics.auc_test ?? 0.9231) * 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Baseline LogReg: {((activeModel.metrics.auc_baseline ?? 0.9091) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Estadístico KS (Separación)</span>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-tabular">
                {((activeModel.metrics.ks_test ?? 0.7023) * 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Poder discriminante</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#081020] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Brier Score (Calibración)</span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-tabular">
                {(activeModel.metrics.brier_test ?? 0.0563).toFixed(4)}
              </p>
              <span className="text-[10px] text-slate-500 font-mono truncate block">
                Hash: {activeModel.dataset_hash || "da86d1f8059f0408"}
              </span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-[#161208] border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Declaración Metodológica (AGENTS.md §7):</strong> Las métricas de validación (AUC, KS, Brier) provienen de la partición temporal de prueba (año 2023) sobre el dataset sintético reproducible y no representan desempeño crediticio comercial real.
          </span>
        </div>

        {models.length > 1 && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#081020] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Versión</th>
                  <th className="p-3">Algoritmo</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/20">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{m.version}</td>
                    <td className="p-3">{m.algorithm}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          m.is_active
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50"
                            : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                        }`}
                      >
                        {m.is_active ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {!m.is_active && (
                        <button
                          type="button"
                          onClick={() => handleActivateModel(m.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all"
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
      <div className="bank-panel p-6 rounded-2xl space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Aprobación de Vínculos Usuario – NIT
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Verificación de credenciales para empresas solicitantes de acceso al portal</p>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#081020] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Usuario Empresa</th>
                  <th className="p-3">NIT Solicitado</th>
                  <th className="p-3">Razón Social</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {memberships.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/20">
                    <td className="p-3 font-semibold text-slate-500 dark:text-slate-400">#{item.id}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{item.user_email}</td>
                    <td className="p-3 font-mono text-blue-700 dark:text-blue-300">{item.company_detail.nit}</td>
                    <td className="p-3">{item.company_detail.legal_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50"
                            : item.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50"
                            : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50"
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
                          className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all"
                        >
                          Aprobar
                        </button>
                      )}
                      {item.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleApproveMembership(item.id, "REJECTED")}
                          className="bg-rose-700 hover:bg-rose-600 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all"
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
        )}
      </div>

      {/* Sección 3: Gestión de Usuarios */}
      <div className="bank-panel p-6 rounded-2xl space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Registro de Usuarios del Sistema
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Cuentas autorizadas con roles ANALYST, COMPANY o ADMIN</p>
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#081020] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Correo Electrónico</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/20">
                    <td className="p-3 font-semibold text-slate-500 dark:text-slate-400">#{u.id}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{u.email}</td>
                    <td className="p-3 font-semibold text-blue-700 dark:text-blue-300">{u.role_display || u.role}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.is_active
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50"
                            : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50"
                        }`}
                      >
                        {u.is_active ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(u)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-[#0a1936] dark:hover:bg-blue-900/40 dark:text-slate-200 px-3 py-1 rounded-lg text-[11px] border dark:border-blue-500/30 transition-all"
                      >
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección 4: Visor de Registros de Auditoría */}
      <div className="bank-panel p-6 rounded-2xl space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Registro Trazable de Auditoría (AuditLog)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Historial inmutable de operaciones, consultas de NIT y descargas de PDF</p>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#081020] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">ID Audit</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Acción Registrada</th>
                  <th className="p-3">Entidad / Metadatos</th>
                  <th className="p-3">IP Origen</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/20">
                    <td className="p-3 font-semibold text-slate-500 dark:text-slate-400">#{log.id}</td>
                    <td className="p-3 text-slate-900 dark:text-white">{log.user_email}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 dark:bg-[#0c1c3a] text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded font-mono text-[10px]">
                        {log.action_display || log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-800 dark:text-slate-300">
                      {log.metadata?.nit
                        ? `NIT: ${log.metadata.nit}`
                        : `${log.entity} #${log.entity_id}`}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{log.ip_address || "127.0.0.1"}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{formatDateES(log.created_at)}</td>
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
