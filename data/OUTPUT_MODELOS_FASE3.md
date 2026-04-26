# Output final de modelos - Hey Sense Fase 3

Este documento explica los outputs generados por el notebook `HeySense_Model_Need_Action_Engine.ipynb`.

La fase 3 recibe como entrada el `Customer 360` construido en fase 2 y produce una tabla final por cliente con:

- segmento inteligente;
- riesgo de anomalia/fraude;
- propensiones comerciales y financieras;
- necesidad implicita detectada;
- next best action;
- canal recomendado;
- mensaje personalizado;
- KPI esperado.

## Archivos generados

Los outputs finales se guardan en `data_model_outputs/`.

| Archivo | Filas x columnas | Uso principal |
|---|---:|---|
| `customer_360_scored.pkl` | 15,025 x 139 | Tabla maestra final con features, modelos, scores, necesidades y accion recomendada por cliente. |
| `next_best_actions.pkl` | 15,025 x 9 | Output listo para demo, dashboard, Havi, push o app. |
| `segment_summary.pkl` | 7 x 9 | Resumen de segmentos descubiertos por clustering. |
| `need_summary.pkl` | 24 x 7 | Resumen de necesidades implicitas por nivel de riesgo. |
| `action_eval.pkl` | 68 x 6 | Evaluacion agregada de acciones recomendadas y su score promedio. |

## 1. `customer_360_scored.pkl`

Es el output mas completo. Representa la vista final de inteligencia por cliente.

Cada fila es un `user_id` y contiene:

- datos demograficos;
- comportamiento conversacional con Havi;
- comportamiento transaccional;
- productos activos;
- scores financieros derivados;
- outputs de modelos;
- necesidad implicita;
- accion recomendada.

### Bloques principales de columnas

| Bloque | Columnas ejemplo | Que significa |
|---|---|---|
| Identidad y contexto | `user_id`, `edad`, `sexo`, `estado`, `ciudad`, `ingreso_mensual_mxn`, `score_buro` | Perfil base del cliente para contextualizar decisiones. |
| Data quality | `satisfaccion_1_10_was_missing`, `estado_was_missing`, `ciudad_was_missing` | Flags que indican si algun dato fue imputado en fase 1. Ayudan a controlar sesgo. |
| Conversaciones Havi | `total_interacciones_havi`, `intencion_dominante`, `frustracion_score`, `urgencia_score`, `temas_recurrentes` | Senales de intencion, friccion, urgencia y temas frecuentes. |
| Transacciones | `total_transacciones`, `monto_total`, `num_no_procesadas`, `num_disputas`, `rechazos_saldo_insuficiente`, `gasto_delivery` | Comportamiento financiero real del cliente. |
| Productos | `tiene_tarjeta_credito`, `tiene_inversion`, `tiene_credito_personal`, `saldo_total`, `utilizacion_credito_max` | Productos actuales y capacidad para recomendar productos faltantes. |
| Scores financieros | `liquidez_score`, `estres_financiero_score`, `capacidad_ahorro_score`, `riesgo_friccion_score`, `riesgo_fraude_score` | Indicadores interpretables para detectar necesidades implicitas. |
| Segmentacion | `cluster_id`, `segmento` | Segmento descubierto con clustering no supervisado. |
| Anomalias | `anomaly_flag`, `anomaly_score` | Riesgo de comportamiento atipico detectado por Isolation Forest. |
| Propensiones | `propension_ahorro`, `propension_inversion`, `propension_credito`, `propension_seguro`, `propension_hey_pro`, `propension_alerta_gasto`, `propension_contacto_humano` | Probabilidad o conveniencia relativa de recomendar una accion/producto. |
| Decision final | `necesidad_implicita`, `riesgo`, `accion_recomendada`, `action_score`, `canal`, `mensaje`, `kpi_esperado` | Output accionable para Havi, app, push o dashboard. |

## 2. Model Layer

La capa de modelos esta compuesta por varios modelos y reglas especializadas. No depende de un solo modelo monolitico.

### NLP para Havi

Objetivo: interpretar conversaciones y convertirlas en senales accionables.

