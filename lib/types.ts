export type UserRole = "ANALYST" | "COMPANY" | "ADMIN";

export interface UserProfile {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  role_display: string;
  is_active: boolean;
  created_at?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export interface CompanyProfile {
  id?: number;
  nit: string;
  dv?: string;
  legal_name: string;
  ciiu: string;
  registration_date?: string | null;
  status: string;
  city: string;
  size: "MICRO" | "PEQUENA" | "MEDIANA" | "GRANDE" | string;
  last_synced_at?: string;
  created_at?: string;
}

export interface FinancialRatios {
  current_ratio: number | null;
  debt_ratio: number | null;
  net_margin: number | null;
  roa: number | null;
  interest_coverage: number | null;
  revenue_growth: number | null;
  confidence_level: "ALTA" | "MEDIA" | "BAJA";
  missing_ratios_count: number;
}

export interface FinancialStatement {
  id: number;
  company: number;
  fiscal_year: number;
  revenue: string | number;
  expenses: string | number;
  operating_income: string | number;
  net_income: string | number;
  total_assets: string | number;
  current_assets: string | number;
  total_liabilities: string | number;
  current_liabilities: string | number;
  financial_debt: string | number;
  financial_expenses: string | number;
  origin: "COMPANY" | "PUBLIC" | "SYNTHETIC";
  uploaded_by: number | null;
  created_at: string;
  ratios: FinancialRatios;
}

export interface ShapFactor {
  feature: string;
  val: number;
  impact: number;
  text: string;
}

export type RiskLevel = "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO";

export interface Evaluation {
  id: number;
  company: CompanyProfile;
  requested_by_email?: string;
  model_version_name: string;
  pd: number;
  score: number;
  risk_level: RiskLevel;
  confidence: "ALTA" | "MEDIA" | "BAJA" | string;
  factors: ShapFactor[];
  inputs_snapshot?: {
    financial_statement_id?: number;
    fiscal_year?: number;
    ratios?: FinancialRatios;
  };
  disclaimer: string;
  created_at: string;
}

export interface CompanyMembership {
  id: number;
  user: number;
  user_email: string;
  company: number;
  company_detail: CompanyProfile;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ModelMetrics {
  auc_baseline?: number;
  auc_test?: number;
  ks_test?: number;
  brier_test?: number;
  test_sample_size?: number;
  dataset_hash?: string;
}

export interface ModelVersion {
  id: number;
  version: string;
  algorithm: string;
  features: string[];
  metrics: ModelMetrics;
  dataset_hash: string;
  is_active: boolean;
  trained_at: string;
}

export interface AuditLogEntry {
  id: number;
  user: number | null;
  user_email: string;
  action: string;
  action_display: string;
  entity: string;
  entity_id: string;
  ip_address: string | null;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
}

export interface CSVImportResponse {
  message: string;
  imported_count: number;
}
