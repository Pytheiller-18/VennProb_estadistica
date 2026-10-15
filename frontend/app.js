/**
 * VennProb v2.2 — app.js (Orquestador Principal)
 * 
 * Arquitectura Modular organizada por carpetas:
 *  ├── modules/common/
 *  │   ├── state.js          # Estado global reactivo
 *  │   ├── api.js            # Cliente HTTP y verificación de salud
 *  │   └── navigation.js     # Control de pestañas de navegación
 *  ├── modules/espacio_muestral/
 *  │   ├── espacio_muestral.js   # Solucionador, Laplace, Inclusión-Exclusión y métricas
 *  │   └── espacio_muestral.css  # Formularios, selectores y tarjetas de pasos
 *  ├── modules/diagrama_venn/
 *  │   ├── diagrama_venn.js      # Renderizador D3/Venn.js con datos en regiones y SVG
 *  │   └── diagrama_venn.css     # Estilos de gráfica, badges del Universo y particiones
 *  ├── modules/calculadora/
 *  │   ├── calculadora.js        # Casio fx-350ES PLUS, cursor LCD, fracciones y combinatoria
 *  │   └── calculadora.css       # Chasis de la calculadora, display LCD y teclado
 *  └── modules/ejemplos/
 *      ├── ejemplos.js           # Banco de presets y ejercicios guiados
 *      └── ejemplos.css          # Catálogo de problemas y badges
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicialización de navegación y conectividad
  if (typeof initTabNav === "function") initTabNav();
  if (typeof initHealthCheck === "function") initHealthCheck();

  // 2. Inicialización de los módulos de la aplicación
  if (typeof initSolverListeners === "function") initSolverListeners();
  if (typeof initDirectVennListeners === "function") initDirectVennListeners();
  if (typeof initExamplesListeners === "function") initExamplesListeners();
  if (typeof initCalculator === "function") initCalculator();

  // 3. Estado inicial: modo de 2 eventos por defecto
  if (typeof showNumEventsUI === "function") showNumEventsUI(2);
});
