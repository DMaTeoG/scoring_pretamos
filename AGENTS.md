# AGENTS.md — Reglas para agentes de IA

Proyecto: **Sistema Web Inteligente de Scoring Empresarial** (académico/experimental).
Lee también `PLAN.md` (tareas) y `docs.md` (documentación viva). Si hay conflicto, esta guía manda.

## 1. Contexto
- Dado un NIT, el sistema reúne información pública y financiera, calcula un **score 0–1000**, un **nivel de riesgo** (bajo, medio, alto, muy alto), explicaciones SHAP y un PDF.
- Es **apoyo a la decisión de un analista**, nunca una aprobación o rechazo automático de créditos.
- Roles: `ANALYST`, `COMPANY`, `ADMIN`.

## 2. Stack (no cambiar sin pedirlo)
- Backend: Python 3.12+, Django, Django REST Framework, PostgreSQL, simplejwt.
- ML: pandas, scikit-learn, XGBoost, SHAP, joblib. Se ejecuta dentro de Django.
- PDF: ReportLab.
- Frontend: Next.js (App Router), TypeScript estricto, Tailwind, TanStack Query, react-hook-form + zod.
- Ejecución local **sin Docker**. No agregues Dockerfile ni docker-compose.
- No agregues dependencias nuevas sin explicar por qué y esperar aprobación.

## 3. Cómo trabajar (obligatorio)
1. **Una tarea del `PLAN.md` por vez.** Cita el ID (ej. T2.1).
2. Antes de escribir código: resume tu plan, los archivos que tocarás y las dudas. Si falta información, **pregunta**; no inventes.
3. Cambios mínimos y enfocados. No refactorices ni reformatees código fuera del alcance de la tarea.
4. Escribe o actualiza pruebas junto con el código. Ejecútalas y reporta el resultado real.
5. Si algo falla, di qué falló. Nunca afirmes que algo funciona sin haberlo ejecutado.
6. Al terminar: lista archivos modificados, pruebas ejecutadas y qué sección de `docs.md` actualizaste.
7. No hagas commits, `push`, migraciones destructivas ni borrados masivos sin confirmación.
8. No toques `.env`, secretos ni archivos fuera del repositorio.

## 4. Idioma y estilo
- Código, nombres, commits y comentarios técnicos: **inglés**.
- Texto visible al usuario, mensajes de error de la API para el usuario y documentación: **español**.
- Python: PEP 8, type hints, funciones cortas. Formateo con `ruff` y `black`.
- TypeScript: sin `any`; tipos para toda respuesta de API.
- Commits: `tipo(Txx): descripción` (feat, fix, docs, test, refactor, chore).

## 5. Backend (Django)
- Una app por dominio en `backend/apps/`: `accounts`, `companies`, `sources`, `financials`, `scoring`, `reports`, `audit`.
- La lógica de negocio va en `services.py`, no en vistas ni serializers.
- Serializers explícitos (nunca `fields = "__all__"`).
- Toda API bajo `/api/v1/`, con paginación y códigos HTTP correctos.
- Permisos por rol en clases de permiso reutilizables; cada endpoint declara su permiso.
- Configuración desde variables de entorno. `settings/base.py` y `settings/local.py`.
- Migraciones pequeñas y revisadas. Nunca edites una migración ya aplicada.
- Montos con `Decimal`/`DecimalField`, no `float`.
- Valida NIT (formato y dígito de verificación) en un único módulo reutilizable.

