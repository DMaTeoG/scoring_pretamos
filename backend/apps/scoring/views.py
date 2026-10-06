from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.companies.models import CompanyProfile, CompanyMembership
from apps.companies.validators import validate_and_clean_nit
from apps.scoring.models import Evaluation, ModelVersion
from apps.scoring.serializers import (
    EvaluationCreateSerializer,
    EvaluationDetailSerializer,
    ModelVersionSerializer,
)
from apps.scoring.services import evaluate_company
from apps.accounts.permissions import IsAnalyst, IsAdminUserRole


class EvaluationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Evaluation.objects.all()

        # Role restrictions
        if user.role == "COMPANY" and not user.is_superuser:
            memberships = CompanyMembership.objects.filter(user=user, status="APPROVED").values_list("company_id", flat=True)
            queryset = queryset.filter(company_id__in=memberships)
        elif user.role == "ANALYST" and not user.is_superuser:
            queryset = queryset.filter(requested_by=user)

        # Filters
        nit = request.query_params.get("nit")
        if nit:
            queryset = queryset.filter(company__nit__icontains=nit)

        risk = request.query_params.get("risk_level")
        if risk:
            queryset = queryset.filter(risk_level=risk)

        serializer = EvaluationDetailSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Only ANALYST and ADMIN can request credit evaluations
        if request.user.role == "COMPANY" and not request.user.is_superuser:
            return Response(
                {"code": "FORBIDDEN", "message": "El usuario con rol Empresa no puede solicitar evaluaciones de crédito."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EvaluationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nit_raw = serializer.validated_data["nit"]
        statement_id = serializer.validated_data.get("statement_id")

        try:
            nit_clean, _ = validate_and_clean_nit(nit_raw)
        except Exception as e:
            return Response(
                {"code": "INVALID_NIT", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company = CompanyProfile.objects.filter(nit=nit_clean).first()
        if not company:
            from apps.sources.services import OpenDataSource
            source = OpenDataSource()
            info = source.fetch_company_info(nit_clean)
            company = CompanyProfile.objects.create(
                nit=info["nit"],
                dv=info.get("dv", "7"),
                legal_name=info["legal_name"],
                ciiu=info.get("ciiu", ""),
                registration_date=info.get("registration_date"),
                status=info.get("status", "ACTIVA"),
                city=info.get("city", ""),
                size=info.get("size", "MICRO"),
            )

        statement = None
        if statement_id:
            statement = company.financial_statements.filter(pk=statement_id).first()

        evaluation = evaluate_company(company, request.user, statement=statement, request=request)
        detail_serializer = EvaluationDetailSerializer(evaluation)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class EvaluationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EvaluationDetailSerializer
    queryset = Evaluation.objects.all()
