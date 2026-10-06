# docs.md — Documentación del Sistema de Scoring Empresarial

> Documento vivo. Se actualiza en el mismo cambio que modifique el sistema. Estado: **borrador inicial (pre-implementación)**.
> Los campos marcados *(pendiente)* se completan durante el desarrollo.

## Índice
1. Propósito y alcance
2. Limitaciones y aviso legal
3. Arquitectura
4. Modelo de datos
5. Roles y permisos
6. Metodología del score
7. Fuentes de datos
8. API
9. Instalación local (sin Docker)
10. Pruebas
11. Registro de decisiones
12. Glosario

---

## 1. Propósito y alcance

Sistema web que ayuda a un analista financiero a evaluar el riesgo crediticio de una empresa colombiana a partir de su NIT.

**Flujo:** NIT → verificación → recopilación de información → análisis financiero → modelo ML → score → nivel de riesgo → informe PDF.

**Incluye (MVP):**
- Consulta de empresa por NIT (datos abiertos).
- Carga de estados financieros por Empresa o Analista (formulario y CSV).
- Cálculo de ratios financieros.
- Score 0–1000, nivel de riesgo (bajo, medio, alto, muy alto) y explicación con SHAP.
- Historial de evaluaciones y descarga de informe PDF.
- Gestión de usuarios, modelos y auditoría para el Administrador.

**No incluye:** aprobación automática de créditos, acceso a información reservada de la DIAN, scraping no autorizado, operaciones reales.

## 2. Limitaciones y aviso legal

- El score es una **estimación** y no garantiza que una empresa pague o incumpla.
- Es una herramienta de **apoyo** al analista, no un mecanismo de decisión automática.
- El modelo se entrena con **datos sintéticos**; sus métricas no representan rendimiento real. *(El PDF y la UI lo indican.)*
- No se accede a declaraciones tributarias, deudas fiscales ni información financiera protegida.
- RUES aporta principalmente información registral, no financiera completa.
- La disponibilidad de datos depende de fuentes externas y sus condiciones de uso.
- Proyecto con fines **académicos y experimentales**.
- Datos personales (p. ej. representantes legales, usuarios): aplicar minimización y la Ley 1581 de 2012 (habeas data). *(Revisar alcance legal con tu institución.)*

**Texto de advertencia estándar (UI y PDF):**
> El score es una estimación de riesgo con fines académicos. No garantiza el pago o incumplimiento de una obligación y no sustituye el criterio del analista financiero.

## 3. Arquitectura

```
Next.js (puerto 3000) ──cookies httpOnly──► Django REST (puerto 8000) ──► PostgreSQL
                                               ├─ sources  (datos.gov.co / mock)
                                               ├─ scoring  (joblib + SHAP)
                                               └─ reports  (ReportLab)
ml/  (offline): synth.py → features.py → train.py → evaluate.py → artifacts/*.joblib
```

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, TanStack Query |
| Backend | Django, Django REST Framework, simplejwt |
| BD | PostgreSQL |
| ML | pandas, scikit-learn, XGBoost, SHAP, joblib |
| PDF | ReportLab |

**Estructura de carpetas:** ver `PLAN.md §4`.

**Principios:** lógica de negocio en `services.py`; features compartidas entre entrenamiento e inferencia; toda evaluación es reproducible (versión de modelo + snapshot de entradas).

## 4. Modelo de datos

| Entidad | Campos principales |
|---|---|
| `User` | email, password, role (ANALYST/COMPANY/ADMIN), is_active |
| `CompanyProfile` | nit (único), dv, legal_name, ciiu, registration_date, status, city, size, last_synced_at |
| `CompanyMembership` | user, company, status (PENDING/APPROVED/REJECTED), approved_by |
| `DataSourceSnapshot` | company, source, payload (JSON), status, fetched_at |
| `FinancialStatement` | company, fiscal_year, revenue, expenses, operating_income, net_income, total_assets, current_assets, total_liabilities, current_liabilities, financial_debt, financial_expenses, origin (COMPANY/PUBLIC/SYNTHETIC), uploaded_by |
| `ModelVersion` | version, algorithm, features (JSON), metrics (JSON), dataset_hash, artifact_path, is_active, trained_at |
| `Evaluation` | company, requested_by, statement, model_version, pd, score, risk_level, confidence, factors (JSON), inputs_snapshot (JSON), created_at |
| `Report` | evaluation, file, generated_at |
| `AuditLog` | user, action, entity, entity_id, ip, metadata (JSON), created_at |

Notas: montos en `DecimalField`; `Evaluation` es inmutable una vez creada.

## 5. Roles y permisos

