import os
import requests
from abc import ABC, abstractmethod
from django.conf import settings
from apps.sources.models import DataSourceSnapshot


class CompanySource(ABC):
    @abstractmethod
    def fetch_company_info(self, nit_clean: str) -> dict | None:
        """Obtiene información registrada de la empresa por NIT."""
        pass


class MockSource(CompanySource):
    """
    Fuente simulada determinista para pruebas offline y fallback de datos abiertos.
    """

    def fetch_company_info(self, nit_clean: str) -> dict | None:
        raw_nit = nit_clean.split("-")[0]
        # Deterministic generation based on NIT digits
        seed_num = int(raw_nit) if raw_nit.isdigit() else 900123456
        
        cities = ["Bogotá, D.C.", "Medellín", "Cali", "Barranquilla", "Bucaramanga"]
        ciius = ["4690", "6201", "4110", "1010", "7020"]
        sizes = ["MICRO", "PEQUENA", "MEDIANA", "GRANDE"]

        data = {
            "nit": nit_clean,
            "dv": nit_clean.split("-")[1] if "-" in nit_clean else "7",
            "legal_name": f"EMPRESA SIMULADA COLOMBIA {raw_nit[-4:]} S.A.S.",
            "ciiu": ciius[seed_num % len(ciius)],
            "registration_date": "2018-05-15",
            "status": "ACTIVA",
            "city": cities[seed_num % len(cities)],
            "size": sizes[seed_num % len(sizes)],
            "origin": "MOCK",
        }

        DataSourceSnapshot.objects.create(
            nit=nit_clean,
            source_name="MockSource",
            status_code=200,
            payload=data,
        )
        return data


class OpenDataSource(CompanySource):
    """
    Adaptador oficial para datos.gov.co utilizando la SODA API (Socrata).
    """
    CARATULA_URL = "https://www.datos.gov.co/resource/2387-m22z.json"

    def fetch_company_info(self, nit_clean: str) -> dict | None:
        raw_nit = nit_clean.split("-")[0]
        app_token = getattr(settings, "OPEN_DATA_APP_TOKEN", None)
        headers = {}
        if app_token:
            headers["X-App-Token"] = app_token

        params = {"nit": raw_nit, "$limit": 1}
        timeout = getattr(settings, "OPEN_DATA_TIMEOUT_SECONDS", 5)

        try:
            response = requests.get(
                self.CARATULA_URL,
                params=params,
                headers=headers,
                timeout=timeout,
            )
            status_code = response.status_code
            if status_code == 200:
                json_data = response.json()
                DataSourceSnapshot.objects.create(
                    nit=nit_clean,
                    source_name="datos.gov.co",
                    status_code=200,
                    payload={"results": json_data},
                )
                if json_data and isinstance(json_data, list) and len(json_data) > 0:
                    row = json_data[0]
                    return {
                        "nit": nit_clean,
                        "dv": row.get("dv", nit_clean.split("-")[1] if "-" in nit_clean else "0"),
                        "legal_name": row.get("razon_social") or row.get("nombre_completo", f"EMPRESA NIT {raw_nit}"),
                        "ciiu": row.get("ciiu", "4690"),
                        "registration_date": row.get("fecha_corte", "2020-01-01")[:10],
                        "status": "ACTIVA",
                        "city": row.get("ciudad", "Bogotá, D.C."),
                        "size": "MEDIANA",
                        "origin": "PUBLIC",
                    }
        except Exception as e:
            DataSourceSnapshot.objects.create(
                nit=nit_clean,
                source_name="datos.gov.co",
                status_code=500,
                payload={"error": str(e)},
            )

        # Automatic transparent fallback to MockSource if Open Data has no record or fails
        mock = MockSource()
        return mock.fetch_company_info(nit_clean)
