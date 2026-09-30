/**
 * app.js - Lógica del Cliente, Comunicación API y Renderizado de Diagramas de Venn
 */

// Configuración de la API REST
const API_BASE = window.location.origin.includes("5000") 
  ? window.location.origin 
  : "http://127.0.0.1:5000";

const API_SOLVE_URL = `${API_BASE}/api/solve`;
const API_HEALTH_URL = `${API_BASE}/api/health`;

// Estado de la Aplicación
const state = {
  numEvents: 2,
  inputMode: "probabilities", // 'probabilities' o 'counts'
  isDisjoint: false,
  lastResult: null
};

// Paleta de Colores para el Diagrama de Venn
const SET_COLORS = {
  "Evento A": "#6366f1",
  "A": "#6366f1",
  "Evento B": "#ec4899",
  "B": "#ec4899",
  "Evento C": "#06b6d4",
  "C": "#06b6d4"
};

// Presets de Ejemplo Predefinidos
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
    valUnion: 1.00
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

// ==========================================================================
// Inicialización del DOM
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initHealthCheck();
  initEventListeners();
  updateFormView();
  // Resolver problema inicial por defecto
  solveProblem();
});

// Comprobar conexión con la API de Flask
async function initHealthCheck() {
  const pill = document.getElementById("api-status-indicator");
  const text = document.getElementById("api-status-text");

  try {
    const res = await fetch(API_HEALTH_URL, { method: "GET" });
    if (res.ok) {
      pill.className = "api-status-pill connected";
      text.textContent = "Backend Flask Conectado";
    } else {
      throw new Error("Estado no OK");
    }
  } catch (err) {
    pill.className = "api-status-pill error";
    text.textContent = "Backend Desconectado";
  }
}

// Configurar listeners de interfaz
function initEventListeners() {
  // Selector 2 vs 3 eventos
  document.getElementById("btn-mode-2").addEventListener("click", () => setNumEvents(2));
  document.getElementById("btn-mode-3").addEventListener("click", () => setNumEvents(3));

  // Selector Probabilidades vs Conteos
  document.querySelectorAll('input[name="input_mode"]').forEach(radio => {
    radio.addEventListener("change", (e) => setInputMode(e.target.value));
  });

  // Checkbox Eventos Disjuntos
  document.getElementById("check-disjoint").addEventListener("change", (e) => {
    state.isDisjoint = e.target.checked;
    updateDisjointState();
  });

  // Selector de Presets
  document.getElementById("example-presets-select").addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Envío del formulario
  document.getElementById("prob-form").addEventListener("submit", (e) => {
    e.preventDefault();
    solveProblem();
  });

  // Botón reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    document.getElementById("prob-form").reset();
    state.isDisjoint = false;
    document.getElementById("check-disjoint").checked = false;
    updateFormView();
    solveProblem();
  });

  // Botón descargar SVG
  document.getElementById("btn-download-svg").addEventListener("click", downloadVennSVG);
}

// Cambiar entre 2 y 3 eventos
function setNumEvents(num) {
  state.numEvents = num;
  document.getElementById("btn-mode-2").classList.toggle("active", num === 2);
  document.getElementById("btn-mode-2").setAttribute("aria-selected", num === 2);
  document.getElementById("btn-mode-3").classList.toggle("active", num === 3);
  document.getElementById("btn-mode-3").setAttribute("aria-selected", num === 3);
  updateFormView();
}

// Cambiar entre modo probabilidades y modo conteos
function setInputMode(mode) {
  state.inputMode = mode;
  updateFormView();
}

