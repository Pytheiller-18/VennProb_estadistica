/**
 * api.js - Configuración y cliente de conexión con la API REST de Flask
 */

const API_BASE          = window.location.origin.includes("5000") ? window.location.origin : "http://127.0.0.1:5000";
const API_SOLVE_URL     = `${API_BASE}/api/solve`;
const API_HEALTH        = `${API_BASE}/api/health`;
const API_CALCULATE_URL = `${API_BASE}/api/calculate`;

/**
 * Verifica el estado de salud del backend Flask.
 */
async function initHealthCheck() {
  const pill = document.getElementById("api-status-indicator");
  const txt  = document.getElementById("api-status-text");
  if (!pill || !txt) return;

  try {
    const r = await fetch(API_HEALTH);
    if (r.ok) {
      pill.className = "api-status-pill connected";
      txt.textContent = "Backend conectado";
    } else {
      throw new Error("HTTP error " + r.status);
    }
  } catch {
    pill.className = "api-status-pill error";
    txt.textContent = "Backend no disponible";
  }
}