Outputs principales:

| Columna | Interpretacion |
|---|---|
| `intencion_dominante` | Intencion mas frecuente o relevante del cliente. |
| `temas_recurrentes` | Temas detectados en el historial conversacional. |
| `sentimiento_promedio` | Tendencia emocional promedio de las conversaciones. |
| `frustracion_score` | Score de molestia/friccion conversacional. |
| `urgencia_score` | Nivel de urgencia detectado en mensajes. |
| `repeticion_problema_score` | Senal de problemas repetidos con Havi o soporte. |
| `conversation_summary` | Resumen textual del comportamiento conversacional del cliente. |

Ejemplo de uso:

Si un cliente menciona cargos no reconocidos, bloqueo de tarjeta o asesor humano, estas senales elevan los scores de friccion, urgencia o aclaracion.

### Clustering de clientes

Objetivo: descubrir segmentos automaticamente sin etiquetas manuales.

Modelo usado: `KMeans`.

Output:

- `cluster_id`;
- `segmento`.

Segmentos implementados:

- `Clientes con estres financiero`;
- `Candidatos a credito`;
- `Clientes con riesgo de fraude/friccion`;
- `Clientes digitales intensivos`;
- `Ahorradores potenciales`;
- `Clientes de bajo engagement`;
- `Clientes base transaccionales`.

Uso de negocio:

Permite que el pitch no sea solo "cliente por cliente", sino una estrategia escalable por segmentos.

### Anomaly Detection

Objetivo: detectar comportamiento atipico antes de que el cliente reclame.

Modelo usado: `IsolationForest`.

Outputs:

| Columna | Interpretacion |
|---|---|
| `anomaly_flag` | 1 si el cliente muestra comportamiento atipico. |
| `anomaly_score` | Intensidad del riesgo atipico en escala 0-100. |

Casos que ayuda a detectar:

- gasto inusual;
- comercio o ciudad inusual;
- operaciones internacionales;
- multiples intentos fallidos;
- disputas o rechazos frecuentes.

### Propension models

Objetivo: estimar que accion o producto tiene mas sentido para cada cliente.

| Columna | Que mide | Uso |
|---|---|---|
| `propension_ahorro` | Potencial para adoptar metas de ahorro. | Recomendar `crear_meta_ahorro`. |
| `propension_inversion` | Potencial para invertir. | Recomendar `ofrecer_inversion`. |
| `propension_credito` | Potencial para credito responsable. | Recomendar `ofrecer_credito`. |
| `propension_seguro` | Potencial para proteccion/seguro. | Recomendar `ofrecer_seguro`. |
| `propension_hey_pro` | Potencial para beneficios, cashback o perfil premium. | Recomendar beneficios/promociones. |
| `propension_alerta_gasto` | Necesidad de control preventivo de gasto. | Recomendar `activar_alerta_gasto`. |
| `propension_contacto_humano` | Necesidad de escalamiento a asesor. | Recomendar `derivar_asesor`. |

Estas propensiones son scores interpretables en escala 0-100. Para hackathon son apropiadas porque son explicables y faciles de defender ante jueces.

## 3. Need Detection Engine

El `Need Detection Engine` traduce senales del cliente en una necesidad implicita.

Output principal:

| Columna | Descripcion |
|---|---|
| `necesidad_implicita` | Necesidad detectada aunque el cliente no la pida explicitamente. |
| `riesgo` | Nivel de riesgo final: `bajo`, `medio` o `alto`. |

Necesidades implementadas:

| Necesidad | Lectura de negocio |
|---|---|
| `proteccion_y_aclaracion` | El cliente necesita seguridad, revision de cargos o aclaracion. |
| `retencion_friccion` | El cliente muestra friccion, posible molestia o riesgo de abandono. |
| `control_financiero` | El cliente podria necesitar alertas, presupuesto o prevencion de rechazos. |
| `ahorro_inversion` | El cliente tiene potencial para ahorrar o invertir. |
| `credito_responsable` | El cliente podria necesitar credito, pero con criterio de capacidad financiera. |
| `proteccion_seguro` | El cliente podria beneficiarse de seguro o proteccion. |
| `engagement_digital` | El cliente puede aumentar uso de Havi/app con insights personalizados. |
| `educacion_financiera` | El cliente necesita explicacion o acompanamiento financiero basico. |

