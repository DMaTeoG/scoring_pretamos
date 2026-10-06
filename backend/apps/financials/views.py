import csv
import io
from decimal import Decimal
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.companies.models import CompanyProfile
from apps.financials.models import FinancialStatement, StatementOrigin
from apps.financials.serializers import FinancialStatementSerializer, CSVImportSerializer
from apps.audit.services import log_action
from apps.audit.models import AuditAction


class FinancialStatementListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FinancialStatementSerializer

    def get_company(self):
        return get_object_or_404(CompanyProfile, pk=self.kwargs["company_id"])

    def get_queryset(self):
        company = self.get_company()
        return FinancialStatement.objects.filter(company=company)

    def perform_create(self, serializer):
        company = self.get_company()
        statement = serializer.save(
            company=company,
            uploaded_by=self.request.user,
            origin=StatementOrigin.COMPANY if self.request.user.role == "COMPANY" else StatementOrigin.PUBLIC,
        )
        log_action(
            user=self.request.user,
            action=AuditAction.FINANCIAL_STATEMENT_UPLOAD,
            entity="FinancialStatement",
            entity_id=statement.id,
            request=self.request,
            metadata={"fiscal_year": statement.fiscal_year, "company_id": company.id},
        )


class FinancialStatementCSVImportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):
        company = get_object_or_404(CompanyProfile, pk=company_id)
        serializer = CSVImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        csv_file = serializer.validated_data["file"]
        decoded_file = csv_file.read().decode("utf-8-sig")
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        created_statements = []
        for row in reader:
            try:
                fiscal_year = int(row["fiscal_year"])
                stmt, _ = FinancialStatement.objects.update_or_create(
                    company=company,
                    fiscal_year=fiscal_year,
                    defaults={
                        "revenue": Decimal(str(row.get("revenue", 0))),
                        "expenses": Decimal(str(row.get("expenses", 0))),
                        "operating_income": Decimal(str(row.get("operating_income", 0))),
                        "net_income": Decimal(str(row.get("net_income", 0))),
                        "total_assets": Decimal(str(row.get("total_assets", 0))),
                        "current_assets": Decimal(str(row.get("current_assets", 0))),
                        "total_liabilities": Decimal(str(row.get("total_liabilities", 0))),
                        "current_liabilities": Decimal(str(row.get("current_liabilities", 0))),
                        "financial_debt": Decimal(str(row.get("financial_debt", 0))),
                        "financial_expenses": Decimal(str(row.get("financial_expenses", 0))),
                        "uploaded_by": request.user,
                        "origin": StatementOrigin.COMPANY,
                    },
                )
                created_statements.append(stmt.id)
            except (KeyError, ValueError) as e:
                return Response(
                    {"code": "CSV_PARSING_ERROR", "message": f"Error al procesar fila del CSV: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        log_action(
            user=request.user,
            action=AuditAction.FINANCIAL_STATEMENT_UPLOAD,
            entity="CompanyProfile",
            entity_id=company.id,
            request=request,
            metadata={"created_count": len(created_statements), "method": "CSV"},
        )

        return Response(
            {"message": f"Se importaron {len(created_statements)} estados financieros con éxito."},
            status=status.HTTP_201_CREATED,
        )