// Actualizar campos visibles y prefijos según modo
function updateFormView() {
  const isCounts = state.inputMode === "counts";
  const is3 = state.numEvents === 3;

  // Contenedor espacio muestral
  document.getElementById("sample-space-container").classList.toggle("hidden", !isCounts);

  // Evento C
  document.getElementById("box-event-c").classList.toggle("hidden", !is3);

  // Secciones de relaciones
  document.getElementById("section-rel-2").classList.toggle("hidden", is3);
  document.getElementById("section-rel-3").classList.toggle("hidden", !is3);

  // Prefijos dinámicos
  const prefix = isCounts ? "|" : "P(";
  const suffix = isCounts ? "| =" : ") =";

  document.getElementById("prefix-a").textContent = `${prefix}A${suffix}`;
  document.getElementById("prefix-b").textContent = `${prefix}B${suffix}`;
  document.getElementById("prefix-c").textContent = `${prefix}C${suffix}`;

  // Actualizar placeholders y etiquetas de modo
  const step = isCounts ? "1" : "any";
  const min = isCounts ? "0" : "0";
  const max = isCounts ? "" : "1";

  const numberInputs = document.querySelectorAll('#prob-form input[type="number"]:not(#input-sample-space)');
  numberInputs.forEach(input => {
    input.step = step;
    input.min = min;
    if (max) input.max = max;
  });

  updateDisjointState();
}

// Ajustes al activar/desactivar disyuntividad
function updateDisjointState() {
  const hint = document.getElementById("disjoint-hint");
  const interContainer = document.getElementById("container-2-inter-union");
  const interInput = document.getElementById("val-ab");

  if (state.numEvents === 2 && state.isDisjoint) {
    hint.classList.remove("hidden");
    interInput.value = "0";
    interInput.disabled = true;
  } else {
    hint.classList.add("hidden");
    interInput.disabled = false;
  }
}

// Cargar un preset de ejemplo
function loadPreset(presetKey) {
  if (!presetKey || !PRESETS[presetKey]) return;
  const p = PRESETS[presetKey];

  setNumEvents(p.numEvents);
  setInputMode(p.inputMode);

  if (p.inputMode === "probabilities") {
    document.getElementById("mode-prob").checked = true;
  } else {
    document.getElementById("mode-counts").checked = true;
    document.getElementById("input-sample-space").value = p.sampleSpace || 100;
  }

  document.getElementById("name-a").value = p.nameA || "Evento A";
  document.getElementById("name-b").value = p.nameB || "Evento B";
  document.getElementById("val-a").value = p.valA;
  document.getElementById("val-b").value = p.valB;

  if (p.numEvents === 2) {
    state.isDisjoint = !!p.isDisjoint;
    document.getElementById("check-disjoint").checked = state.isDisjoint;
    document.getElementById("val-ab").value = p.valAB !== undefined ? p.valAB : "";
    document.getElementById("val-union-ab").value = p.valUnion !== undefined ? p.valUnion : "";
  } else {
    document.getElementById("name-c").value = p.nameC || "Evento C";
    document.getElementById("val-c").value = p.valC;
    document.getElementById("val-3-ab").value = p.val3AB;
    document.getElementById("val-3-ac").value = p.val3AC;
    document.getElementById("val-3-bc").value = p.val3BC;
    document.getElementById("val-3-abc").value = p.val3ABC !== undefined ? p.val3ABC : "";
    document.getElementById("val-3-union").value = p.val3Union !== undefined ? p.val3Union : "";
  }

  updateFormView();
  solveProblem();
}

// ==========================================================================
// Envío a la API y Resolución
// ==========================================================================
async function solveProblem() {
  hideAxiomError();
  const payload = buildPayload();
  if (!payload) return;

  const btnCalc = document.getElementById("btn-calculate");
  const originalText = btnCalc.innerHTML;
  btnCalc.innerHTML = `<span class="pulse-mini"></span> Procesando Axiomas...`;
  btnCalc.disabled = true;

  try {
    const res = await fetch(API_SOLVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || data.status === "error") {
      showAxiomError(data.error || "Error de cálculo matemático en el backend.");
      return;
    }

    state.lastResult = data;
    renderResults(data);

  } catch (err) {
    showAxiomError(
      `No se pudo comunicar con el servidor backend en ${API_SOLVE_URL}. ` +
      `Asegúrate de que 'backend/app.py' esté ejecutándose (python backend/app.py).`
    );
  } finally {
    btnCalc.innerHTML = originalText;
    btnCalc.disabled = false;
  }
}

