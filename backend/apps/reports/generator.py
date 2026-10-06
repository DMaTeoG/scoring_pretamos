import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from apps.scoring.models import Evaluation


def generate_evaluation_pdf(evaluation: Evaluation) -> bytes:
    """
    Genera un informe PDF profesional en bytes utilizando ReportLab.
    Incluye datos de la empresa, score crediticio, desglose SHAP, fuentes y aviso legal.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()

    # Estilos personalizados
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),  # Slate 900
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),  # Slate 500
    )
    h2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#991b1b"),  # Red 800
    )

    story = []

    # 1. Encabezado del Informe
    story.append(Paragraph("SISTEMA DE SCORING EMPRESARIAL", title_style))
    story.append(Paragraph(f"Informe Ejecutivo de Evaluación Crediticia — ID #{evaluation.id}", subtitle_style))
    story.append(Spacer(1, 0.15 * inch))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=12))

    # 2. Información de la Empresa
    story.append(Paragraph("1. Datos Generales de la Empresa", h2_style))
    company = evaluation.company
    company_data = [
        [Paragraph("<b>Razón Social:</b>", body_style), Paragraph(company.legal_name, body_style)],
        [Paragraph("<b>NIT:</b>", body_style), Paragraph(company.nit, body_style)],
        [Paragraph("<b>Código CIIU:</b>", body_style), Paragraph(company.ciiu or "N/A", body_style)],
        [Paragraph("<b>Ciudad:</b>", body_style), Paragraph(company.city or "Bogotá, D.C.", body_style)],
        [Paragraph("<b>Tamaño Empresa:</b>", body_style), Paragraph(company.get_size_display(), body_style)],
    ]
    t_company = Table(company_data, colWidths=[2.2 * inch, 5.0 * inch])
    t_company.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ])
    )
    story.append(t_company)
    story.append(Spacer(1, 0.15 * inch))

    # 3. Resultado de Scoring y Nivel de Riesgo
    story.append(Paragraph("2. Resultado del Scoring Crediticio", h2_style))
    
    # Determinar color de badge por nivel de riesgo
    risk_colors = {
        "BAJO": colors.HexColor("#16a34a"),      # Green 600
        "MEDIO": colors.HexColor("#d97706"),     # Amber 600
        "ALTO": colors.HexColor("#dc2626"),      # Red 600
        "MUY_ALTO": colors.HexColor("#7f1d1d"),  # Red 900
    }
    badge_color = risk_colors.get(evaluation.risk_level, colors.HexColor("#2563eb"))

    score_data = [
        [
            Paragraph("<b>SCORE OBTENIDO</b>", ParagraphStyle("S1", parent=body_style, fontName="Helvetica-Bold", alignment=1)),
            Paragraph("<b>NIVEL DE RIESGO</b>", ParagraphStyle("S2", parent=body_style, fontName="Helvetica-Bold", alignment=1)),
            Paragraph("<b>PROBABILIDAD INCUMPLIMIENTO (PD)</b>", ParagraphStyle("S3", parent=body_style, fontName="Helvetica-Bold", alignment=1)),
            Paragraph("<b>CONFIANZA</b>", ParagraphStyle("S4", parent=body_style, fontName="Helvetica-Bold", alignment=1)),
        ],
        [
            Paragraph(f"<font size=18 color='#0f172a'><b>{evaluation.score}</b></font> / 1000", ParagraphStyle("ScoreVal", parent=body_style, alignment=1)),
            Paragraph(f"<font size=12 color='white'><b>{evaluation.get_risk_level_display()}</b></font>", ParagraphStyle("RiskVal", parent=body_style, alignment=1)),
            Paragraph(f"<b>{evaluation.pd:.2%}</b>", ParagraphStyle("PDVal", parent=body_style, alignment=1)),
            Paragraph(f"<b>{evaluation.confidence}</b>", ParagraphStyle("ConfVal", parent=body_style, alignment=1)),
        ]
    ]

    t_score = Table(score_data, colWidths=[1.8 * inch, 1.9 * inch, 2.0 * inch, 1.5 * inch])
    t_score.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("BACKGROUND", (1, 1), (1, 1), badge_color),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ])
    )
    story.append(t_score)
    story.append(Spacer(1, 0.15 * inch))

    # 4. Desglose de Factores SHAP (Explicabilidad Local)
    story.append(Paragraph("3. Explicabilidad y Factores Principales (SHAP)", h2_style))
    factors = evaluation.factors or []
    
    factors_table_data = [
        [Paragraph("<b>Factor / Métrica</b>", body_style), Paragraph("<b>Valor</b>", body_style), Paragraph("<b>Explicación e Impacto</b>", body_style)]
    ]
    
    for f in factors:
        factors_table_data.append([
            Paragraph(f.get("feature", "Métrica"), body_style),
            Paragraph(str(f.get("val", "-")), body_style),
            Paragraph(f.get("text", "-"), body_style),
        ])

    if len(factors_table_data) == 1:
        factors_table_data.append([Paragraph("No se registraron factores extremos.", body_style), Paragraph("-", body_style), Paragraph("Métricas dentro de parámetros normales.", body_style)])

    t_factors = Table(factors_table_data, colWidths=[1.8 * inch, 1.0 * inch, 4.4 * inch])
    t_factors.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ])
    )
    story.append(t_factors)
    story.append(Spacer(1, 0.2 * inch))

    # 5. Aviso Legal Obligatorio
    story.append(Paragraph("4. Advertencia Legal y Limitaciones", h2_style))
    disclaimer_box = [
        [
            Paragraph(
                "<b>AVISO IMPORTANTE:</b> El score crediticio y la probabilidad de incumplimiento son "
                "estimaciones obtenidas mediante modelos algorítmicos y datos sintéticos/abiertos con fines estrictamente académicos. "
                "No garantizan el pago ni el incumplimiento de una obligación y no sustituyen el criterio profesional del analista financiero.",
                disclaimer_style,
            )
        ]
    ]
    t_disclaimer = Table(disclaimer_box, colWidths=[7.2 * inch])
    t_disclaimer.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef2f2")),  # Red 50
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fca5a5")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(t_disclaimer)

    # 6. Pie de Página y Auditoría
    story.append(Spacer(1, 0.2 * inch))
    footer_text = (
        f"Versión de Modelo: {evaluation.model_version.version} | "
        f"Evaluado por: {evaluation.requested_by.email} | "
        f"Fecha: {evaluation.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    )
    story.append(Paragraph(footer_text, subtitle_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
