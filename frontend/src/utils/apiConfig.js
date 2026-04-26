const PROD_API_URL = 'https://havi-api-production.up.railway.app'

// En desarrollo usamos el proxy de Vite (/api).
// En producción evitamos caer a /api porque el static server responde index.html.
export const API_BASE = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? PROD_API_URL : '/api'
)