// Construir JSON payload para la API
function buildPayload() {
  const isCounts = state.inputMode === "counts";
  const sampleSpace = parseFloat(document.getElementById("input-sample-space").value) || 100;

  const nameA = document.getElementById("name-a").value.trim() || "Evento A";
  const nameB = document.getElementById("name-b").value.trim() || "Evento B";
  const nameC = document.getElementById("name-c").value.trim() || "Evento C";

  const payload = {
    num_events: state.numEvents,
    input_mode: state.inputMode,
    sample_space: sampleSpace,
    names: { "A": nameA, "B": nameB, "C": nameC }
  };

  const parseVal = (id) => {
    const v = document.getElementById(id).value;
    return v !== "" ? parseFloat(v) : null;
  };

  if (state.numEvents === 2) {
    const valA = parseVal("val-a");
    const valB = parseVal("val-b");
    const valAB = parseVal("val-ab");
    const valUnion = parseVal("val-union-ab");

    if (valA === null || valB === null) {
      showAxiomError("Debes ingresar los valores para el Evento A y el Evento B.");
      return null;
    }

    if (isCounts) {
      payload.count_a = valA;
      payload.count_b = valB;
      if (state.isDisjoint) payload.count_ab = 0;
      else if (valAB !== null) payload.count_ab = valAB;
      if (valUnion !== null) payload.count_union = valUnion;
    } else {
      payload.p_a = valA;
      payload.p_b = valB;
      if (state.isDisjoint) payload.p_ab = 0.0;
      else if (valAB !== null) payload.p_ab = valAB;
      if (valUnion !== null) payload.p_union = valUnion;
    }

    payload.is_disjoint = state.isDisjoint;

  } else {
    // 3 Eventos
    const valA = parseVal("val-a");
    const valB = parseVal("val-b");
    const valC = parseVal("val-c");
    const valAB = parseVal("val-3-ab");
    const valAC = parseVal("val-3-ac");
    const valBC = parseVal("val-3-bc");
    const valABC = parseVal("val-3-abc");
    const valUnion = parseVal("val-3-union");

    if (valA === null || valB === null || valC === null) {
      showAxiomError("Debes ingresar los valores para los tres eventos (A, B y C).");
      return null;
    }

    if (valAB === null || valAC === null || valBC === null) {
      showAxiomError("Debes ingresar las intersecciones por pares (A∩B, A∩C, B∩C).");
      return null;
    }

    if (isCounts) {
      payload.count_a = valA;
      payload.count_b = valB;
      payload.count_c = valC;
      payload.count_ab = valAB;
      payload.count_ac = valAC;
      payload.count_bc = valBC;
      if (valABC !== null) payload.count_abc = valABC;
      if (valUnion !== null) payload.count_union = valUnion;
    } else {
      payload.p_a = valA;
      payload.p_b = valB;
      payload.p_c = valC;
      payload.p_ab = valAB;
      payload.p_ac = valAC;
      payload.p_bc = valBC;
      if (valABC !== null) payload.p_abc = valABC;
      if (valUnion !== null) payload.p_union = valUnion;
    }
  }

  return payload;
}

// ==========================================================================
// Renderizado de Resultados en la UI
// ==========================================================================
function renderResults(data) {
  // 1. Tipología
  renderTypology(data);

  // 2. Diagrama de Venn
  renderVennDiagram(data);

  // 3. Resumen de Regiones Mutuamente Excluyentes
  renderRegionsSummary(data);

  // 4. Paso a Paso Matemático con KaTeX
  renderSteps(data.steps);

  // 5. Tabla de Métricas
  renderMetricsTable(data);
}

// Renderizar Tipología
function renderTypology(data) {
  const badge = document.getElementById("typology-badge");
  const countSpan = document.getElementById("typology-events-count");
  const desc = document.getElementById("typology-description");

  badge.textContent = data.typology;
  countSpan.textContent = `${data.num_events} Eventos`;
  desc.textContent = data.typology_description;
}

