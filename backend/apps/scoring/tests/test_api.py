import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser, Role
from apps.companies.models import CompanyProfile


@pytest.mark.django_db
class TestScoringAPI:
    def setup_method(self):
        self.client = APIClient()
        self.analyst = CustomUser.objects.create_user(
            email="analyst_api@banco.com", password="Password123!", role=Role.ANALYST
        )
        self.company_user = CustomUser.objects.create_user(
            email="company_api@banco.com", password="Password123!", role=Role.COMPANY
        )
        self.company = CompanyProfile.objects.create(
            nit="800197268-4",
            legal_name="BANCOLOMBIA S.A.",
            ciiu="6412",
        )

    def test_evaluations_post_as_analyst(self):
        self.client.force_authenticate(user=self.analyst)
        url = reverse("evaluation-list-create")
        res = self.client.post(url, {"nit": "800197268-4"}, format="json")

        assert res.status_code == 201
        assert "score" in res.data
        assert 0 <= res.data["score"] <= 1000
        assert "disclaimer" in res.data
        assert "El score es una estimación de riesgo" in res.data["disclaimer"]

    def test_evaluations_post_as_company_user_forbidden(self):
        self.client.force_authenticate(user=self.company_user)
        url = reverse("evaluation-list-create")
        res = self.client.post(url, {"nit": "800197268-4"}, format="json")

        assert res.status_code == 403
        assert res.data["code"] == "FORBIDDEN"

    def test_evaluations_invalid_nit(self):
        self.client.force_authenticate(user=self.analyst)
        url = reverse("evaluation-list-create")
        res = self.client.post(url, {"nit": "INVALID_NIT_123"}, format="json")

        assert res.status_code == 400
        assert res.data["code"] == "INVALID_NIT"

    def test_company_lookup_api(self):
        self.client.force_authenticate(user=self.analyst)
        url = reverse("company-lookup") + "?nit=800197268-4"
        res = self.client.get(url)

        assert res.status_code == 200
        assert res.data["nit"] == "800197268-4"
        assert res.data["legal_name"] == "BANCOLOMBIA S.A."
