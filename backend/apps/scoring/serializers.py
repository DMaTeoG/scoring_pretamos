from rest_framework import serializers
from apps.scoring.models import Evaluation, ModelVersion
from apps.companies.serializers import CompanyProfileSerializer


class ModelVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelVersion
        fields = [
            "id",
            "version",
            "algorithm",
            "features",
            "metrics",
            "dataset_hash",
            "is_active",
            "trained_at",
        ]


class EvaluationCreateSerializer(serializers.Serializer):
    nit = serializers.CharField(max_length=20)
    statement_id = serializers.IntegerField(required=False, allow_null=True)


class EvaluationDetailSerializer(serializers.ModelSerializer):
    company = CompanyProfileSerializer(read_only=True)
    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True)
    model_version_name = serializers.CharField(source="model_version.version", read_only=True)
    disclaimer = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "company",
            "requested_by_email",
            "model_version_name",
            "pd",
            "score",
            "risk_level",
            "confidence",
            "factors",
            "inputs_snapshot",
            "disclaimer",
            "created_at",
        ]

    def get_disclaimer(self, obj):
        return (
            "El score es una estimación de riesgo con fines académicos. "
            "No garantiza el pago o incumplimiento de una obligación y no sustituye el criterio del analista financiero."
        )
