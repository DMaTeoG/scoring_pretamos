# Plan de acción — Sistema Web Inteligente de Scoring Empresarial

**Caso:** 1 (riesgo crediticio empresarial) · **Stack:** Next.js + Django + PostgreSQL + scikit-learn/XGBoost
**Equipo:** 1 persona · **Plazo:** 8 semanas · **Ejecución:** local, sin Docker · **Herramienta de IA:** Antigravity

---

## 1. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Frontend | Next.js (App Router) + TypeScript (el documento original pedía Angular; se cambia por Next.js) |
| Backend | Django + Django REST Framework (el original pedía Spring Boot) |
| Base de datos | PostgreSQL instalado localmente |
| ML | Entrenado con scikit-learn/XGBoost y ejecutado **dentro de Django** (modelo cargado con joblib) |
| Datos | Datos abiertos reales (datos.gov.co) + dataset sintético para entrenar |
| Roles | Analista, Empresa, Administrador |
| Resultado | Score 0–1000 + nivel de riesgo + explicación SHAP + informe PDF |
| Entrega | Ejecución local sin Docker |

## 2. Supuestos que debes confirmar

1. **Rol Empresa:** puede cargar estados financieros de su NIT y ver el resultado de su propia evaluación (solo lectura). Un Administrador aprueba el vínculo usuario–NIT.
2. **RUES:** no tiene una API pública abierta garantizada. No se hace scraping no autorizado. La integración queda detrás de una interfaz (`CompanySource`) con una implementación de datos abiertos y otra *mock*.
3. **Dataset sintético:** el modelo aprende las reglas del generador, no la realidad. El sistema lo declara en la interfaz y en el PDF (fines académicos).
4. **PDF:** se usa ReportLab porque funciona en Windows, Linux y macOS sin dependencias del sistema. WeasyPrint necesita librerías nativas.
5. **Autenticación:** JWT en cookies `httpOnly`, gestionado desde route handlers de Next.js.

## 3. Arquitectura

```
Next.js (3000)  ──cookies httpOnly──►  Django REST API (8000)  ──►  PostgreSQL
                                          │
                                          ├─ apps/sources   → adaptadores datos.gov.co / mock
                                          ├─ apps/scoring   → carga modelo (joblib) + SHAP
                                          └─ apps/reports   → PDF (ReportLab)
ml/  → scripts de generación de datos, entrenamiento y evaluación (offline)
```

Flujo: `NIT → validar → consultar fuentes → estados financieros → ratios → modelo → PD calibrada → score → nivel → SHAP → informe`

## 4. Estructura del repositorio

```
scoring-empresarial/
├── AGENTS.md              # reglas para la IA
├── docs.md                # documentación viva
├── PLAN.md                # este archivo
├── backend/               # Django
│   ├── config/            # settings (base, local), urls
│   └── apps/{accounts,companies,sources,financials,scoring,reports,audit}
├── frontend/              # Next.js + TS
├── ml/
│   ├── data/              # sintético generado (no versionar archivos pesados)
│   ├── src/               # synth.py, features.py, train.py, evaluate.py
│   └── artifacts/         # modelos .joblib versionados
└── .agents/rules/         # (opcional) reglas modulares de Antigravity
```

## 5. Fases y tareas

Cada tarea termina con una prueba o evidencia verificable. Marca `[x]` al cerrar.

### Fase 0 — Preparación (semana 1)
- [x] T0.1 Crear repo, `.gitignore`, `.env.example`, estructura de carpetas.
- [x] T0.2 Copiar `AGENTS.md`, `docs.md`, `PLAN.md` a la raíz.
- [x] T0.3 Instalar PostgreSQL local, crear BD y usuario `scoring`.
- [x] T0.4 Entorno virtual Python, `requirements.txt`, proyecto Django con settings `base/local`.
- [x] T0.5 Proyecto Next.js con TypeScript, ESLint y Tailwind.
- [x] T0.6 **Verificar fuentes:** identificar en datos.gov.co los datasets reales disponibles (registro empresarial, estados financieros de Supersociedades u otros) y anotarlos en `docs.md §7` con enlace, campos y licencia.