Regla de prioridad:

Las necesidades de seguridad, aclaracion y friccion se priorizan antes que las comerciales. Esto reduce riesgo operativo y evita recomendar productos cuando el cliente primero necesita resolver un problema.

## 4. Next Best Action Engine

El `Next Best Action Engine` elige la mejor accion para cada cliente combinando:

- necesidad implicita;
- propensiones;
- riesgo;
- anomalias;
- intenciones conversacionales;
- reglas de negocio;
- elegibilidad por productos existentes.

Output principal:

| Columna | Descripcion |
|---|---|
| `accion_recomendada` | Accion final sugerida para ese cliente. |
| `action_score` | Prioridad de la accion en escala 0-100. |
| `canal` | Canal sugerido para ejecutar la accion. |
| `mensaje` | Mensaje personalizado listo para Havi, app o push. |
| `kpi_esperado` | KPI que se espera impactar con la accion. |

### Catalogo completo de acciones

| Accion | Clientes asignados | Objetivo |
|---|---:|---|
| `activar_alerta_gasto` | 105 | Prevenir sobregasto, rechazos y baja liquidez. |
| `crear_meta_ahorro` | 366 | Convertir capacidad de ahorro en habito recurrente. |
| `ofrecer_inversion` | 2,241 | Activar clientes con potencial de inversion. |
| `ofrecer_credito` | 1,767 | Ofrecer credito responsable a clientes con senales de capacidad o interes. |
| `bloquear_tarjeta` | 87 | Mitigar riesgo ante anomalias o posible fraude. |
| `iniciar_aclaracion` | 1,098 | Resolver cargos no reconocidos o disputas. |
| `derivar_asesor` | 499 | Atender friccion alta o riesgo de churn. |
| `explicar_movimiento` | 2,352 | Reducir dudas repetidas y mejorar claridad financiera. |
| `recordar_pago` | 656 | Prevenir atrasos, rechazos o problemas con mensualidades. |
| `ofrecer_seguro` | 5,257 | Recomendar proteccion contextual. |
| `enviar_promocion` | 597 | Activar beneficios relevantes segun comportamiento. |

## 5. `next_best_actions.pkl`

Este es el archivo mas importante para demo.

Contiene solo las columnas necesarias para mostrar la recomendacion final por cliente:

| Columna | Uso en demo |
|---|---|
| `user_id` | Identificador anonimo del cliente. |
| `segmento` | Segmento inteligente descubierto por IA. |
| `necesidad_implicita` | Que necesita el cliente aunque no lo diga. |
| `riesgo` | Prioridad de atencion. |
| `accion_recomendada` | Accion que debe ejecutar Hey/Havi. |
| `action_score` | Ranking de prioridad. |
| `canal` | Donde activar la accion. |
| `mensaje` | Texto listo para interfaz. |
| `kpi_esperado` | Impacto esperado para negocio. |

Ejemplo conceptual:

```json
{
  "user_id": "USR-04063",
  "segmento": "Clientes con riesgo de fraude/friccion",
  "necesidad_implicita": "proteccion_y_aclaracion",
  "riesgo": "alto",
  "accion_recomendada": "iniciar_aclaracion",
  "action_score": 100.0,
  "canal": "Havi + seguimiento en app",
  "mensaje": "Detecte senales de cargos no reconocidos o disputas. Puedo iniciar una aclaracion asistida y dar seguimiento desde la app.",
  "kpi_esperado": "reduccion de tickets repetidos y mejora de satisfaccion"
}
```

## 6. `segment_summary.pkl`

Resumen agregado de los segmentos.

Columnas:

