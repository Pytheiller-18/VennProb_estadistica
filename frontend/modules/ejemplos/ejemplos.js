/**
 * ejemplos.js - Módulo de Ejemplos y Ejercicios Prácticos
 * Contiene el banco de problemas predefinidos y la lógica para precargarlos
 * en el Solucionador de Probabilidad.
 */

const PRESETS = {
  "preset-2-intersecting": {
    numEvents: 2,
    inputMode: "probabilities",
    nameA: "Matemáticas",
    nameB: "Inglés",
    valA: 0.60,
    valB: 0.50,
    isDisjoint: false,
    valAB: 0.30,
    valUnion: ""
  },
  "preset-2-disjoint": {
    numEvents: 2,
    inputMode: "probabilities",
    nameA: "Número Par",
    nameB: "Número Impar",
    valA: 0.50,
    valB: 0.50,
    isDisjoint: true,
    valAB: 0.0,
    valUnion: ""
  },
  "preset-2-union": {
    numEvents: 2,
    inputMode: "probabilities",
    nameA: "Grupo A",
    nameB: "Grupo B",
    valA: 0.55,
    valB: 0.45,
    isDisjoint: false,
    valAB: "",
    valUnion: 0.80
  },
  "preset-3-classic": {
    numEvents: 3,
    inputMode: "probabilities",
    nameA: "Netflix",
    nameB: "Spotify",
    nameC: "Prime Video",
    valA: 0.50,
    valB: 0.45,
    valC: 0.35,
    val3AB: 0.20,
    val3AC: 0.15,
    val3BC: 0.12,
    val3ABC: 0.06,
    val3Union: ""
  },
  "preset-3-deduce": {
    numEvents: 3,
    inputMode: "probabilities",
    nameA: "Español",
    nameB: "Inglés",
    nameC: "Francés",
    valA: 0.50,
    valB: 0.40,
    valC: 0.40,
    val3AB: 0.20,
    val3AC: 0.15,
    val3BC: 0.15,
    val3ABC: "",
    val3Union: 0.80
  },
  "preset-3-counts": {
    numEvents: 3,
    inputMode: "counts",
    sampleSpace: 200,
    nameA: "Fútbol",
    nameB: "Baloncesto",
    nameC: "Natación",
    valA: 100,
    valB: 80,
    valC: 70,
    val3AB: 40,
    val3AC: 30,
    val3BC: 25,
    val3ABC: 15,
    val3Union: ""
  }
};

function initExamplesListeners() {
  document.querySelectorAll(".example-card").forEach(card => {
    const loadPreset = () => {
      const key = card.dataset.preset;
      applyPreset(key);

      // Cambiar a la pestaña del solucionador
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      const navSolver = document.getElementById("nav-solver");
      const panelSolver = document.getElementById("panel-solver");
      if (navSolver) navSolver.classList.add("active");
      if (panelSolver) panelSolver.classList.add("active");
    };

    card.addEventListener("click", loadPreset);
    const btn = card.querySelector(".example-load-btn");
    if (btn) {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        loadPreset();
      });
    }
  });
}

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;

  if (typeof showNumEventsUI === "function") {
    showNumEventsUI(p.numEvents);
  }

  const modeProb = document.getElementById("mode-prob");
  const modeCounts = document.getElementById("mode-counts");
  const ssInput = document.getElementById("input-sample-space");

  if (p.inputMode === "probabilities") {
    if (modeProb) modeProb.checked = true;
  } else {
    if (modeCounts) modeCounts.checked = true;
    if (ssInput) ssInput.value = p.sampleSpace || 100;
  }

  if (typeof updateCountMode === "function") {
    updateCountMode();
  }

  if (p.numEvents === 1) {
    const elNameA1 = document.getElementById("name-a1");
    const elValA1  = document.getElementById("val-a1");
    if (elNameA1) elNameA1.value = p.nameA || "Evento A";
    if (elValA1)  elValA1.value  = p.valA;
  } else if (p.numEvents === 2) {
    const elNameA = document.getElementById("name-a");
    const elNameB = document.getElementById("name-b");
    const elValA  = document.getElementById("val-a");
    const elValB  = document.getElementById("val-b");
    const elDisjoint = document.getElementById("check-disjoint");
    const elValAB = document.getElementById("val-ab");
    const elValUnion = document.getElementById("val-union-ab");

    if (elNameA) elNameA.value = p.nameA || "Evento A";
    if (elNameB) elNameB.value = p.nameB || "Evento B";
    if (elValA)  elValA.value  = p.valA;
    if (elValB)  elValB.value  = p.valB;

    state.isDisjoint = !!p.isDisjoint;
    if (elDisjoint) elDisjoint.checked = state.isDisjoint;
    if (elValAB)    elValAB.value    = p.valAB !== "" ? p.valAB : "";
    if (elValUnion) elValUnion.value = p.valUnion !== "" ? p.valUnion : "";

    if (typeof updateDisjointUI === "function") updateDisjointUI();
  } else {
    const el3A = document.getElementById("name-3a");
    const el3B = document.getElementById("name-3b");
    const el3C = document.getElementById("name-3c");
    const elVal3A = document.getElementById("val-3a");
    const elVal3B = document.getElementById("val-3b");
    const elVal3C = document.getElementById("val-3c");
    const elVal3AB = document.getElementById("val-3-ab");
    const elVal3AC = document.getElementById("val-3-ac");
    const elVal3BC = document.getElementById("val-3-bc");
    const elVal3ABC = document.getElementById("val-3-abc");
    const elVal3Union = document.getElementById("val-3-union");

    if (el3A) el3A.value = p.nameA || "Evento A";
    if (el3B) el3B.value = p.nameB || "Evento B";
    if (el3C) el3C.value = p.nameC || "Evento C";
    if (elVal3A) elVal3A.value = p.valA;
    if (elVal3B) elVal3B.value = p.valB;
    if (elVal3C) elVal3C.value = p.valC;
    if (elVal3AB) elVal3AB.value = p.val3AB;
    if (elVal3AC) elVal3AC.value = p.val3AC;
    if (elVal3BC) elVal3BC.value = p.val3BC;
    if (elVal3ABC) elVal3ABC.value = p.val3ABC !== "" ? p.val3ABC : "";
    if (elVal3Union) elVal3Union.value = p.val3Union !== "" ? p.val3Union : "";
  }

  if (typeof updatePrefixes === "function") updatePrefixes();
  if (typeof solveProblem === "function") solveProblem();
}
