# Proyecto: Havi 360

## 1. Visión Central: Romper la Barrera
El objetivo principal es dejar atrás la idea del chatbot tradicional escondido detrás de un botón y pasar a una solución automatizada y altamente personalizada. Queremos romper la barrera entre el "asistente" y la "aplicación"; que Havi sea la interfaz. 

Havi se convierte en un Avatar Omnipresente y Contextual que vive como una capa sobre la aplicación de Hey Banco. Havi tiene "Screen-Awareness" (Conciencia de Pantalla), lo que significa que sabe exactamente qué sección está mirando el usuario y actúa como un copiloto financiero en tiempo real.

---

## 2. Omnipresencia y "Screen-Awareness" (El Journey)
Havi no espera a que el usuario pregunte; Havi guía y contextualiza los números fríos en todas las secciones:

* **Inicio de Sesión (Login) - "Daily Briefing" y "Efecto Espejo":** Al entrar, Havi recibe al usuario con un resumen de su inactividad y genera un sentido de pertenencia inmediato sincronizando su diseño.
    * **Datos Visuales:** El sistema cruza el `user_id` con la tabla de productos. Si el cliente tiene la `tarjeta_credito_negocios`, Havi viste los colores de esa tarjeta física; si adquiere el estatus premium, evoluciona a un diseño metálico.
    * **Datos Resumen:** Consulta `hey_transacciones.csv` para revisar la última `fecha_hora` y cuenta operaciones recientes como `transf_entrada` o el `cashback_generado`.
    * **Intervención:** "¡Hola! Desde tu última visita, recibimos 2 transferencias y generaste $50 pesos de cashback.".
* **Sección Salud Financiera - "El Analista de Bolsillo":** Havi se ancla en la esquina superior derecha para explicar las gráficas de manera proactiva.
    * **Datos:** Analiza si el `utilizacion_pct` es alto o si la variable `patron_uso_atipico` es `True`.
    * **Intervención:** "Veo que la utilización de tu tarjeta está al 85% y detecté un patrón atípico. Te sugiero usar débito estos días".
* **Sección de Movimientos - "El Traductor":** Havi flota cerca de la lista de transacciones para dar contexto a los rechazos.
    * **Datos:** Filtra transacciones con `estatus` en `no_procesada` y `motivo_no_procesada` en `saldo_insuficiente`.
    * **Intervención:** "Ayer intentamos un pago y no pasó por saldo insuficiente. Recuerda que tienes un crédito preaprobado a un clic".

---

## 3. Funciones Avanzadas: Havi como Aliado Activo
Para demostrar que Havi realmente ayuda y no solo explica, se integran las siguientes funciones clave:

* **Acciones a un Clic (Havi como Ejecutor):** Havi integra botones directamente en sus globos de diálogo para resolver problemas de inmediato.
    * **Ejemplo de Seguridad:** Si detecta un cargo con `es_internacional = True`, Havi lanza la alerta y ofrece ahí mismo el botón de "Bloquear tarjeta".
    * **Ejemplo de Inversión:** Si sugiere hacer un `abono_inversion` porque hay dinero estático, ofrece el botón "Invertir $1,000 MXN ahora".
* **Escalación Inteligente y Empática (Puente Humano):** Havi es el primer filtro, pero actúa rápido ante emergencias.
    * **Regla de Escalación:** Si el modelo NLP (basado en `dataset_50k_anonymized`) detecta urgencia o frustración, o si existe una transacción con `estatus = en_disputa`, Havi cede el control.
    * **Intervención de Escalación:** "Veo que esto es delicado. Voy a conectarte con un compañero humano ahora mismo y ya le pasé todo tu historial".
* **Juego Integrado (Rachas de Salud Financiera):** Un sistema de gamificación transaccional.
    * **Mecánica del Juego:** El objetivo es mantener rachas de días sin caer en un `patron_uso_atipico` destructivo o sin tener saldo insuficiente.
    * **Recompensa del Juego:** Al subir de nivel, los usuarios desbloquean cosméticos exclusivos para el avatar de Havi o multiplicadores temporales para su `cashback_generado`.

---

## 4. Personalidad e Imagen (Gamificación y UX)
Inspirados en aplicaciones lúdicas, el estado de las finanzas se refleja visualmente:

* **El Guardarropa (Cross-Selling Visible):** Los productos de `hey_productos.csv` se visualizan como accesorios.
    * **Accesorios Inversión:** `inversion_hey`: Havi lleva gafas y un maletín.
    * **Accesorios Seguros:** `seguro_vida` o `seguro_compras`: Havi sostiene un escudo protector.
* **Tono Hiper-Personalizado (NLP + Clustering):** El comportamiento se adapta al usuario.
    * **Arquetipos (Demografía):** Basado en la demografía de `hey_clientes.csv`, se agrupa al usuario (ej. un estudiante recibe emojis y lenguaje relajado).
    * **Preferencia de Canal (NLP):** Usando el `dataset_50k_anonymized` en formato Parquet, si el usuario prefiere el canal de voz (`channel_source = 2`), Havi priorizará animaciones o notas de audio.

---

## 5. Viabilidad e Impacto de Negocio (Evaluación 35%)
Esta solución garantiza puntos críticos en la rúbrica de evaluación:

* **Engagement Masivo:** Los usuarios entran a la app para ver el estado visual de su avatar y mantener su racha de salud financiera, incrementando drásticamente el uso diario y la retención.
* **Ventas Cruzadas Orgánicas (Cross-Selling):** Al convertir los productos del portafolio en accesorios desbloqueables para Havi, la tasa de conversión para adquirir nuevos seguros o inversiones se dispara frente a los clásicos banners estáticos.
* **Cultura Hey (Diseño Centrado en las Personas):** Cumple con la misión de la empresa al hacer tangibles conceptos financieros complejos sin tecnicismos, brindando un servicio verdaderamente útil y empático.
