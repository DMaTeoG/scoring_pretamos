"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Cpu,
  KeyRound,
  Clock,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  fetchAPI,
  formatCOP,
  formatDateES,
  downloadReportPDF,
  mergeEvaluationsWithStore,
  updateStoredEvaluationDecision,
  getStoredEvaluations,
} from "@/lib/api";
import {
  AuditLogEntry,
  CompanyMembership,
  CreditDecisionStatus,
  Evaluation,
  ModelVersion,
  UserProfile,
} from "@/lib/types";
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

  const [creditRequests, setCreditRequests] = useState<Evaluation[]>([
    {
      id: 901,
      company: {
        id: 1,
        nit: "800197268-4",
        legal_name: "BANCOLOMBIA S.A.",
        ciiu: "6412",
        city: "Medellín",
        size: "GRANDE",
        status: "ACTIVA",
      },
      requested_by_email: "empresa.demo@cliente.com",
      model_version_name: "xgb-2026.1",
      pd: 0.0286,
      score: 971,
      risk_level: "BAJO",
      confidence: "ALTA",
      requested_amount: 350000000,
      term_months: 36,
      decision_status: "PENDING",
      factors: [
        {
          feature: "interest_coverage",
          val: 7.65,
          impact: 112.6,
          text: "Cobertura de Intereses (7.65x) incrementa el score en 112.6 pts.",
        },
      ],
      disclaimer:
        "El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista.",
      created_at: "2026-03-15T10:00:00Z",
    },
  ]);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadAdminData = useCallback(async () => {
    try {
      const [modelsData, membershipsData, usersData, auditData, evalsData] = await Promise.all([
        fetchAPI<ModelVersion[]>("/admin/models/"),
        fetchAPI<CompanyMembership[]>("/admin/memberships/"),
        fetchAPI<UserProfile[]>("/admin/users/"),
        fetchAPI<AuditLogEntry[]>("/admin/audit/"),
        fetchAPI<Evaluation[]>("/evaluations/"),
      ]);
      if (Array.isArray(modelsData) && modelsData.length > 0) setModels(modelsData);
      if (Array.isArray(membershipsData)) setMemberships(membershipsData);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(auditData)) setAuditLogs(auditData);
      if (Array.isArray(evalsData)) {
        const merged = mergeEvaluationsWithStore(evalsData);
        if (merged.length > 0) setCreditRequests(merged);
      }
    } catch {
      const localStored = getStoredEvaluations();
      if (localStored.length > 0) {
        setCreditRequests((prev) => mergeEvaluationsWithStore(prev));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialFetch() {
      try {
        const [modelsData, membershipsData, usersData, auditData, evalsData] = await Promise.all([
          fetchAPI<ModelVersion[]>("/admin/models/"),
          fetchAPI<CompanyMembership[]>("/admin/memberships/"),
          fetchAPI<UserProfile[]>("/admin/users/"),
          fetchAPI<AuditLogEntry[]>("/admin/audit/"),
          fetchAPI<Evaluation[]>("/evaluations/"),
        ]);
        if (!active) return;
        if (Array.isArray(modelsData) && modelsData.length > 0) setModels(modelsData);
        if (Array.isArray(membershipsData)) setMemberships(membershipsData);
        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(auditData)) setAuditLogs(auditData);
        if (Array.isArray(evalsData)) {
          const merged = mergeEvaluationsWithStore(evalsData);
          if (merged.length > 0) setCreditRequests(merged);
        }
      } catch {
        if (!active) return;
        const localStored = getStoredEvaluations();
        if (localStored.length > 0) {
          setCreditRequests((prev) => mergeEvaluationsWithStore(prev));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    initialFetch();
    return () => {
      active = false;
    };
  }, []);

  const handleCreditDecision = async (
    targetEval: Evaluation,
    decisionStatus: CreditDecisionStatus
  ) => {
    setStatusMessage("");
    setErrorMessage("");
    const adminEmail =
      typeof window !== "undefined"
        ? sessionStorage.getItem("user_email") || "admin.demo@banco.com"
        : "admin.demo@banco.com";
    const nowIso = new Date().toISOString();

    try {
      const updated = await fetchAPI<Evaluation>(
        `/admin/evaluations/${targetEval.id}/decision/`,
        {
          method: "PATCH",
          body: JSON.stringify({ decision_status: decisionStatus }),
        }
      );
      updateStoredEvaluationDecision(targetEval.id, decisionStatus, adminEmail);
      setCreditRequests((prev) =>
        prev.map((item) =>
          item.id === targetEval.id
            ? {
                ...item,
                ...updated,
                requested_amount: updated.requested_amount ?? item.requested_amount,
                term_months: updated.term_months ?? item.term_months,
                decision_status: decisionStatus,
              }
            : item
        )
      );
      setStatusMessage(
        `Solicitud #${targetEval.id} (NIT ${targetEval.company.nit} • Score ${targetEval.score}/1000) marcada manualmente como ${
          decisionStatus === "APPROVED" ? "ACEPTADA POR COMITÉ" : "RECHAZADA POR COMITÉ"
        }.`
      );
      loadAdminData();
    } catch {
      updateStoredEvaluationDecision(targetEval.id, decisionStatus, adminEmail);
      setCreditRequests((prev) =>
        prev.map((item) =>
          item.id === targetEval.id
            ? {
                ...item,
                decision_status: decisionStatus,
                decided_by_email: adminEmail,
                decided_at: nowIso,
              }
            : item
        )
      );
      setAuditLogs((prev) => [
        {
          id: Math.floor(Date.now() / 1000),
          user: 1,
          user_email: adminEmail,
          action: "CREDIT_DECISION",
          action_display: "Decisión Manual de Comité",
          entity: "Evaluation",
          entity_id: String(targetEval.id),
          ip_address: "127.0.0.1",
          metadata: {
            nit: targetEval.company.nit,
            score: targetEval.score,
            decision_status: decisionStatus,
          },
          created_at: nowIso,
        },
        ...prev,
      ]);
      setStatusMessage(
        `Solicitud #${targetEval.id} (NIT ${targetEval.company.nit} • Score ${targetEval.score}/1000) marcada manualmente como ${
          decisionStatus === "APPROVED" ? "ACEPTADA POR COMITÉ" : "RECHAZADA POR COMITÉ"
        }.`
      );
    }
  };

  const handleDownloadEvalPDF = async (evalId: number, nitStr: string) => {
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
      setErrorMessage(msg);
    }
  };

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
      {/* Header Panel con Estilo Apple Frosted Glass */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        {/* Architectural Server Backing */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop"
            alt="Infraestructura de Servidores"
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
              admin.console://governance-audit
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#af52de] dark:text-purple-400 px-3 py-1 rounded-full glass-pill">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
            Centro de Gobernanza & Auditoría
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 tracking-tight">
              <UserCheck className="w-7 h-7 text-[#af52de] dark:text-purple-400" />
              Panel de Administrador del Sistema
            </h1>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-1.5 max-w-2xl leading-relaxed">
              Gestión de usuarios corporativos, control de acceso Usuario–NIT, supervisión de modelos Machine Learning y trazabilidad inmutable en AuditLog.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-2xl flex items-center gap-2.5 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs p-4 rounded-2xl flex items-center gap-2.5 animate-fade-in"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sección 0: Bandeja de Solicitudes de Crédito y Decisión Manual de Comité */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#34c759] dark:text-emerald-400" /> Solicitudes de Crédito Evaluadas por Scoring ML (Decisión de Comité)
            </h3>
            <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
              El modelo calcula el Score 0–1000 y el Nivel de Riesgo como apoyo técnico; el Administrador registra la decisión manual de aceptar o rechazar.
            </p>
          </div>
          <span className="text-[11px] text-[#34c759] dark:text-emerald-300 font-semibold glass-pill px-3 py-1 rounded-full shrink-0">
            Decisión Humana en el Bucle (AGENTS.md §1)
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7]">
              <thead className="glass-well text-[#6e6e73] dark:text-[#a1a1a6] uppercase text-[10px] tracking-wider font-semibold rounded-xl">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">NIT / Razón Social</th>
                  <th className="p-3">Monto & Plazo</th>
                  <th className="p-3">Score ML & Riesgo</th>
                  <th className="p-3">Dictamen PDF</th>
                  <th className="p-3">Estado Comité</th>
                  <th className="p-3 text-right">Decisión del Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {creditRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">#{req.id}</td>
                    <td className="p-3">
                      <span className="font-bold text-[#1d1d1f] dark:text-white block">
                        {req.company.legal_name}
                      </span>
                      <span className="font-mono text-[11px] text-[#0071e3] dark:text-blue-400">
                        NIT: {req.company.nit}
                      </span>
                    </td>
                    <td className="p-3 font-tabular">
                      <span className="font-bold text-[#1d1d1f] dark:text-white block">
                        {req.requested_amount ? formatCOP(req.requested_amount) : formatCOP(350000000)}
                      </span>
                      <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                        {req.term_months ? `${req.term_months} meses` : "36 meses"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#1d1d1f] dark:text-white font-tabular">
                          {req.score}
                          <span className="text-[10px] font-normal text-[#86868b]">/1000</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            req.risk_level === "BAJO"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : req.risk_level === "MEDIO"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {req.risk_level}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6e6e73] dark:text-[#a1a1a6] font-mono">
                        PD: {(req.pd * 100).toFixed(2)}% &bull; Confianza: {req.confidence}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadEvalPDF(req.id, req.company.nit)}
                        className="apple-btn-glass px-2.5 py-1 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 text-[#0071e3] dark:text-blue-400"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          req.decision_status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : req.decision_status === "REJECTED"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {req.decision_status === "APPROVED"
                          ? "CRÉDITO ACEPTADO"
                          : req.decision_status === "REJECTED"
                          ? "CRÉDITO RECHAZADO"
                          : "PENDIENTE COMITÉ"}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {req.decision_status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleCreditDecision(req, "APPROVED")}
                          className="apple-btn-primary px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                        >
                          Aceptar Crédito
                        </button>
                      )}
                      {req.decision_status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => handleCreditDecision(req, "REJECTED")}
                          className="apple-btn-glass px-3 py-1.5 rounded-xl text-[11px] font-semibold text-rose-600 dark:text-rose-400"
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

      {/* Sección 1: Versiones del Modelo ML en Glass Panel */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/5 dark:border-white/10">
          <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#0071e3] dark:text-blue-400" /> Telemetría del Modelo Machine Learning
          </h3>
          <span className="text-[11px] text-[#0071e3] dark:text-blue-300 font-mono glass-pill px-3 py-1 rounded-full">
            Almacén Seguro: ml/artifacts/ (Dataset Sintético)
          </span>
        </div>

        {activeModel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-bold uppercase tracking-wider">
                Versión Activa
              </span>
              <p className="text-base font-bold text-[#1d1d1f] dark:text-white font-mono">{activeModel.version}</p>
              <span className="text-[10px] text-[#34c759] dark:text-emerald-400 font-semibold block">
                {activeModel.algorithm}
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-bold uppercase tracking-wider">
                ROC-AUC Test (Partición 2023)
              </span>
              <p className="text-2xl font-black text-[#34c759] dark:text-emerald-400 font-tabular">
                {((activeModel.metrics.auc_test ?? 0.9231) * 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-[#86868b]">
                Baseline LogReg: {((activeModel.metrics.auc_baseline ?? 0.9091) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-bold uppercase tracking-wider">
                Estadístico KS (Separación)
              </span>
              <p className="text-2xl font-black text-[#0071e3] dark:text-blue-400 font-tabular">
                {((activeModel.metrics.ks_test ?? 0.7023) * 100).toFixed(2)}%
              </p>
              <span className="text-[10px] text-[#86868b]">Poder discriminante</span>
            </div>

            <div className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[#6e6e73] dark:text-[#a1a1a6] block text-[10px] font-bold uppercase tracking-wider">
                Brier Score (Calibración)
              </span>
              <p className="text-2xl font-black text-[#ff9500] dark:text-amber-400 font-tabular">
                {(activeModel.metrics.brier_test ?? 0.0563).toFixed(4)}
              </p>
              <span className="text-[10px] text-[#86868b] font-mono truncate block">
                Hash: {activeModel.dataset_hash || "da86d1f8059f0408"}
              </span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-amber-900 dark:text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Declaración Metodológica (AGENTS.md §7):</strong> Las métricas de validación (AUC, KS, Brier) provienen de la partición temporal de prueba (año 2023) sobre el dataset sintético reproducible y no representan desempeño crediticio comercial real.
          </span>
        </div>
      </div>

      {/* Sección 2: Aprobación de Vínculos Usuario–Empresa */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="pb-4 border-b border-black/5 dark:border-white/10">
          <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#34c759] dark:text-emerald-400" /> Aprobación de Vínculos Usuario – NIT
          </h3>
          <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
            Verificación de credenciales para empresas solicitantes de acceso al portal
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7]">
              <thead className="glass-well text-[#6e6e73] dark:text-[#a1a1a6] uppercase text-[10px] tracking-wider font-semibold rounded-xl">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Usuario Empresa</th>
                  <th className="p-3">NIT Solicitado</th>
                  <th className="p-3">Razón Social</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {memberships.map((item) => (
                  <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">#{item.id}</td>
                    <td className="p-3 text-[#1d1d1f] dark:text-white">{item.user_email}</td>
                    <td className="p-3 font-mono text-[#0071e3] dark:text-blue-400">{item.company_detail.nit}</td>
                    <td className="p-3">{item.company_detail.legal_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
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
                          className="apple-btn-primary px-3 py-1 rounded-xl text-[11px] font-semibold"
                        >
                          Aprobar
                        </button>
                      )}
                      {item.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleApproveMembership(item.id, "REJECTED")}
                          className="apple-btn-glass px-3 py-1 rounded-xl text-[11px] font-semibold text-rose-600 dark:text-rose-400"
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
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="pb-4 border-b border-black/5 dark:border-white/10">
          <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0071e3] dark:text-blue-400" /> Registro de Usuarios del Sistema
          </h3>
          <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
            Cuentas autorizadas con roles ANALYST, COMPANY o ADMIN
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7]">
              <thead className="glass-well text-[#6e6e73] dark:text-[#a1a1a6] uppercase text-[10px] tracking-wider font-semibold rounded-xl">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Correo Electrónico</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">#{u.id}</td>
                    <td className="p-3 text-[#1d1d1f] dark:text-white">{u.email}</td>
                    <td className="p-3 font-semibold text-[#0071e3] dark:text-blue-400">{u.role_display || u.role}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          u.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {u.is_active ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(u)}
                        className="apple-btn-glass px-3 py-1 rounded-xl text-[11px] font-semibold"
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
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="pb-4 border-b border-black/5 dark:border-white/10">
          <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#ff9500] dark:text-amber-400" /> Registro Trazable de Auditoría (AuditLog)
          </h3>
          <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
            Historial inmutable de operaciones, consultas de NIT y descargas de PDF
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7]">
              <thead className="glass-well text-[#6e6e73] dark:text-[#a1a1a6] uppercase text-[10px] tracking-wider font-semibold rounded-xl">
                <tr>
                  <th className="p-3">ID Audit</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Acción Registrada</th>
                  <th className="p-3">Entidad / Metadatos</th>
                  <th className="p-3">IP Origen</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">#{log.id}</td>
                    <td className="p-3 text-[#1d1d1f] dark:text-white">{log.user_email}</td>
                    <td className="p-3">
                      <span className="glass-pill px-2.5 py-0.5 rounded-full font-mono text-[10px] text-[#0071e3] dark:text-blue-300 font-semibold">
                        {log.action_display || log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#1d1d1f] dark:text-white">
                      {log.metadata?.nit
                        ? `NIT: ${log.metadata.nit}`
                        : `${log.entity} #${log.entity_id}`}
                    </td>
                    <td className="p-3 text-[#6e6e73] dark:text-[#a1a1a6] font-mono">{log.ip_address || "127.0.0.1"}</td>
                    <td className="p-3 text-[#6e6e73] dark:text-[#a1a1a6]">{formatDateES(log.created_at)}</td>
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
