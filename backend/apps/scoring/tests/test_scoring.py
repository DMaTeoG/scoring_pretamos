import pytest
from apps.accounts.models import CustomUser, Role
from apps.companies.models import CompanyProfile
from apps.scoring.services import evaluate_company, get_active_model_version
from apps.scoring.models import Evaluation, ModelVersion


@pytest.mark.django_db
class TestScoringPipeline:
    def setup_method(self):
        self.analyst = CustomUser.objects.create_user(
            email="analyst@banco.com", password="pass", role=Role.ANALYST
        )
        self.company = CompanyProfile.objects.create(
            nit="800197268-4",
            legal_name="BANCOLOMBIA S.A. MOCK",
            ciiu="6412",
        )

    def test_active_model_version_creation(self):
        model_ver = get_active_model_version()
        assert model_ver is not None
        assert model_ver.is_active is True
        assert ModelVersion.objects.filter(is_active=True).count() == 1

    def test_company_scoring_evaluation(self):
        evaluation = evaluate_company(self.company, self.analyst)

        assert evaluation.pk is not None
        assert evaluation.company == self.company
        assert evaluation.requested_by == self.analyst
        assert 0 <= evaluation.score <= 1000
        assert 0.0 <= evaluation.pd <= 1.0
        assert evaluation.risk_level in ["BAJO", "MEDIO", "ALTO", "MUY_ALTO"]
        assert len(evaluation.factors) <= 5
        assert "ratios" in evaluation.inputs_snapshot
        assert Evaluation.objects.count() == 1
