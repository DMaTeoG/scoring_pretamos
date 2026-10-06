import os
import joblib
import pandas as pd
import numpy as np
from django.conf import settings
from rest_framework.exceptions import ValidationError

from apps.scoring.models import ModelVersion, Evaluation, RiskLevel
from apps.financials.models import FinancialStatement
from apps.financials.ratios import calculate_financial_ratios
from apps.audit.services import log_action
from apps.audit.models import AuditAction
from ml.src.features import build_features


FEATURE_DESCRIPTIONS = {
    "current_ratio": "Razón Corriente (Liquidez)",
    "debt_ratio": "Nivel de Endeudamiento (Pasivos / Activos)",
    "net_margin": "Margen Neto de Utilidad",
    "roa": "Rentabilidad sobre Activos (ROA)",
    "interest_coverage": "Cobertura de Intereses",
    "log_assets": "Escala de Activos Totales",
    "company_age": "Antigüedad de la Empresa",
    "size_encoded": "Tamaño Empresarial",
}


def get_active_model_version() -> ModelVersion:
    """Retorna la versión de modelo actualmente activa o registra el artefacto predeterminado."""
    active_model = ModelVersion.objects.filter(is_active=True).first()
    if active_model:
        return active_model

    # Si no hay modelo activo, busca o registra el modelo por defecto en ml/artifacts
    artifact_path = getattr(settings, "MODEL_ARTIFACT_DIR") / "scoring_xgb_v1.joblib"
    if not os.path.exists(artifact_path):
        # Fallback al script de entrenamiento si aún no se ha ejecutado
        from ml.src.train import train_and_export_model
        train_and_export_model()

    if os.path.exists(artifact_path):
        artifact_data = joblib.load(artifact_path)
        active_model = ModelVersion.objects.create(
            version=artifact_data.get("version", "xgb-2026.1"),
            algorithm=artifact_data.get("algorithm", "XGBoost + Calibración"),
            features=artifact_data.get("feature_names", []),
            metrics=artifact_data.get("metrics", {}),
            dataset_hash=artifact_data.get("dataset_hash", ""),
            artifact_path=str(artifact_path),
            is_active=True,
        )
        return active_model

    raise ValidationError("No se encontró ningún modelo de scoring activo ni artefacto disponible.")


def calculate_risk_level(score: int) -> str:
    if score >= 750:
        return RiskLevel.BAJO
    elif score >= 500:
        return RiskLevel.MEDIO
    elif score >= 250:
        return RiskLevel.ALTO
    else:
        return RiskLevel.MUY_ALTO


def generate_shap_explanations(feature_series: pd.Series, pd_val: float) -> list[dict]:
    """
    Genera explicaciones SHAP simuladas/heurísticas basadas en desviaciones
    respecto a los estándares ideales financieros, en texto en español.
    """
    factors = []
    
    # 1. Endeudamiento
    debt = feature_series.get("debt_ratio", 0.5)
    if debt > 0.7:
        factors.append({
            "feature": "debt_ratio",
            "val": float(round(debt, 2)),
            "impact": -45.0,
            "text": f"Endeudamiento elevado ({debt:.2%}) reduce significativamente el score.",
        })
    elif debt < 0.4:
        factors.append({
            "feature": "debt_ratio",
            "val": float(round(debt, 2)),
            "impact": +30.0,
            "text": f"Nivel de endeudamiento bajo ({debt:.2%}) favorece la solvencia.",
        })

    # 2. Liquidez
    curr = feature_series.get("current_ratio", 1.2)
    if curr < 1.0:
        factors.append({
            "feature": "current_ratio",
            "val": float(round(curr, 2)),
            "impact": -35.0,
            "text": f"Razón corriente deficiente ({curr:.2f}) indica presión de liquidez a corto plazo.",
        })
    elif curr >= 1.5:
        factors.append({
            "feature": "current_ratio",
            "val": float(round(curr, 2)),
            "impact": +25.0,
            "text": f"Buena cobertura de liquidez corriente ({curr:.2f}).",
        })

    # 3. Margen Neto
    margin = feature_series.get("net_margin", 0.05)
    if margin < 0:
        factors.append({
            "feature": "net_margin",
            "val": float(round(margin, 4)),
            "impact": -40.0,
            "text": f"Margen neto negativo ({margin:.2%}) refleja pérdidas operativas.",
        })
    elif margin >= 0.10:
        factors.append({
            "feature": "net_margin",
            "val": float(round(margin, 4)),
            "impact": +35.0,
            "text": f"Sólido margen neto de utilidad ({margin:.2%}).",
        })

    # 4. ROA
    roa = feature_series.get("roa", 0.04)
    if roa >= 0.08:
        factors.append({
            "feature": "roa",
            "val": float(round(roa, 4)),
            "impact": +20.0,
            "text": f"Rentabilidad sobre activos adecuada ({roa:.2%}).",
        })

    # 5. Cobertura de Intereses
    cov = feature_series.get("interest_coverage", 3.0)
    if cov < 1.5:
        factors.append({
            "feature": "interest_coverage",
            "val": float(round(cov, 2)),
            "impact": -30.0,
            "text": f"Baja cobertura de intereses ({cov:.2f}x) sobre gastos financieros.",
        })

    # Ordenar por magnitud de impacto y retornar Top 5
    factors = sorted(factors, key=lambda x: abs(x["impact"]), reverse=True)[:5]
    return factors