// Renderizar Diagrama de Venn con D3 y Venn.js
function renderVennDiagram(data) {
  const container = document.getElementById("venn-diagram");
  container.innerHTML = "";

  if (typeof venn === "undefined" || typeof d3 === "undefined") {
    container.innerHTML = `<div style="color: #f43f5e; padding: 2rem;">Error: Librerías D3.js o Venn.js no disponibles.</div>`;
    return;
  }

  const width = Math.min(container.clientWidth || 550, 600);
  const height = 400;

  const chart = venn.VennDiagram()
    .width(width)
    .height(height);

  const div = d3.select(container);
  div.datum(data.venn_data).call(chart);

  // Asignar colores personalizados a los conjuntos principales
  const colors = [
    "#6366f1", // A: Indigo
    "#ec4899", // B: Pink
    "#06b6d4", // C: Cyan
    "#a855f7", // AB: Púrpura
    "#3b82f6", // AC: Azul
    "#14b8a6", // BC: Teal
    "#f59e0b"  // ABC: Ámbar
  ];

  div.selectAll(".venn-circle path")
    .style("fill", (d, i) => colors[i % colors.length])
    .style("fill-opacity", 0.45)
    .style("stroke", (d, i) => colors[i % colors.length])
    .style("stroke-width", "2px");

  div.selectAll(".venn-intersection path")
    .style("fill-opacity", 0.65)
    .style("stroke", "rgba(255, 255, 255, 0.4)")
    .style("stroke-width", "1.5px");

  // Tooltip interactivo
  const tooltip = document.getElementById("venn-tooltip");

  div.selectAll("g")
    .on("mouseover", function(d) {
      venn.sortAreas(div, d);
      d3.select(this).select("path")
        .style("fill-opacity", 0.8)
        .style("stroke-width", "3.5px")
        .style("stroke", "#ffffff");

      const setsName = d.sets.join(" ∩ ");
      const sizeVal = d.size;
      const pctVal = data.input_mode === "counts" 
        ? `${((sizeVal / data.sample_space_size) * 100).toFixed(2)}%`
        : `${sizeVal.toFixed(2)}%`;

      tooltip.innerHTML = `
        <div class="venn-tooltip-title">${setsName}</div>
        <div class="venn-tooltip-detail">
          <span>Tamaño Acumulado:</span>
          <span>${sizeVal.toFixed(2)}</span>
        </div>
        <div class="venn-tooltip-detail">
          <span>Proporción:</span>
          <span>${pctVal}</span>
        </div>
      `;
      tooltip.classList.add("visible");
    })
    .on("mousemove", function() {
      const containerRect = container.getBoundingClientRect();
      const left = d3.event.clientX - containerRect.left;
      const top = d3.event.clientY - containerRect.top;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    })
    .on("mouseout", function() {
      tooltip.classList.remove("visible");
      d3.select(this).select("path")
        .style("fill-opacity", d => d.sets.length > 1 ? 0.65 : 0.45)
        .style("stroke-width", d => d.sets.length > 1 ? "1.5px" : "2px")
        .style("stroke", d => d.sets.length > 1 ? "rgba(255, 255, 255, 0.4)" : null);
    });
}