## 6. Seguridad y datos (no negociable)
- **Fuentes autorizadas únicamente:** datos abiertos (datos.gov.co) y datos cargados por el usuario.
- **Prohibido** hacer scraping de sitios que no lo permitan, saltar captchas, usar credenciales ajenas o intentar acceder a información reservada (declaraciones, deudas fiscales de la DIAN).
- Toda consulta externa: timeout, reintentos limitados, manejo de errores y guardado de `DataSourceSnapshot` con fecha.
- Nunca guardes secretos ni datos reales sensibles en el código, tests ni logs.
- Contraseñas con los hashers de Django; JWT en cookies `httpOnly` + `SameSite`; nunca en `localStorage`.
- Aplica comprobación de **permiso a nivel de objeto**: una Empresa solo ve su NIT.
- Registra en `AuditLog` cada consulta de NIT, evaluación y descarga de PDF.
- No imprimas datos personales ni tokens en logs.
- Valida y limita tamaño/tipo en cargas de archivo (CSV).
- CORS restringido al origen del frontend; `DEBUG=False` fuera de local.

## 7. Machine Learning
- **Anti-leakage:** las features usan solo información disponible antes de la fecha de corte. La partición es **temporal** (por año fiscal), nunca aleatoria.
- Entrenamiento e inferencia comparten el mismo código de features (`ml/src/features.py`).
- Semillas fijas; el dataset sintético debe ser reproducible.
- Reporta siempre: AUC, KS, Brier y calibración, sobre el conjunto de prueba.
- Las probabilidades se calibran antes de convertirlas en score: `score = round((1 − PD) × 1000)`.
- Cada `ModelVersion` guarda: algoritmo, features, métricas, hash del dataset, fecha y ruta del artefacto.
- Cada `Evaluation` guarda la versión del modelo y un snapshot de las entradas, para que sea reproducible.
- Los datos faltantes se tratan de forma explícita y se refleja el nivel de **confianza** en el resultado.
- No presentes métricas del dataset sintético como si fueran rendimiento real. Dilo siempre.
- Cargar artefactos con joblib solo desde `ml/artifacts/` (no desde rutas del usuario).

## 8. Frontend (Next.js)
- Server Components por defecto; `"use client"` solo cuando haga falta.
- El navegador nunca llama directo a fuentes externas; solo al backend propio.
- Maneja siempre estados de carga, error y vacío.
- Formularios con validación zod en cliente (el servidor valida de nuevo).
- Muestra siempre el aviso: *"El score es una estimación de riesgo con fines académicos; no garantiza el pago o incumplimiento y no sustituye el criterio del analista."*
- Textos de UI en español, con formato de moneda COP y fechas en español.
- Accesibilidad: etiquetas en inputs, contraste suficiente, navegación con teclado.

## 9. Pruebas
- Backend: `pytest` + `pytest-django`. Cobertura mínima ≥70% en `scoring`, `financials`, `accounts`.
- Cubre siempre: permisos por rol, validación de NIT, ratios con divisiones por cero, scoring con datos incompletos.
- Pruebas de ML: la inferencia reproduce el resultado esperado de una fila fija.
- Frontend: lint y type-check sin errores antes de dar una tarea por terminada.
- Las pruebas no deben llamar a servicios externos reales (usa `MockSource`).

## 10. Documentación
- `docs.md` es la fuente de verdad. Actualízalo en el mismo cambio cuando modifiques: modelo de datos, endpoints, permisos, metodología del score, métricas del modelo, variables de entorno o pasos de instalación.
- Registra decisiones importantes en `docs.md §11 (Registro de decisiones)`.
- No inventes datasets, URLs ni resultados: si no los verificaste, escribe "pendiente de verificar".

## 11. Lo que NO debes hacer
- No implementar aprobación o rechazo automático de créditos.
- No ocultar errores con `try/except` vacíos.
- No dejar `TODO` sin ID de tarea ni código muerto.
- No cambiar el stack, la estructura de carpetas ni el sistema de roles por tu cuenta.
- No añadir funcionalidades fuera del `PLAN.md`.
- No generar datos "reales" de empresas o personas: usa solo sintéticos o abiertos.

## 12. Definición de "hecho"
Una tarea está hecha solo si: cumple su criterio en `PLAN.md`, tiene pruebas que pasan, lint/type-check limpios, `docs.md` actualizado y el resumen final entregado.
