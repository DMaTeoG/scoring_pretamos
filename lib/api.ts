import { CSVImportResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface APIErrorPayload {
  code?: string;
  message?: string;
  detail?: string;
}

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      endpoint,
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
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/companies/${companyId}/financial-statements/import-csv/`,
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
  const response = await fetch(`${API_BASE_URL}/evaluations/${evaluationId}/report.pdf`, {
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
