# ML Data Outputs - HAVI 360 Intelligence Engine (Definitivo)

Este directorio contiene el pipeline de procesamiento de datos y los resultados generados para la demo de **Hey Sense (HAVI 360 v2)**.

## Componentes del Entregable

1. **ML_Pipeline_v0.py**: Motor de inteligencia en Python que unifica el ETL, Modelos ML y la Serialización de Pantallas.
2. **mock/user_profiles.json**: Perfiles analíticos consolidados de los 15 usuarios seleccionados para la demo.
3. **mock/screen_data/**: 105 archivos JSON (7 pantallas por usuario) con contextos dinámicos y datos reales sanitizados.

## Lógica de Inteligencia Artificial

### 1. Segmentación ADN (Clustering K-Means)
Segmentación de la base de 15,000 usuarios en 3 arquetipos financieros clave para la personalización de la UX:
- **Ahorrador Consolidado**: Alta antigüedad, saldo estable y baja utilización de crédito.
- **Joven Digital**: Usuarios jóvenes con alta frecuencia de transacciones digitales.
- **Heavy User Crédito**: Usuarios con uso intensivo de líneas de crédito y balances variables.

### 2. Detección de Riesgos (Isolation Forest)
Modelo de detección de anomalías que identifica desviaciones en el comportamiento transaccional.
- El `anomaly_score` penaliza dinámicamente la **Salud Financiera**.
- Dispara estados de seguridad proactiva ante patrones de gasto inusuales.

### 3. Motor de Triggers Inteligente (8 Estados)
Sistema de decisión híbrido (ML + Reglas) que asigna una prioridad de comunicación:
- **T01-T02**: Mitigación de riesgo y gestión de deuda.
- **T03-T06**: Upselling y maximización de patrimonio (Hey Pro, Inversión).
- **T04-T05**: Retención y gamificación (Reactivación, Cashback).
- **T07-T08**: Soporte operativo y reporte de salud preventivo.

## Innovaciones Demo-Ready

*   **Mensajería Contextual Dinámica**: El mensaje de HAVI (`opening_message`) se adapta automáticamente a la pantalla donde se encuentra el usuario (Home, Health, Cards, etc.) manteniendo la coherencia narrativa.
*   **Muestreo Blindado**: Selección estratégica de 15 usuarios que incluye 5 casos de uso críticos para el guion de la demo y 10 usuarios aleatorios para demostrar robustez.
*   **Seguridad Frontend (NaN-Free)**: Limpieza total de valores nulos de Pandas, garantizando que todos los JSONs sean válidos para el renderizado en React.

## Estructura de los JSON de Pantalla
- `havi_context`: Contexto en lenguaje natural para la "memoria" del asistente de IA.
- `data.trigger_active`: Objeto de decisión con ID, nombre y mensaje adaptado a la pantalla.
- `data.tarjetas_credito / movimientos_recientes`: Datos reales mapeados desde los archivos maestros de Hey.
