import pytest
from apps.sources.services import MockSource, OpenDataSource
from apps.sources.models import DataSourceSnapshot


@pytest.mark.django_db
class TestDataSources:
    def test_mock_source_returns_valid_dict_and_snapshot(self):
        source = MockSource()
        data = source.fetch_company_info("900123456-7")

        assert data["nit"] == "900123456-7"
        assert "EMPRESA SIMULADA" in data["legal_name"]
        assert data["origin"] == "MOCK"

        snapshot = DataSourceSnapshot.objects.filter(nit="900123456-7").first()
        assert snapshot is not None
        assert snapshot.source_name == "MockSource"
        assert snapshot.status_code == 200

    def test_open_data_source_fallback_creates_snapshot(self):
        source = OpenDataSource()
        # Even when open data API times out or is offline, it falls back to MockSource transparently
        data = source.fetch_company_info("800197268-4")

        assert data is not None
        assert data["nit"] == "800197268-4"
        assert DataSourceSnapshot.objects.count() >= 1