| Acción | Analista | Empresa | Administrador |
|---|:-:|:-:|:-:|
| Iniciar sesión | ✅ | ✅ | ✅ |
| Buscar empresa por NIT | ✅ | solo su NIT | ✅ |
| Cargar estados financieros | ✅ | solo su NIT | ✅ |
| Solicitar evaluación | ✅ | ❌ | ✅ |
| Ver evaluaciones | las que consultó | solo de su NIT (lectura) | todas |
| Descargar PDF | ✅ | solo de su NIT | ✅ |
| Gestionar usuarios y vínculos | ❌ | ❌ | ✅ |
| Ver/activar/reentrenar modelos | ❌ | ❌ | ✅ |
| Ver auditoría | ❌ | ❌ | ✅ |

*(Supuesto: Empresa ve su propio resultado en modo lectura — confirmar.)*

## 6. Metodología del score

### 6.1 Definición
- **Variable objetivo (sintética):** incumplimiento (`default`) en los 12 meses posteriores a la fecha de corte del estado financiero.
- **Probabilidad:** `PD` calibrada (probabilidad de incumplimiento).
- **Score:** `score = round((1 − PD) × 1000)`, acotado a 0–1000.

### 6.2 Niveles de riesgo *(umbrales iniciales, ajustar tras evaluar el modelo)*

| Score | Nivel |
|---|---|
| 750 – 1000 | Bajo |
| 500 – 749 | Medio |
| 250 – 499 | Alto |
| 0 – 249 | Muy alto |

### 6.3 Variables (features)
- **Registro:** antigüedad (años), estado de matrícula, sector (CIIU agrupado), tamaño.
- **Financieras:** ingresos, activos, pasivos, deuda financiera.
- **Ratios:** liquidez corriente, endeudamiento (pasivos/activos), margen neto, ROA, cobertura de intereses, crecimiento de ingresos.

Los ratios con denominador cero o nulo devuelven `null` y se imputan de forma declarada.

### 6.4 Confianza del resultado
Según la completitud de datos: **Alta** (todas las variables), **Media** (faltan ≤ 2), **Baja** (faltan más). Se muestra junto al score.

### 6.5 Entrenamiento y resultados reales
- **Dataset sintético:** Generado con semilla fija 42 (~5.000 empresas, trayectorias anuales 2020–2023).
- **Partición temporal estricta:** Entrenamiento (2020–2021), Validación (2022), Prueba (2023).
- **Modelos comparados:** Regresión Logística (baseline AUC = 0.9091) vs. XGBoost Classifier con Calibración Sigmoide.
- **Métricas reales obtenidas en el conjunto de prueba (2023):**
  - **ROC-AUC:** `0.9231` (92,31% de discriminación)
  - **KS Statistic:** `0.7023` (70,23% de separación entre pagadores e incumplidores)
  - **Brier Score:** `0.0563` (alta precisión de calibración de probabilidades)
  - **Hash del Dataset:** `da86d1f8059f0408`
  - **Artefacto:** `ml/artifacts/scoring_xgb_v1.joblib` (registrado en `ModelVersion` `xgb-2026.1`)
- **Riesgos controlados:** sobreajuste (validación temporal), *data leakage* (features previas a la fecha de corte).

### 6.6 Explicabilidad
SHAP calcula la contribución de cada variable. Se muestran los 5 factores principales con texto en español (ej.: "Endeudamiento elevado (0,82) reduce el score").

## 7. Fuentes de datos

| Fuente | Uso | Estado |
|---|---|---|
| datos.gov.co (Socrata API) | Registro empresarial y estados financieros públicos | Verificado y documentado (T0.6) |
| RUES | Información registral | Sin API pública abierta garantizada; sin scraping no autorizado |
| Carga del usuario | Estados financieros | Formulario y archivo CSV validado |
| Dataset sintético | Entrenamiento de modelos ML | Generado por `ml/src/synth.py` |
| `MockSource` | Pruebas unitarias y modo offline | Determinista con fallback transparente |

**Datasets verificados en datos.gov.co (SODA API):**

| Dataset | URL / Resource | Campos útiles | Licencia | Límite de consultas |
|---|---|---|---|---|
| Estados Financieros Supersociedades (Carátula) | `https://www.datos.gov.co/resource/2387-m22z.json` | `nit`, `razon_social`, `ciiu`, `fecha_corte`, `ciudad` | Dominio Público / Abierta | Sin token: 1.000/hora. Con `X-App-Token`: ilimitado / alto |
| Situación Financiera NIIF | `https://www.datos.gov.co/resource/96s3-2zs7.json` | `nit`, `periodo`, `ingresos_actividades_ordinarias`, `ganancia_perdida`, `activos_totales`, `pasivos_totales` | Dominio Público / Abierta | Sin token: 1.000/hora. Con `X-App-Token`: ilimitado / alto |

Cada consulta guarda un `DataSourceSnapshot` (respuesta cruda JSON, fecha de consulta, estado HTTP). Si la fuente externa cae o no encuentra el NIT, el adaptador conmuta transparentemente a `MockSource`.

