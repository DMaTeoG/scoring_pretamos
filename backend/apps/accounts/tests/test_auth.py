import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser, Role


@pytest.mark.django_db
class TestAuthSystem:
    def setup_method(self):
        self.client = APIClient()
        self.user_data = {
            "email": "analista@banco.com",
            "password": "Password123!",
            "first_name": "Carlos",
            "last_name": "Analista",
            "role": Role.ANALYST,
        }
        self.user = CustomUser.objects.create_user(**self.user_data)

    def test_user_creation_and_roles(self):
        assert self.user.email == "analista@banco.com"
        assert self.user.role == Role.ANALYST
        assert self.user.check_password("Password123!")

    def test_login_success(self):
        url = reverse("auth-login")
        response = self.client.post(
            url,
            {"email": "analista@banco.com", "password": "Password123!"},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == "analista@banco.com"
        assert response.data["user"]["role"] == Role.ANALYST
        assert "access_token" in response.cookies

    def test_login_invalid_credentials(self):
        url = reverse("auth-login")
        response = self.client.post(
            url,
            {"email": "analista@banco.com", "password": "WrongPassword"},
            format="json",
        )
        assert response.status_code == 401

    def test_profile_authenticated(self):
        url_login = reverse("auth-login")
        login_res = self.client.post(
            url_login,
            {"email": "analista@banco.com", "password": "Password123!"},
            format="json",
        )
        token = login_res.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        url_me = reverse("auth-me")
        res = self.client.get(url_me)
        assert res.status_code == 200
        assert res.data["email"] == "analista@banco.com"
