from django.urls import path, include
from apps.companies.views import CompanyLookupView, CompanyDetailView

urlpatterns = [
    path("lookup/", CompanyLookupView.as_view(), name="company-lookup"),
    path("<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
    path("<int:company_id>/financial-statements/", include("apps.financials.urls")),
]
