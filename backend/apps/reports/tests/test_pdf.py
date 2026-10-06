import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser, Role
from apps.companies.models import CompanyProfile
from apps.scoring.services import evaluate_company
from apps.reports.generator import generate_evaluation_pdf
from apps.audit.models import AuditLog, AuditAction


@pytest.mark.django_db
class TestPDFReports:
    def setup_method(self):
        self.client = APIClient()
        self.analyst = CustomUser.objects.create_user(
            email="pdf_analyst@banco.com", password="Password123!", role=Role.ANALYST
        )
        self.company = CompanyProfile.objects.create(
            nit="890900943-1",
            legal_name="EMPRESAS PUBLICAS DE MEDELLIN E.S.P.",
            ciiu="3511",
        )
        self.evaluation = evaluate_company(self.company, self.analyst)

    def test_pdf_generator_function(self):
        pdf_bytes = generate_evaluation_pdf(self.evaluation)

        assert pdf_bytes is not None
        assert len(pdf_bytes) > 500
        assert pdf_bytes.startswith(b"%PDF-")  # Valid PDF binary header signature

    def test_pdf_download_endpoint_and_audit(self):
        self.client.force_authenticate(user=self.analyst)
        url = reverse("evaluation-report-pdf", kwargs={"pk": self.evaluation.pk})
        res = self.client.get(url)

        assert res.status_code == 200
        assert res["Content-Type"] == "application/pdf"
        assert f"filename=\"Informe_Scoring_NIT_{self.company.nit.replace('-', '_')}.pdf\"" in res["Content-Disposition"]
        assert len(res.content) > 500

        # Verify audit logging
        audit = AuditLog.objects.filter(action=AuditAction.REPORT_DOWNLOAD, entity_id=str(self.evaluation.pk)).first()
        assert audit is not None
        assert audit.user == self.analyst
