// En producción: VITE_API_URL debe ser https://tu-api.railway.app
// En desarrollo: usamos '/api' para que el proxy de Vite haga su trabajo
export const API_BASE = import.meta.env.VITE_API_URL || '/api'