## 8. API (borrador)

Base: `/api/v1/` · Autenticación: JWT en cookie `httpOnly`.

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/auth/login/` | Iniciar sesión | todos |
| POST | `/auth/refresh/` | Renovar token | todos |
| POST | `/auth/logout/` | Cerrar sesión | todos |
| GET | `/companies/lookup/?nit=` | Consultar empresa por NIT | A, E*, Ad |
| GET | `/companies/{id}/` | Detalle de empresa | A, E*, Ad |
| GET/POST | `/companies/{id}/financial-statements/` | Listar/cargar estados | A, E*, Ad |
| POST | `/companies/{id}/financial-statements/import-csv/` | Carga por CSV | A, E*, Ad |
| POST | `/evaluations/` | Solicitar evaluación | A, Ad |
| GET | `/evaluations/` | Listar (filtros: nit, nivel, fecha) | A, E*, Ad |
| GET | `/evaluations/{id}/` | Detalle con factores | A, E*, Ad |
| GET | `/evaluations/{id}/report.pdf` | Descargar PDF | A, E*, Ad |
| GET/PATCH | `/admin/users/` | Gestión de usuarios | Ad |
| PATCH | `/admin/memberships/{id}/` | Aprobar vínculo | Ad |
| GET | `/admin/models/` | Versiones de modelo | Ad |
| POST | `/admin/models/{id}/activate/` | Activar versión | Ad |
| GET | `/admin/audit/` | Auditoría | Ad |

`A` = Analista · `E*` = Empresa (solo su NIT) · `Ad` = Administrador

**Ejemplo de respuesta de evaluación:**
```json
{
  "id": 42,
  "nit": "900123456-7",
  "score": 684,
  "risk_level": "MEDIO",
  "pd": 0.316,
  "confidence": "ALTA",
  "model_version": "xgb-2026.1",
  "factors": [
    {"feature": "debt_ratio", "impact": -38.2, "text": "Endeudamiento elevado reduce el score"}
  ],
  "created_at": "2026-10-04T15:00:00Z"
}
```

**Errores:** formato `{ "code": "...", "message": "..." }` con mensaje en español.

## 9. Instalación local (sin Docker)

**Requisitos:** Python 3.12+, Node.js LTS, PostgreSQL, Git.

```bash
# 1. Base de datos
createdb scoring          # o crea la BD desde pgAdmin/psql
# crea usuario y dale permisos sobre la BD

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # completa las variables
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# 3. ML (genera datos y modelo)
python manage.py generate_synthetic_data
python manage.py train_model

# 4. Frontend
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

**Variables de entorno (backend):** `SECRET_KEY`, `DEBUG`, `DATABASE_URL` (o `DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT`), `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `OPEN_DATA_APP_TOKEN` (opcional), `MODEL_ARTIFACT_DIR`.
**Variables (frontend):** `NEXT_PUBLIC_API_BASE_URL` (solo URL, sin secretos).

*(Los comandos exactos se confirman al implementar la Fase 0.)*

## 10. Pruebas

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Backend | pytest + pytest-django | permisos por rol, NIT, ratios, scoring, API |
| ML | pytest | reproducibilidad de inferencia, no *leakage* |
| Frontend | lint + type-check (+ pruebas de componentes si hay tiempo) | formularios, rutas protegidas |

Ejecutar: `pytest` (backend) · `npm run lint && npm run typecheck` (frontend).
Las pruebas **no** consultan servicios externos reales.

## 11. Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-04 | Next.js + Django en lugar de Angular + Spring Boot | Preferencia del desarrollador |
| 2026-10-04 | ML dentro de Django (joblib) | Simplicidad para un desarrollador y 8 semanas |
| 2026-10-04 | Datos abiertos + sintéticos | RUES/DIAN no ofrecen datos financieros abiertos completos |
| 2026-10-04 | Ejecución local sin Docker | Preferencia del desarrollador |
| 2026-10-04 | PDF con ReportLab | Sin dependencias nativas |
| 2026-10-04 | JWT en cookies httpOnly | Evitar exposición a XSS |

## 12. Glosario

- **NIT:** Número de Identificación Tributaria.
- **RUES:** Registro Único Empresarial y Social.
- **PD:** probabilidad de incumplimiento.
- **KS:** estadístico Kolmogorov–Smirnov, mide la separación entre buenos y malos pagadores.
- **AUC:** área bajo la curva ROC.
- **Brier:** error cuadrático de las probabilidades (calibración).
- **SHAP:** método que explica cuánto aporta cada variable a una predicción.
- **Data leakage:** uso, al entrenar, de información que no estaría disponible al predecir.
- **CIIU:** clasificación industrial internacional uniforme (actividad económica).