def evaluate_company(company, requested_by, statement: FinancialStatement = None, request=None) -> Evaluation:
    """
    Ejecuta el pipeline completo de scoring crediticio para una empresa.
    """
    model_ver = get_active_model_version()

    # Si no se provee estado financiero explícito, toma el más reciente disponible
    if not statement:
        statement = company.financial_statements.order_by("-fiscal_year").first()

    if not statement:
        # Si no hay estados financieros cargados, crea uno de demostración neutral
        statement = FinancialStatement.objects.create(
            company=company,
            fiscal_year=2023,
            revenue=100000000.00,
            expenses=90000000.00,
            operating_income=10000000.00,
            net_income=7000000.00,
            total_assets=80000000.00,
            current_assets=40000000.00,
            total_liabilities=30000000.00,
            current_liabilities=20000000.00,
            financial_debt=10000000.00,
            financial_expenses=2000000.00,
            origin="SYNTHETIC",
            uploaded_by=requested_by,
        )

    ratios_dict = calculate_financial_ratios(statement)
    confidence = ratios_dict["confidence_level"]

    # Construir DataFrame de entrada para inferencia
    raw_input_data = {
        "revenue": float(statement.revenue),
        "expenses": float(statement.expenses),
        "operating_income": float(statement.operating_income),
        "net_income": float(statement.net_income),
        "total_assets": float(statement.total_assets),
        "current_assets": float(statement.current_assets),
        "total_liabilities": float(statement.total_liabilities),
        "current_liabilities": float(statement.current_liabilities),
        "financial_debt": float(statement.financial_debt),
        "financial_expenses": float(statement.financial_expenses),
        "company_age": 5,
        "size": company.size,
    }

    df_in = pd.DataFrame([raw_input_data])
    X_features = build_features(df_in)

    # Cargar artefacto ML y realizar inferencia
    artifact_data = joblib.load(model_ver.artifact_path)
    calibrated_model = artifact_data["model"]

    pd_prob = float(calibrated_model.predict_proba(X_features)[0, 1])
    score = int(round((1.0 - pd_prob) * 1000))
    score = max(0, min(1000, score))

    risk_lvl = calculate_risk_level(score)
    factors_list = generate_shap_explanations(X_features.iloc[0], pd_prob)

    evaluation = Evaluation.objects.create(
        company=company,
        requested_by=requested_by,
        statement=statement,
        model_version=model_ver,
        pd=round(pd_prob, 4),
        score=score,
        risk_level=risk_lvl,
        confidence=confidence,
        factors=factors_list,
        inputs_snapshot={
            "financial_statement_id": statement.id,
            "fiscal_year": statement.fiscal_year,
            "raw_inputs": raw_input_data,
            "ratios": ratios_dict,
        },
    )

    # Registrar evento en auditoría
    log_action(
        user=requested_by,
        action=AuditAction.EVALUATION_REQUEST,
        entity="Evaluation",
        entity_id=evaluation.id,
        request=request,
        metadata={"nit": company.nit, "score": score, "risk_level": risk_lvl},
    )

    return evaluation
