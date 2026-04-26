// En producción: VITE_API_URL debe ser la URL del servicio 'havi-api' en Railway
// En desarrollo: el proxy de Vite se encarga de redirigir /api
export const API_BASE = import.meta.env.VITE_API_URL || '/api';