**Hecho cuando:** `python manage.py runserver` y `npm run dev` arrancan y Django conecta a PostgreSQL.

### Fase 1 — Backend base, usuarios y roles (semanas 1–2)
- [x] T1.1 Modelo `User` personalizado con campo `role` (ANALYST, COMPANY, ADMIN).
- [x] T1.2 Login/refresh/logout con JWT; permisos por rol (matriz en `docs.md §5`).
- [x] T1.3 Modelos `CompanyProfile`, `CompanyMembership`, `AuditLog`.
- [x] T1.4 Middleware/servicio de auditoría (quién consultó qué NIT y cuándo).
- [x] T1.5 Pruebas de permisos (cada rol contra cada endpoint).

**Hecho cuando:** un Analista no puede acceder a endpoints de Admin y todo acceso queda en `AuditLog`.

### Fase 2 — Fuentes de datos y estados financieros (semanas 2–3)
- [x] T2.1 Validación de NIT (formato y dígito de verificación) con pruebas.
- [x] T2.2 Interfaz `CompanySource` + adaptador `OpenDataSource` (datos.gov.co) + `MockSource`.
- [x] T2.3 Guardar `DataSourceSnapshot` (respuesta cruda, fecha, estado) con timeout y reintentos.
- [x] T2.4 Modelo `FinancialStatement` y endpoint para que Empresa/Analista carguen datos (formulario y CSV).
- [x] T2.5 Cálculo de ratios en `financials/ratios.py` con manejo de divisiones por cero y nulos.
- [x] T2.6 Indicador de **completitud de datos** (alta/media/baja confianza).

**Hecho cuando:** dado un NIT, el backend devuelve ficha de empresa + ratios, o un error claro si la fuente no responde.

### Fase 3 — Machine Learning (semanas 3–5)
- [x] T3.1 `synth.py`: generador sintético reproducible (semilla fija, ~5.000 empresas, 3–5 años), con default a 12 meses definido desde una función latente + ruido.
- [x] T3.2 `features.py`: mismas transformaciones para entrenamiento e inferencia (una sola fuente de verdad).
- [x] T3.3 División **temporal** train/validación/test por año fiscal (anti-*leakage*).
- [x] T3.4 Entrenar baseline (regresión logística) y XGBoost; comparar.
- [x] T3.5 Calibrar probabilidades (isotónica o sigmoide) y reportar AUC, KS, Brier y curva de calibración.
- [x] T3.6 Definir mapeo `score = round((1 − PD) × 1000)` y umbrales de nivel (ver `docs.md §6`).
- [x] T3.7 Explicabilidad con SHAP: top 5 factores con texto en español.
- [x] T3.8 Guardar artefacto versionado + métricas + hash del dataset; comando `train_model`.
- [x] T3.9 Modelo `ModelVersion`; el Admin activa una versión.

**Hecho cuando:** `python manage.py train_model` genera un artefacto con métricas documentadas y una prueba confirma que la inferencia reproduce el resultado del entrenamiento.

### Fase 4 — API de scoring (semana 5)
- [x] T4.1 Servicio `scoring/service.py`: ratios → PD → score → nivel → factores.
- [x] T4.2 Endpoint `POST /api/v1/evaluations/` y `GET` (detalle, listado, filtros).
- [x] T4.3 Guardar `Evaluation` con snapshot de entradas, versión del modelo y factores (reproducible).
- [x] T4.4 Manejo de datos incompletos: calcular con imputación declarada o rechazar con mensaje claro.
- [x] T4.5 Pruebas: casos de borde (sin estados financieros, valores negativos, NIT inexistente).