| Columna | Descripcion |
|---|---|
| `cluster_id` | Identificador tecnico del cluster. |
| `segmento` | Nombre de negocio asignado al cluster. |
| `clientes` | Cantidad de clientes en el segmento. |
| `ingreso_promedio` | Ingreso promedio del segmento. |
| `satisfaccion_promedio` | Satisfaccion promedio del segmento. |
| `fraude_promedio` | Riesgo promedio de fraude/anomalia. |
| `friccion_promedio` | Riesgo promedio de friccion. |
| `inversion_promedio` | Propension promedio a inversion. |
| `churn_promedio` | Riesgo promedio de churn/friccion. |

Uso:

Sirve para una grafica de segmentos en dashboard y para explicar que el modelo no solo clasifica, sino que descubre grupos accionables.

## 7. `need_summary.pkl`

Resumen de necesidades implicitas por nivel de riesgo.

Columnas:

| Columna | Descripcion |
|---|---|
| `necesidad_implicita` | Necesidad detectada. |
| `riesgo` | Nivel de riesgo. |
| `clientes` | Cantidad de clientes en esa combinacion. |
| `fraude_promedio` | Riesgo promedio de fraude. |
| `friccion_promedio` | Riesgo promedio de friccion. |
| `estres_promedio` | Estres financiero promedio. |
| `inversion_promedio` | Propension promedio a inversion. |

Uso:

Permite responder: "Cuales son las necesidades ocultas mas comunes en la base de clientes?"

## 8. `action_eval.pkl`

Resumen agregado de acciones recomendadas.

Columnas:

| Columna | Descripcion |
|---|---|
| `necesidad_implicita` | Necesidad que origino la accion. |
| `accion_recomendada` | Accion elegida por el motor. |
| `kpi_esperado` | KPI asociado a esa accion. |
| `clientes` | Numero de clientes impactados. |
| `action_score_promedio` | Prioridad promedio de esa accion. |
| `riesgo_alto` | Numero de clientes de alto riesgo en ese grupo. |

Uso:

Este archivo conecta IA con negocio. Permite mostrar impacto esperado por accion, priorizar pilotos y estimar valor.

## 9. Interpretacion de scores

Todos los scores principales estan en escala 0-100.

| Rango | Lectura |
|---|---|
| 0-30 | Bajo |
| 31-60 | Medio |
| 61-100 | Alto |

Recomendacion para demo:

- mostrar clientes con `action_score` alto primero;
- filtrar por `riesgo = alto` para casos criticos;
- comparar `necesidad_implicita` contra `accion_recomendada`;
- mostrar el `mensaje` como si fuera enviado por Havi.

## 10. Riesgos y controles

### Data leakage

No se debe entrenar un modelo usando variables que solo se conocerian despues de la accion.

Ejemplo:

- No usar conversion futura para calcular propension si se presenta como prediccion previa.
- No usar satisfaccion posterior a la intervencion para decidir la accion actual.

### Sesgo

Variables como ciudad, estado, edad, ingreso o score buro pueden introducir sesgos.

Control recomendado:

- monitorear distribucion de acciones por segmento demografico;
- revisar fairness antes de produccion;
- mantener explicabilidad por accion;
- priorizar seguridad y atencion antes que venta.

### Uso responsable

Para banca, el motor debe recomendar ayuda financiera sin sobreexponer al cliente a deuda.

Regla aplicada:

- seguridad y aclaracion tienen prioridad;
- friccion y asesor humano tienen prioridad sobre ofertas;
- credito se trata como credito responsable, no como venta agresiva.

## 11. Como usarlo en la demo

Flujo recomendado:

1. Cargar `next_best_actions.pkl`.
2. Mostrar un dashboard con:
   - clientes analizados;
   - segmentos;
   - necesidades implicitas;
   - acciones recomendadas;
   - casos de alto riesgo.
3. Seleccionar un cliente.
4. Mostrar:
   - segmento;
   - necesidad implicita;
   - scores principales;
   - accion recomendada;
   - mensaje personalizado de Havi.
5. Simular ejecucion:
   - push;
   - Havi;
   - bloqueo;
   - aclaracion;
   - oferta contextual;
   - alerta de gasto.

Frase para pitch:

> Hey Sense no solo responde preguntas. Detecta necesidades implicitas, prioriza riesgos y ejecuta la siguiente mejor accion para cada cliente.
