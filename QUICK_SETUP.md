# 🚀 Quick Setup: Havi 360

Este documento contiene los pasos mínimos para correr el **Backend (FastAPI)** y el **Frontend (Vite/React)** de la demo.

## 📋 Prerrequisitos
- **Python 3.11+**
- **Node.js 18+**
- Una **API Key de Anthropic** (Claude) configurada en el backend.

---

## 🛠️ Paso 1: Configuración del Backend

1. **Navegar a la carpeta:**
   ```bash
   cd api
   ```
2. **Crear y activar entorno virtual:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   ```
3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configurar variables de entorno:**
   Crea un archivo `.env` dentro de la carpeta `api/`:
   ```bash
   ANTHROPIC_API_KEY=tu_api_key_aqui
   ```
5. **Arrancar el servidor:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   > **Nota:** El servidor debe mostrar el mensaje: `[loader] 5 perfiles cargados` y `[screen_loader] N estados de pantalla cargados`.

---

## 💻 Paso 2: Configuración del Frontend

1. **Abrir una nueva terminal y navegar a la carpeta:**
   ```bash
   cd frontend
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Arrancar entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   > El frontend correrá por defecto en: **`http://localhost:5173`**

---

## 🧪 Paso 3: Credenciales de Prueba (Demo Flow)

Usa cualquiera de estos usuarios para ver la **inteligencia proactiva** y el **screen-awareness** en acción. 

> **Nota:** Debes escribir tanto el User ID como la contraseña manualmente. La contraseña para todos es **`demo`**.

| User ID | Nombre en App | Escenario de Demo | Mascota |
| :--- | :--- | :--- | :--- |
| **`USR-00042`** | **Ivan** | **Inversión:** Sugiere invertir $12,400 ociosos. | Zorro Rojo |
| **`USR-00207`** | **Roberto** | **Pago Fallido:** Analiza pago fallido en Superama. | Perro Blanco |
| **`USR-00489`** | **Carlos** | **Suscripciones:** Detecta $1,837 en apps mensuales. | Panda Marrón |
| **`USR-00101`** | **Mariana** | **Hey Pro:** Oportunidad de ser Hey Pro. | Panda Negro |

---

## 🔍 Troubleshooting (Solución de problemas)

- **Pantalla en blanco:** Verifica que el puerto en el navegador coincida con el que indica Vite (ej. 5173 o 5174).
- **Error 401 / Invalid Token:** Asegúrate de que el Backend esté corriendo en el puerto **8000**. El proxy de Vite está configurado para ese puerto específico.
- **Havi no responde:** Revisa los logs de la terminal del backend. Si hay errores de Anthropic, verifica que tu `ANTHROPIC_API_KEY` sea válida.
- **La mascota no se mueve:** Asegúrate de que la pestaña del navegador tenga el foco. Muchos navegadores pausan las animaciones en pestañas inactivas.

---

¡Listo! Ya puedes navegar, hablar con Havi y ver cómo la viñeta de diálogo sigue a la mascota por toda la aplicación. 🚀