// Renderizar Resumen de Regiones Mutuamente Excluyentes
function renderRegionsSummary(data) {
  const grid = document.getElementById("regions-grid");
  grid.innerHTML = "";

  const regionDots = {
    only_a: "#6366f1",
    only_b: "#ec4899",
    only_c: "#06b6d4",
    only_ab: "#a855f7",
    only_ac: "#3b82f6",
    only_bc: "#14b8a6",
    intersection_ab: "#a855f7",
    intersection_abc: "#f59e0b",
    neither: "#64748b"
  };

  Object.entries(data.regions).forEach(([key, reg]) => {
    const card = document.createElement("div");
    card.className = "region-card";

    const dotColor = regionDots[key] || "#6366f1";

    card.innerHTML = `
      <div class="region-badge-row">
        <span class="region-pill">
          <span class="region-dot" style="background: ${dotColor}; box-shadow: 0 0 6px ${dotColor};"></span>
          ${reg.name}
        </span>
        <span class="hint-tag">${reg.notation}</span>
      </div>
      <div class="region-prob-val">${reg.prob.toFixed(4)}</div>
      <div class="region-meta">
        <span>${reg.percentage}</span>
        <span>${reg.count !== undefined ? `N ≈ ${reg.count}` : ''}</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Renderizar Paso a Paso con KaTeX
function renderSteps(steps) {
  const container = document.getElementById("steps-container");
  const countBadge = document.getElementById("steps-count-badge");
  container.innerHTML = "";

  countBadge.textContent = `${steps.length} Pasos`;

  steps.forEach((step, idx) => {
    const card = document.createElement("div");
    card.className = "step-card";

    const formulaKatex = renderMath(step.formula);
    const calcKatex = renderMath(step.calculation);

    card.innerHTML = `
      <div class="step-card-header">
        <h4 class="step-title">${step.title}</h4>
      </div>
      <p class="step-explanation">${step.explanation}</p>
      <div class="step-formula-box">
        <div class="formula-math">${formulaKatex}</div>
        <div class="formula-math" style="margin-top: 0.5rem; color: #a5f3fc;">${calcKatex}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Renderizar KaTeX con fallback
function renderMath(latexString) {
  if (!latexString) return "";
  if (typeof katex !== "undefined") {
    try {
      return katex.renderToString(latexString, {
        displayMode: true,
        throwOnError: false
      });
    } catch (e) {
      console.warn("Error renderizando KaTeX:", e);
    }
  }
  return `<span style="font-family: monospace;">${latexString}</span>`;
}

// Renderizar Tabla de Métricas
function renderMetricsTable(data) {
  const tbody = document.getElementById("metrics-table-body");
  tbody.innerHTML = "";

  const descriptions = {
    "P(A)": "Probabilidad simple del primer evento",
    "P(B)": "Probabilidad simple del segundo evento",
    "P(C)": "Probabilidad simple del tercer evento",
    "P(A ∩ B)": "Probabilidad conjunta simultánea (Ambos ocurren)",
    "P(A ∩ C)": "Probabilidad conjunta simultánea entre A y C",
    "P(B ∩ C)": "Probabilidad conjunta simultánea entre B y C",
    "P(A ∩ B ∩ C)": "Probabilidad simultánea de los 3 eventos",
    "P(A ∪ B)": "Probabilidad de que ocurra al menos A o B",
    "P(A ∪ B ∪ C)": "Probabilidad de que ocurra al menos uno de los tres",
    "P(A|B)": "Probabilidad de A dado que ocurrió B (Teorema de Bayes/Condicional)",
    "P(B|A)": "Probabilidad de B dado que ocurrió A (Teorema de Bayes/Condicional)",
    "P(A^c)": "Probabilidad complementaria de no ocurrencia de A",
    "P(B^c)": "Probabilidad complementaria de no ocurrencia de B"
  };

  Object.entries(data.probabilities).forEach(([notation, val]) => {
    const row = document.createElement("tr");

    const pct = `${(val * 100).toFixed(2)}%`;
    const count = (val * data.sample_space_size).toFixed(1);
    const desc = descriptions[notation] || "Métrica inferencial calculada";

    row.innerHTML = `
      <td>${notation}</td>
      <td><strong>${val.toFixed(4)}</strong></td>
      <td>${pct}</td>
      <td>${count}</td>
      <td style="color: var(--text-muted);">${desc}</td>
    `;

    tbody.appendChild(row);
  });
}

// Mostrar banner de violación de axiomas
function showAxiomError(message) {
  const banner = document.getElementById("axiom-error-banner");
  const msgP = document.getElementById("axiom-error-message");
  msgP.textContent = message;
  banner.classList.remove("hidden");
  banner.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Ocultar banner de error
function hideAxiomError() {
  document.getElementById("axiom-error-banner").classList.add("hidden");
}

// Descargar SVG del Diagrama de Venn
function downloadVennSVG() {
  const svgEl = document.querySelector("#venn-diagram svg");
  if (!svgEl) {
    alert("Primero genera el diagrama de Venn.");
    return;
  }

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);

  // Agregar namespace si falta
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = `diagrama_venn_${state.numEvents}_eventos.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
