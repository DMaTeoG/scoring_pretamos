from django.http import HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.scoring.models import Evaluation
from apps.companies.models import CompanyMembership
from apps.reports.generator import generate_evaluation_pdf
from apps.audit.services import log_action
from apps.audit.models import AuditAction


class EvaluationReportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        evaluation = get_object_or_404(Evaluation, pk=pk)

        # Enforce role restrictions
        user = request.user
        if user.role == "COMPANY" and not user.is_superuser:
            membership = CompanyMembership.objects.filter(
                user=user, company=evaluation.company, status="APPROVED"
            ).first()
            if not membership:
                return Response(
                    {"code": "FORBIDDEN", "message": "El usuario Empresa solo puede descargar el informe de su propio NIT."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        pdf_bytes = generate_evaluation_pdf(evaluation)

        # Register audit event
        log_action(
            user=user,
            action=AuditAction.REPORT_DOWNLOAD,
            entity="Evaluation",
            entity_id=evaluation.id,
            request=request,
            metadata={"nit": evaluation.company.nit, "score": evaluation.score},
        )

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        filename = f"Informe_Scoring_NIT_{evaluation.company.nit.replace('-', '_')}.pdf"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
