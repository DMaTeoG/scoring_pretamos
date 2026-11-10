import { CSVImportResponse } from "./types";

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
