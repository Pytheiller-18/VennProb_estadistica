/**
 * state.js - Estado global de la aplicación VennProb
 */

const state = {
  numEvents: 2,
  inputMode: "probabilities",
  isDisjoint: false,
  lastResult: null,
  directEvents: 2
};

// Exportar globalmente para acceso entre módulos
window.VennState = state;
