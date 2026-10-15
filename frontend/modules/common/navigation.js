/**
 * navigation.js - Gestión de la navegación entre pestañas de la aplicación
 */

function initTabNav() {
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panelId = "panel-" + btn.dataset.tab;
      const target = document.getElementById(panelId);
      if (target) {
        target.classList.add("active");
      }
    });
  });
}
