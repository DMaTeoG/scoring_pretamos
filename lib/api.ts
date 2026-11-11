import { CreditDecisionStatus, CSVImportResponse, Evaluation } from "./types";

export const getApiBaseUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local");

    if (!isLocalhost) {
      return "https://prestamo-bancos-bac.onrender.com/api/v1";
    }
  }

  return "http://localhost:8000/api/v1";
};

interface APIErrorPayload {
  code?: string;
  message?: string;
  detail?: string;
}

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${baseUrl}${normalizedEndpoint}`, {
    ...options,
    headers,
    // Always include httpOnly cookies (AGENTS.md §6: never store JWT in localStorage)
    credentials: "include",
  });

  if (!response.ok) {
    const errorData: APIErrorPayload = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.message || errorData.detail || "Error en la comunicación con el servidor.";
    console.error("[Scoring API Error]", {
      endpoint: normalizedEndpoint,
      baseUrl,
      method: options.method || "GET",
      status: response.status,
      code: errorData.code || "HTTP_ERROR",
      message: errorMessage,
    });
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function uploadCSVFile(
  companyId: number,
  file: File
): Promise<CSVImportResponse> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${baseUrl}/companies/${companyId}/financial-statements/import-csv/`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData: APIErrorPayload = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.message || errorData.detail || "No se pudo importar el archivo CSV.";
    console.error("[Scoring CSV Import Error]", {
      companyId,
      status: response.status,
      code: errorData.code || "CSV_ERROR",
      message: errorMessage,
    });
    throw new Error(errorMessage);
  }

  return response.json() as Promise<CSVImportResponse>;
}

export async function downloadReportPDF(evaluationId: number): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/evaluations/${evaluationId}/report.pdf`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    console.error("[Scoring PDF Download Error]", {
      evaluationId,
      status: response.status,
    });
    throw new Error("No se pudo descargar el informe PDF.");
  }

  return response.blob();
}

export function formatCOP(value: number | string | null | undefined): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (Number.isNaN(numeric)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDateES(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

const EVALUATIONS_STORE_KEY = "scoring_evaluations_store_v1";

export function getStoredEvaluations(): Evaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVALUATIONS_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Evaluation[]) : [];
  } catch {
    return [];
  }
}

export function upsertStoredEvaluation(item: Evaluation): Evaluation[] {
  if (typeof window === "undefined") return [item];
  const current = getStoredEvaluations();
  const normalized: Evaluation = {
    ...item,
    decision_status: item.decision_status || "PENDING",
  };
  const updated = [normalized, ...current.filter((e) => e.id !== normalized.id)];
  try {
    window.localStorage.setItem(EVALUATIONS_STORE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

export function mergeEvaluationsWithStore(apiList: Evaluation[]): Evaluation[] {
  const stored = getStoredEvaluations();
  const storedById = new Map<number, Evaluation>();
  for (const s of stored) {
    storedById.set(s.id, s);
  }

  const merged: Evaluation[] = [];
  const seenIds = new Set<number>();

  for (const apiItem of apiList) {
    seenIds.add(apiItem.id);
    const localMatch = storedById.get(apiItem.id);
    merged.push({
      ...apiItem,
      requested_amount:
        apiItem.requested_amount ?? localMatch?.requested_amount ?? null,
      term_months: apiItem.term_months ?? localMatch?.term_months ?? null,
      decision_status:
        apiItem.decision_status && apiItem.decision_status !== "PENDING"
          ? apiItem.decision_status
          : localMatch?.decision_status || apiItem.decision_status || "PENDING",
      decided_by_email:
        apiItem.decided_by_email ?? localMatch?.decided_by_email ?? null,
      decided_at: apiItem.decided_at ?? localMatch?.decided_at ?? null,
    });
  }

  for (const localItem of stored) {
    if (!seenIds.has(localItem.id)) {
      merged.push(localItem);
    }
  }

  return merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function updateStoredEvaluationDecision(
  evalId: number,
  decisionStatus: CreditDecisionStatus,
  decidedByEmail: string
): Evaluation | null {
  if (typeof window === "undefined") return null;
  const current = getStoredEvaluations();
  let updatedTarget: Evaluation | null = null;
  const nowIso = new Date().toISOString();

  const updated = current.map((e) => {
    if (e.id === evalId) {
      updatedTarget = {
        ...e,
        decision_status: decisionStatus,
        decided_by_email: decidedByEmail,
        decided_at: nowIso,
      };
      return updatedTarget;
    }
    return e;
  });

  try {
    window.localStorage.setItem(EVALUATIONS_STORE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updatedTarget;
}
