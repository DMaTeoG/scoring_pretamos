from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.companies.models import CompanyProfile, CompanyMembership
from apps.companies.serializers import CompanyProfileSerializer, CompanyMembershipSerializer
from apps.companies.validators import validate_and_clean_nit
from apps.sources.services import OpenDataSource
from apps.audit.services import log_action
from apps.audit.models import AuditAction
from apps.accounts.permissions import IsAnalyst, IsCompanyUser


class CompanyLookupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        nit_param = request.query_params.get("nit", "").strip()
        if not nit_param:
            return Response(
                {"code": "NIT_REQUIRED", "message": "Debe proporcionar el parámetro 'nit'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            nit_clean, dv = validate_and_clean_nit(nit_param)
        except Exception as e:
            return Response(
                {"code": "INVALID_NIT", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce Company role restrictions: Company role can only look up its linked NIT
        if request.user.role == "COMPANY" and not request.user.is_superuser:
            membership = CompanyMembership.objects.filter(
                user=request.user, company__nit=nit_clean, status="APPROVED"
            ).first()
            if not membership:
                return Response(
                    {"code": "FORBIDDEN", "message": "El usuario Empresa solo puede consultar su propio NIT autorizado."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        company = CompanyProfile.objects.filter(nit=nit_clean).first()
        if not company:
            # Consult external sources (Open Data or Mock fallback)
            source = OpenDataSource()
            info = source.fetch_company_info(nit_clean)
            if info:
                company = CompanyProfile.objects.create(
                    nit=info["nit"],
                    dv=info.get("dv", dv),
                    legal_name=info["legal_name"],
                    ciiu=info.get("ciiu", ""),
                    registration_date=info.get("registration_date"),
                    status=info.get("status", "ACTIVA"),
                    city=info.get("city", ""),
                    size=info.get("size", "MICRO"),
                )

        if not company:
            return Response(
                {"code": "NOT_FOUND", "message": f"No se encontró información para el NIT {nit_clean}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        log_action(
            user=request.user,
            action=AuditAction.SEARCH_NIT,
            entity="CompanyProfile",
            entity_id=company.id,
            request=request,
            metadata={"nit": nit_clean},
        )

        serializer = CompanyProfileSerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CompanyDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CompanyProfileSerializer
    queryset = CompanyProfile.objects.all()
