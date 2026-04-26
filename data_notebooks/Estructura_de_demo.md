# Pitch y Demo Maestro: Havi 360 - El Acompañamiento Total

## 1. Visión y Tesis: "Havi es la Interfaz" (0:00 - 0:45)
*Criterio: Definición y Alcance (15 pts)*

* **El Problema:** Los asistentes actuales son reactivos y están aislados del flujo real del usuario. No generan conexión emocional ni utilidad inmediata.
* **La Solución:** Havi 360 rompe la barrera del botón de chat. No es una herramienta dentro de la app; **Havi es la interfaz**. Es una capa omnipresente que guía, protege y evoluciona con el cliente.
* **Accionable de Negocio:** Convertir la salud financiera en un activo visual para incrementar el engagement (DAU) y la conversión de productos del portafolio.

---

## 2. Metodología e Inteligencia (Criterio Técnico)
* **Pipeline Híbrido:** Integración de ~24,000 logs conversacionales (Parquet) con registros transaccionales (CSV).
* **Modelado:** Uso de aprendizaje no supervisado (**K-Prototypes**) para definir arquetipos dinámicos basados en demografía (edad, ingresos) y comportamiento RFM (Recency, Frequency, Monetary).
* **Arquitectura:** Sistema basado en estados JSON consumidos por el frontend, garantizando una infraestructura escalable, de baja latencia y bajo costo computacional.

---

## 3. Demo 360: Acompañamiento en el Journey (0:45 - 4:15)
*Criterio: Innovación (35 pts) y Presentación (15 pts)*

### 📱 Dispositivo 1: El Estudiante (Acompañamiento Preventivo y Salud)
* **Login & Efecto Espejo:** Havi recibe al usuario con ropa sincronizada al diseño de su tarjeta física (sentido de pertenencia).
* **Salud Visual:** Havi se muestra "preocupado" (sudando) debido a un `utilizacion_pct` crítico (>90%) detectado en tiempo real.
* **Intervención Proactiva:** El usuario intenta realizar una `transf_salida`. Havi "salta" sobre el botón de envío para advertir: *"Esta transferencia nos dejará sin saldo para el resto de la semana. ¿Seguro que avanzamos?"*.
* **Traducción de Datos:** En la lista de movimientos, Havi flota sobre un rechazo y explica: *"Ayer el pago en Amazon no pasó por saldo insuficiente"*.

### 📱 Dispositivo 2: El Hey Pro (Acompañamiento de Valor y Screen-Awareness)
* **Perfil Premium:** Havi luce una armadura metálica (Estatus Hey Pro = True).
* **Screen-Awareness:** Al navegar a "Salud Financiera", Havi se ancla en la esquina superior derecha y explica de forma proactiva la gráfica de rendimientos.
* **Acción 360:** Havi detecta dinero estático y lanza una **Acción a un Clic**: *"¿Invertimos $1,000 MXN ahora?"*.
* **Evolución del Avatar:** Al confirmar la inversión, Havi celebra y desbloquea visualmente su accesorio de maletín, integrando el nuevo producto al ecosistema visual del usuario.

### 📱 Dispositivo 3: Dueño de Negocio (Acompañamiento en Crisis y Seguridad)
* **Ciberseguridad Activa:** Havi detecta un cargo `es_internacional` atípico en la cuenta empresarial y lanza una alerta inmediata con un botón de bloqueo de tarjeta integrado en el diálogo.
* **El Puente Humano:** Ante la situación crítica, Havi no intenta resolverlo solo. Cambia a un tono urgente y ofrece el **Puente Humano**: *"Esto es delicado, ya le pasé tu historial a un asesor experto, te conecto ahora mismo"*. Transiciona el chat a un humano con todo el contexto transaccional ya cargado.

---

## 4. Viabilidad e Impacto de Negocio (4:15 - 5:00)
*Criterio: Viabilidad e Impacto (35 pts)*

* **Cálculo de Costos:**
    * **Computacional:** Bajo. El procesamiento pesado de ML ocurre asíncronamente en la nube; el cliente solo procesa estados visuales ligeros.
    * **Humano:** Optimización del soporte técnico mediante la pre-clasificación y el envío de contexto automatizado al "Puente Humano".
* **Impacto esperado:** Gamificación inspirada en Duolingo para reducir los motivos de rechazo por saldo insuficiente y aumentar la contratación orgánica de productos (Cross-Selling) mediante "misiones" y accesorios.
* **Limitaciones:** La latencia en redes de baja velocidad podría afectar la carga de animaciones pesadas; se propone una versión "lite" basada en sprites 2D para asegurar la inclusión digital.
* **Comparativa de Mercado:** Superamos a la banca tradicional eliminando la fricción de los banners estáticos, sustituyéndolos por un compañero que "vive" el dinero con el usuario.

---

## 5. Conclusión
Havi 360 cumple la misión de Hey Banco: soluciones simples y eficientes centradas en las personas. No es un chatbot; es el futuro de la banca viva.