### Fase 5 — Frontend (semanas 5–7)
- [x] T5.1 Login, layout por rol, protección de rutas.
- [x] T5.2 Analista: buscar NIT → ficha → solicitar evaluación → resultado (score, nivel, factores SHAP, aviso de limitaciones).
- [x] T5.3 Analista: historial de evaluaciones con filtros.
- [x] T5.4 Empresa: formulario y carga CSV de estados financieros; ver su última evaluación.
- [x] T5.5 Admin: usuarios, aprobar vínculos, modelos (métricas, activar), auditoría.
- [x] T5.6 Estados de carga, error y vacío en todas las pantallas; accesibilidad básica.

### Fase 6 — Informe PDF (semana 7)
- [x] T6.1 Generar PDF: datos de la empresa, score, nivel, factores, versión del modelo, fuentes con fecha, advertencia legal.
- [x] T6.2 Endpoint de descarga con control de permisos y registro en auditoría.

### Fase 7 — Calidad, seguridad y cierre (semana 8)
- [x] T7.1 Cobertura mínima: ≥70% en `scoring`, `financials`, `accounts`.
- [x] T7.2 Revisión de seguridad (lista en `AGENTS.md §6`).
- [x] T7.3 `docs.md` completo y actualizado (instalación, métricas reales, limitaciones).
- [x] T7.4 Prueba de punta a punta con los tres roles.
- [x] T7.5 Demo guionizada y datos de ejemplo cargados.

## 6. Cronograma

| Semana | Foco |
|---|---|
| 1 | Fase 0 + inicio Fase 1 |
| 2 | Fase 1 + inicio Fase 2 |
| 3 | Fase 2 + inicio Fase 3 |
| 4 | Fase 3 (entrenamiento y evaluación) |
| 5 | Cierre Fase 3 + Fase 4 + inicio Fase 5 |
| 6 | Fase 5 |
| 7 | Cierre Fase 5 + Fase 6 |
| 8 | Fase 7 y colchón |

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Los datos abiertos no traen estados financieros por NIT | Verificar en T0.6; si faltan, la carga por Empresa/Analista es la vía principal |
| La fuente externa cae o limita solicitudes | Timeout, reintentos, caché de snapshots, `MockSource` |
| Resultados "demasiado buenos" por dataset sintético | Documentarlo, usar partición temporal y ruido realista |
| *Data leakage* | Features solo con información anterior a la fecha de corte; revisión en T3.3 |
| Alcance excesivo para 1 persona | Si hay retraso, recortar primero: CSV masivo, gráficos avanzados, vínculo Empresa |
| Agente de IA que modifica de más | Reglas en `AGENTS.md`, tareas pequeñas, revisión de cada diff |

## 8. Recorte si el tiempo se acaba (orden de sacrificio)

1. Carga por CSV (dejar solo formulario).
2. Panel de auditoría en Admin (dejar solo consulta en el admin de Django).
3. Comparación de dos modelos (dejar solo XGBoost calibrado).
4. Vista de Empresa para ver su evaluación.

**No se recorta:** auditoría de accesos, avisos de limitaciones, pruebas de scoring, `docs.md`.

## 9. Cómo trabajar con Antigravity

1. Deja `AGENTS.md` en la raíz del repositorio.
2. Pide **una tarea por vez** usando su ID: *"Ejecuta T1.1. Antes de escribir código, resume el plan y los archivos que tocarás."*
3. Revisa el diff, ejecuta las pruebas y marca la tarea.
4. Pide actualizar `docs.md` si cambió algo (modelo de datos, endpoints, métricas).
5. Haz commit por tarea: `feat(T1.1): custom user with roles`.

Primer prompt sugerido:
> Lee `AGENTS.md`, `PLAN.md` y `docs.md`. Ejecuta la Fase 0 tarea por tarea. Después de cada tarea detente, muestra qué cambió y espera mi confirmación.
