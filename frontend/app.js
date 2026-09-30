/**
 * VennProb v2.0 — app.js
 * Módulos: Solucionador, Venn Directo, Ejemplos, Calculadora Científica
 */

// ── API Config ──────────────────────────────────────────────────────────────
const API_BASE      = window.location.origin.includes("5000") ? window.location.origin : "http://127.0.0.1:5000";
const API_SOLVE_URL = `${API_BASE}/api/solve`;
const API_HEALTH    = `${API_BASE}/api/health`;

// ── App State ────────────────────────────────────────────────────────────────
const state = {
  numEvents:  2,
  inputMode:  "probabilities",
  isDisjoint: false,
  lastResult: null,
  directEvents: 2
};

// ── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = {
  "preset-2-intersecting": {
    numEvents:2, inputMode:"probabilities",
    nameA:"Matemáticas", nameB:"Inglés",
    valA:0.60, valB:0.50, isDisjoint:false, valAB:0.30, valUnion:""
  },
  "preset-2-disjoint": {
    numEvents:2, inputMode:"probabilities",
    nameA:"Número Par", nameB:"Número Impar",
    valA:0.50, valB:0.50, isDisjoint:true, valAB:0.0, valUnion:""
  },
  "preset-2-union": {
    numEvents:2, inputMode:"probabilities",
    nameA:"Grupo A", nameB:"Grupo B",
    valA:0.55, valB:0.45, isDisjoint:false, valAB:"", valUnion:0.80
  },
  "preset-3-classic": {
    numEvents:3, inputMode:"probabilities",
    nameA:"Netflix", nameB:"Spotify", nameC:"Prime Video",
    valA:0.50, valB:0.45, valC:0.35,
    val3AB:0.20, val3AC:0.15, val3BC:0.12, val3ABC:0.06, val3Union:""
  },
  "preset-3-deduce": {
    numEvents:3, inputMode:"probabilities",
    nameA:"Español", nameB:"Inglés", nameC:"Francés",
    valA:0.50, valB:0.40, valC:0.40,
    val3AB:0.20, val3AC:0.15, val3BC:0.15, val3ABC:"", val3Union:0.80
  },
  "preset-3-counts": {
    numEvents:3, inputMode:"counts", sampleSpace:200,
    nameA:"Fútbol", nameB:"Baloncesto", nameC:"Natación",
    valA:100, valB:80, valC:70,
    val3AB:40, val3AC:30, val3BC:25, val3ABC:15, val3Union:""
  }
};

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initTabNav();
  initHealthCheck();
  initSolverListeners();
  initDirectVennListeners();
  initExamplesListeners();
  initCalculator();
  // Start with clean slate – show mode 2 by default
  showNumEventsUI(2);
});

// ── Health Check ──────────────────────────────────────────────────────────────
async function initHealthCheck() {
  const pill = document.getElementById("api-status-indicator");
  const txt  = document.getElementById("api-status-text");
  try {
    const r = await fetch(API_HEALTH);
    if (r.ok) { pill.className="api-status-pill connected"; txt.textContent="Backend conectado"; }
    else throw new Error();
  } catch { pill.className="api-status-pill error"; txt.textContent="Backend no disponible"; }
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function initTabNav() {
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panelId = "panel-" + btn.dataset.tab;
      document.getElementById(panelId).classList.add("active");
    });
  });
}

// ============================================================
// TAB 1 — SOLVER
// ============================================================
function initSolverListeners() {
  // Event mode buttons
  document.querySelectorAll("[data-events]").forEach(btn => {
    btn.addEventListener("click", () => {
      showNumEventsUI(parseInt(btn.dataset.events));
    });
  });

  // Input mode radios
  document.querySelectorAll('input[name="input_mode"]').forEach(r => {
    r.addEventListener("change", e => {
      state.inputMode = e.target.value;
      updatePrefixes();
      updateCountMode();
    });
  });

  // Disjoint checkbox
  document.getElementById("check-disjoint").addEventListener("change", e => {
    state.isDisjoint = e.target.checked;
    updateDisjointUI();
  });

  // Form submit
  document.getElementById("prob-form").addEventListener("submit", e => {
    e.preventDefault();
    solveProblem();
  });

  // Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    document.getElementById("prob-form").reset();
    state.isDisjoint = false;
    document.getElementById("check-disjoint").checked = false;
    updateDisjointUI();
  });

  // Download SVG
  document.getElementById("btn-download-svg").addEventListener("click", () => downloadSVG("venn-diagram", "venn_solucionador"));

  // Close axiom error
  document.getElementById("axiom-close-btn").addEventListener("click", hideAxiomError);
}

function showNumEventsUI(num) {
  state.numEvents = num;
  // Update buttons
  document.querySelectorAll("[data-events]").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.events) === num);
  });

  // Toggle blocks
  const b1 = document.getElementById("block-1-event");
  const b2 = document.getElementById("block-2-events");
  const r2 = document.getElementById("section-rel-2");
  const b3 = document.getElementById("block-3-events");
  const r3 = document.getElementById("section-rel-3");
  const ss = document.getElementById("sample-space-container");

  // hide all
  [b1, b2, r2, b3, r3].forEach(el => el.classList.add("hidden"));

  if (num === 1) { b1.classList.remove("hidden"); }
  if (num === 2) { b2.classList.remove("hidden"); r2.classList.remove("hidden"); }
  if (num === 3) { b3.classList.remove("hidden"); r3.classList.remove("hidden"); }

  updateCountMode();
  updatePrefixes();
}

function updateCountMode() {
  const isCounts = document.getElementById("mode-counts").checked;
  state.inputMode = isCounts ? "counts" : "probabilities";
  document.getElementById("sample-space-container").classList.toggle("hidden", !isCounts);

  // Adjust min/max/step of relevant inputs
  const probInputs = [
    "val-a1","val-a","val-b","val-3a","val-3b","val-3c",
    "val-ab","val-union-ab","val-3-ab","val-3-ac","val-3-bc","val-3-abc","val-3-union"
  ];
  probInputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (isCounts) {
      el.removeAttribute("max");
      el.step = "1";
    } else {
      el.max  = "1";
      el.step = "any";
    }
  });
}

function updatePrefixes() {
  const isCounts = state.inputMode === "counts";
  const pfx = (letter) => isCounts ? `|${letter}| =` : `P(${letter}) =`;
  const setPrefix = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };
  setPrefix("prefix-a1", pfx("A"));
  setPrefix("prefix-a",  pfx("A"));
  setPrefix("prefix-b",  pfx("B"));
  setPrefix("prefix-3a", pfx("A"));
  setPrefix("prefix-3b", pfx("B"));
  setPrefix("prefix-3c", pfx("C"));
  // pair prefixes
  const pairPfx = isCounts ? "AB" : "A∩B";
  ["prefix-3ab","prefix-3ac","prefix-3bc","prefix-3abc"].forEach((id, i) => {
    const labels = isCounts ? ["AB","AC","BC","ABC"] : ["A∩B","A∩C","B∩C","A∩B∩C"];
    const el = document.getElementById(id); if(el) el.textContent = labels[i];
  });
}

function updateDisjointUI() {
  const hint  = document.getElementById("disjoint-hint");
  const inter = document.getElementById("val-ab");
  if (state.isDisjoint) {
    hint.classList.remove("hidden");
    inter.value    = "0";
    inter.disabled = true;
  } else {
    hint.classList.add("hidden");
    inter.disabled = false;
  }
}

// ── Solve Problem ─────────────────────────────────────────────────────────────
async function solveProblem() {
  hideAxiomError();
  const payload = buildPayload();
  if (!payload) return;

  const btn = document.getElementById("btn-calculate");
  const orig = btn.innerHTML;
  btn.innerHTML = `<span class="pulse-mini"></span> Calculando...`;
  btn.disabled = true;

  try {
    const res  = await fetch(API_SOLVE_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || data.status === "error") {
      showAxiomError(data.error || "Error en el cálculo.");
      return;
    }
    state.lastResult = data;
    renderResults(data);
  } catch {
    showAxiomError(`No se pudo conectar con el backend en ${API_SOLVE_URL}. Ejecuta: python backend/app.py`);
  } finally {
    btn.innerHTML = orig;
    btn.disabled  = false;
  }
}

function buildPayload() {
  const isCounts   = state.inputMode === "counts";
  const sampleSpace = parseFloat(document.getElementById("input-sample-space").value) || 100;
  const parseVal    = id => { const v = (document.getElementById(id)||{}).value; return v !== undefined && v !== "" ? parseFloat(v) : null; };

  if (state.numEvents === 1) {
    const nameA = document.getElementById("name-a1").value.trim() || "Evento A";
    const valA  = parseVal("val-a1");
    if (valA === null) { showAxiomError("Ingresa el valor del Evento A."); return null; }
    const payload = {
      num_events: 1,
      input_mode: state.inputMode,
      sample_space: sampleSpace,
      names: { A: nameA }
    };
    if (isCounts) payload.count_a = valA; else payload.p_a = valA;
    return payload;
  }

  if (state.numEvents === 2) {
    const nameA = document.getElementById("name-a").value.trim() || "Evento A";
    const nameB = document.getElementById("name-b").value.trim() || "Evento B";
    const valA  = parseVal("val-a");
    const valB  = parseVal("val-b");
    if (valA === null || valB === null) { showAxiomError("Ingresa P(A) y P(B)."); return null; }

    const valAB    = parseVal("val-ab");
    const valUnion = parseVal("val-union-ab");

    if (!state.isDisjoint && valAB === null && valUnion === null) {
      showAxiomError("Ingresa la Intersección P(A∩B) o la Unión P(A∪B), o marca los eventos como Disjuntos."); return null;
    }

    const p = { num_events:2, input_mode:state.inputMode, sample_space:sampleSpace, names:{A:nameA, B:nameB}, is_disjoint:state.isDisjoint };
    if (isCounts) {
      p.count_a = valA; p.count_b = valB;
      if (state.isDisjoint) p.count_ab = 0;
      else if (valAB    !== null) p.count_ab    = valAB;
      if (valUnion !== null) p.count_union = valUnion;
    } else {
      p.p_a = valA; p.p_b = valB;
      if (state.isDisjoint) p.p_ab = 0;
      else if (valAB    !== null) p.p_ab    = valAB;
      if (valUnion !== null) p.p_union = valUnion;
    }
    return p;
  }

  if (state.numEvents === 3) {
    const nameA = document.getElementById("name-3a").value.trim() || "Evento A";
    const nameB = document.getElementById("name-3b").value.trim() || "Evento B";
    const nameC = document.getElementById("name-3c").value.trim() || "Evento C";
    const vals  = ["val-3a","val-3b","val-3c","val-3-ab","val-3-ac","val-3-bc"].map(parseVal);
    if (vals.some(v => v === null)) {
      showAxiomError("Completa los valores de los 3 eventos y las 3 intersecciones dobles."); return null;
    }
    const [vA,vB,vC,vAB,vAC,vBC] = vals;
    const vABC  = parseVal("val-3-abc");
    const vUnion = parseVal("val-3-union");
    if (vABC === null && vUnion === null) {
      showAxiomError("Proporciona P(A∩B∩C) o P(A∪B∪C) para deducir la otra."); return null;
    }
    const p = { num_events:3, input_mode:state.inputMode, sample_space:sampleSpace, names:{A:nameA, B:nameB, C:nameC} };
    if (isCounts) {
      Object.assign(p, {count_a:vA, count_b:vB, count_c:vC, count_ab:vAB, count_ac:vAC, count_bc:vBC});
      if (vABC  !== null) p.count_abc  = vABC;
      if (vUnion!== null) p.count_union = vUnion;
    } else {
      Object.assign(p, {p_a:vA, p_b:vB, p_c:vC, p_ab:vAB, p_ac:vAC, p_bc:vBC});
      if (vABC  !== null) p.p_abc  = vABC;
      if (vUnion!== null) p.p_union = vUnion;
    }
    return p;
  }
  return null;
}

// ── Render Results ────────────────────────────────────────────────────────────
function renderResults(data) {
  // Handle 1-event specially (no full Venn)
  if (data.num_events === 1) {
    renderOneEvent(data);
    return;
  }
  // typology
  document.getElementById("typology-badge").textContent       = data.typology;
  document.getElementById("typology-events-count").textContent = `${data.num_events} Eventos`;
  document.getElementById("typology-description").textContent  = data.typology_description;

  renderVennDiagram("venn-diagram", "venn-tooltip", data.venn_data, data);
  renderRegionsSummary("regions-grid", data.regions, data);
  renderSteps(data.steps);
  renderMetricsTable(data);
}

function renderOneEvent(data) {
  document.getElementById("typology-badge").textContent       = data.typology;
  document.getElementById("typology-events-count").textContent = "1 Evento";
  document.getElementById("typology-description").textContent  = data.typology_description;
  renderSteps(data.steps);
  renderMetricsTable(data);
  document.getElementById("venn-diagram").innerHTML = `
    <div style="text-align:center;padding:2.5rem;color:var(--txt-m)">
      <div style="font-size:3rem;margin-bottom:.5rem">⭕</div>
      <div style="font-family:var(--mono);font-size:1.1rem;color:#c7d2fe">P(A) = ${data.probabilities["P(A)"].toFixed(4)}</div>
      <div style="font-size:.85rem;margin-top:.4rem">P(Aᶜ) = ${data.probabilities["P(Aᶜ)"].toFixed(4)}</div>
    </div>`;
  document.getElementById("regions-grid").innerHTML = "";
}

// ── Venn Diagram (reusable) ───────────────────────────────────────────────────
const COLORS = ["#6366f1","#ec4899","#06b6d4","#a855f7","#3b82f6","#14b8a6","#f59e0b"];

function renderVennDiagram(containerId, tooltipId, vennData, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (typeof venn === "undefined" || typeof d3 === "undefined") {
    container.innerHTML = `<div style="color:var(--rose);padding:2rem">Error: D3.js o Venn.js no disponibles.</div>`;
    return;
  }

  const w = Math.min(container.clientWidth || 520, 580);
  const h = 400;
  const chart = venn.VennDiagram().width(w).height(h);
  const div   = d3.select(container);
  div.datum(vennData).call(chart);

  div.selectAll(".venn-circle path")
    .style("fill",         (d,i) => COLORS[i % COLORS.length])
    .style("fill-opacity", 0.42)
    .style("stroke",       (d,i) => COLORS[i % COLORS.length])
    .style("stroke-width", "2px");

  div.selectAll(".venn-intersection path")
    .style("fill-opacity", 0.62)
    .style("stroke", "rgba(255,255,255,.35)")
    .style("stroke-width", "1.5px");

  const tooltip = document.getElementById(tooltipId);
  div.selectAll("g")
    .on("mouseover", function(d) {
      venn.sortAreas(div, d);
      d3.select(this).select("path")
        .style("fill-opacity", 0.82)
        .style("stroke-width","3.5px")
        .style("stroke","#fff");
      const name = d.sets.join(" ∩ ");
      const sz   = d.size;
      const sp   = data ? data.sample_space_size : sz;
      const pct  = data && data.input_mode === "counts"
        ? `${((sz/sp)*100).toFixed(2)}%`
        : `${sz.toFixed(2)}%`;
      tooltip.innerHTML = `
        <div class="venn-tooltip-title">${name}</div>
        <div class="venn-tooltip-detail"><span>Tamaño:</span><span>${sz.toFixed(2)}</span></div>
        <div class="venn-tooltip-detail"><span>Porcentaje:</span><span>${pct}</span></div>`;
      tooltip.classList.add("visible");
    })
    .on("mousemove", function() {
      const r = container.getBoundingClientRect();
      tooltip.style.left = `${d3.event.clientX - r.left}px`;
      tooltip.style.top  = `${d3.event.clientY - r.top}px`;
    })
    .on("mouseout", function() {
      tooltip.classList.remove("visible");
      d3.select(this).select("path")
        .style("fill-opacity", d => d.sets.length > 1 ? 0.62 : 0.42)
        .style("stroke-width", d => d.sets.length > 1 ? "1.5px" : "2px")
        .style("stroke", d => d.sets.length > 1 ? "rgba(255,255,255,.35)" : null);
    });
}

// ── Regions Summary ───────────────────────────────────────────────────────────
const REGION_DOTS = {
  only_a:"#6366f1", only_b:"#ec4899", only_c:"#06b6d4",
  only_ab:"#a855f7", only_ac:"#3b82f6", only_bc:"#14b8a6",
  intersection_ab:"#a855f7", intersection_abc:"#f59e0b", neither:"#64748b"
};

function renderRegionsSummary(gridId, regions, data) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  Object.entries(regions).forEach(([key, reg]) => {
    const dot  = REGION_DOTS[key] || "#6366f1";
    const card = document.createElement("div");
    card.className = "region-card";
    card.innerHTML = `
      <div class="region-badge-row">
        <span class="region-pill"><span class="region-dot" style="background:${dot};box-shadow:0 0 6px ${dot}"></span>${reg.name}</span>
        <span class="hint-tag">${reg.notation}</span>
      </div>
      <div class="region-prob-val">${reg.prob.toFixed(4)}</div>
      <div class="region-meta"><span>${reg.percentage}</span><span>${reg.count !== undefined ? `N≈${reg.count}` : ''}</span></div>`;
    grid.appendChild(card);
  });
}

// ── Steps ─────────────────────────────────────────────────────────────────────
function renderSteps(steps) {
  const container = document.getElementById("steps-container");
  document.getElementById("steps-count-badge").textContent = `${steps.length} pasos`;
  container.innerHTML = "";
  steps.forEach(s => {
    const card = document.createElement("div");
    card.className = "step-card";
    card.innerHTML = `
      <h4 class="step-title">${s.title}</h4>
      <p class="step-explanation">${s.explanation}</p>
      <div class="step-formula-box">
        <div class="formula-math">${renderMath(s.formula)}</div>
        <div class="formula-math" style="margin-top:.45rem;color:#a5f3fc">${renderMath(s.calculation)}</div>
      </div>`;
    container.appendChild(card);
  });
}

function renderMath(latex) {
  if (!latex) return "";
  if (typeof katex !== "undefined") {
    try { return katex.renderToString(latex, { displayMode:true, throwOnError:false }); } catch {}
  }
  return `<span style="font-family:monospace">${latex}</span>`;
}

// ── Metrics Table ─────────────────────────────────────────────────────────────
const METRIC_DESC = {
  "P(A)":"Probabilidad simple del Evento A",
  "P(B)":"Probabilidad simple del Evento B",
  "P(C)":"Probabilidad simple del Evento C",
  "P(Aᶜ)":"Complemento de A — probabilidad de que no ocurra A",
  "P(Bᶜ)":"Complemento de B",
  "Odds a favor":"Relación P(A)/P(Aᶜ): por cada caso desfavorable",
  "P(A∩B)":"Probabilidad de que ocurran A y B simultáneamente",
  "P(A∩C)":"Probabilidad de que ocurran A y C simultáneamente",
  "P(B∩C)":"Probabilidad de que ocurran B y C simultáneamente",
  "P(A∩B∩C)":"Probabilidad de los 3 eventos al mismo tiempo",
  "P(A∪B)":"Al menos uno de A o B ocurre",
  "P(A∪B∪C)":"Al menos uno de los tres ocurre",
};

function renderMetricsTable(data) {
  const tbody = document.getElementById("metrics-table-body");
  tbody.innerHTML = "";
  Object.entries(data.probabilities).forEach(([k, v]) => {
    if (typeof v !== "number") return;
    const row = document.createElement("tr");
    const pct = `${(v * 100).toFixed(2)}%`;
    const cnt = (v * (data.sample_space_size||100)).toFixed(1);
    const desc= METRIC_DESC[k] || "Métrica inferencial calculada";
    row.innerHTML = `<td>${k}</td><td><strong>${v.toFixed(4)}</strong></td><td>${pct}</td><td>${cnt}</td><td style="color:var(--txt-m)">${desc}</td>`;
    tbody.appendChild(row);
  });
}

// ── Error Handling ────────────────────────────────────────────────────────────
function showAxiomError(msg) {
  const b = document.getElementById("axiom-error-banner");
  document.getElementById("axiom-error-message").textContent = msg;
  b.classList.remove("hidden");
  b.scrollIntoView({ behavior:"smooth", block:"nearest" });
}
function hideAxiomError() {
  document.getElementById("axiom-error-banner").classList.add("hidden");
}

// ── SVG Download ──────────────────────────────────────────────────────────────
function downloadSVG(containerId, filename) {
  const svg = document.querySelector(`#${containerId} svg`);
  if (!svg) { alert("Primero genera el diagrama."); return; }
  let src = new XMLSerializer().serializeToString(svg);
  if (!src.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/))
    src = src.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  const blob = new Blob([src], { type:"image/svg+xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = `${filename}.svg`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ============================================================
// TAB 2 — VENN DIRECTO (tamaños de región)
// ============================================================
function initDirectVennListeners() {
  document.querySelectorAll("[data-direct-events]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = parseInt(btn.dataset.directEvents);
      state.directEvents = n;
      document.querySelectorAll("[data-direct-events]").forEach(b => b.classList.toggle("active", parseInt(b.dataset.directEvents) === n));
      document.getElementById("vd-regions-2").classList.toggle("hidden", n !== 2);
      document.getElementById("vd-regions-3").classList.toggle("hidden", n !== 3);
      document.getElementById("vd-box-c").classList.toggle("hidden", n !== 3);
    });
  });

  document.getElementById("venn-direct-form").addEventListener("submit", e => {
    e.preventDefault();
    drawDirectVenn();
  });

  document.getElementById("btn-vd-download").addEventListener("click", () => downloadSVG("venn-direct-diagram", "diagrama_venn_directo"));
}

function drawDirectVenn() {
  const n    = state.directEvents;
  const nameA = document.getElementById("vd-name-a").value.trim() || "A";
  const nameB = document.getElementById("vd-name-b").value.trim() || "B";
  const nameC = document.getElementById("vd-name-c").value.trim() || "C";
  const g = id => Math.max(parseFloat(document.getElementById(id).value) || 0, 0);

  let vennData, regionCards, totalN;

  if (n === 2) {
    const onlyA = g("vd-only-a"), onlyB = g("vd-only-b"), ab = g("vd-inter-ab"), neither = g("vd-neither-2");
    totalN = onlyA + onlyB + ab + neither;
    const sizeA  = onlyA + ab;
    const sizeB  = onlyB + ab;
    vennData = [
      { sets:[nameA], size: Math.max(sizeA, 0.001) },
      { sets:[nameB], size: Math.max(sizeB, 0.001) },
      { sets:[nameA, nameB], size: ab }
    ];
    regionCards = [
      { name:`Solo ${nameA}`, notation:`${nameA}\\${nameB}`, val:onlyA, color:"#6366f1" },
      { name:`Solo ${nameB}`, notation:`${nameB}\\${nameA}`, val:onlyB, color:"#ec4899" },
      { name:`${nameA} ∩ ${nameB}`, notation:`${nameA}∩${nameB}`, val:ab, color:"#a855f7" },
      { name:"Ninguno (Exterior)", notation:"∅", val:neither, color:"#64748b" }
    ];
  } else {
    const oA=g("vd-3-only-a"), oB=g("vd-3-only-b"), oC=g("vd-3-only-c");
    const oAB=g("vd-3-only-ab"), oAC=g("vd-3-only-ac"), oBC=g("vd-3-only-bc");
    const abc=g("vd-3-abc"), neither=g("vd-3-neither");
    totalN = oA+oB+oC+oAB+oAC+oBC+abc+neither;
    const sA=oA+oAB+oAC+abc, sB=oB+oAB+oBC+abc, sC=oC+oAC+oBC+abc;
    const sAB=oAB+abc, sAC=oAC+abc, sBC=oBC+abc;
    vennData = [
      {sets:[nameA],size:Math.max(sA,0.001)},
      {sets:[nameB],size:Math.max(sB,0.001)},
      {sets:[nameC],size:Math.max(sC,0.001)},
      {sets:[nameA,nameB],size:sAB},
      {sets:[nameA,nameC],size:sAC},
      {sets:[nameB,nameC],size:sBC},
      {sets:[nameA,nameB,nameC],size:abc}
    ];
    regionCards = [
      {name:`Solo ${nameA}`, notation:`${nameA}\\(${nameB}∪${nameC})`, val:oA, color:"#6366f1"},
      {name:`Solo ${nameB}`, notation:`${nameB}\\(${nameA}∪${nameC})`, val:oB, color:"#ec4899"},
      {name:`Solo ${nameC}`, notation:`${nameC}\\(${nameA}∪${nameB})`, val:oC, color:"#06b6d4"},
      {name:`Solo ${nameA}∩${nameB}`, notation:`(${nameA}∩${nameB})\\${nameC}`, val:oAB, color:"#a855f7"},
      {name:`Solo ${nameA}∩${nameC}`, notation:`(${nameA}∩${nameC})\\${nameB}`, val:oAC, color:"#3b82f6"},
      {name:`Solo ${nameB}∩${nameC}`, notation:`(${nameB}∩${nameC})\\${nameA}`, val:oBC, color:"#14b8a6"},
      {name:`${nameA}∩${nameB}∩${nameC}`, notation:"Intersección triple", val:abc, color:"#f59e0b"},
      {name:"Ninguno (Exterior)", notation:"∅", val:neither, color:"#64748b"}
    ];
  }

  // Draw the Venn
  const container = document.getElementById("venn-direct-diagram");
  container.innerHTML = "";
  if (typeof venn === "undefined" || typeof d3 === "undefined") {
    container.innerHTML = `<div style="color:var(--rose);padding:2rem">Error: librerías no disponibles.</div>`; return;
  }
  const w = Math.min(container.clientWidth||520, 580);
  const chart = venn.VennDiagram().width(w).height(400);
  const div   = d3.select(container);
  div.datum(vennData).call(chart);
  div.selectAll(".venn-circle path").style("fill",(d,i)=>COLORS[i%COLORS.length]).style("fill-opacity",0.42).style("stroke",(d,i)=>COLORS[i%COLORS.length]).style("stroke-width","2px");
  div.selectAll(".venn-intersection path").style("fill-opacity",0.62).style("stroke","rgba(255,255,255,.35)").style("stroke-width","1.5px");

  const tooltip = document.getElementById("venn-direct-tooltip");
  div.selectAll("g")
    .on("mouseover", function(d) {
      venn.sortAreas(div,d);
      d3.select(this).select("path").style("fill-opacity",0.82).style("stroke-width","3.5px").style("stroke","#fff");
      tooltip.innerHTML = `<div class="venn-tooltip-title">${d.sets.join("∩")}</div><div class="venn-tooltip-detail"><span>Tamaño:</span><span>${d.size.toFixed(0)}</span></div>`;
      tooltip.classList.add("visible");
    })
    .on("mousemove", function() { const r=container.getBoundingClientRect(); tooltip.style.left=`${d3.event.clientX-r.left}px`; tooltip.style.top=`${d3.event.clientY-r.top}px`; })
    .on("mouseout", function() { tooltip.classList.remove("visible"); d3.select(this).select("path").style("fill-opacity",d=>d.sets.length>1?0.62:0.42).style("stroke-width",d=>d.sets.length>1?"1.5px":"2px").style("stroke",d=>d.sets.length>1?"rgba(255,255,255,.35)":null); });

  // Regions summary
  const grid = document.getElementById("vd-regions-summary");
  grid.innerHTML = "";
  regionCards.forEach(rc => {
    const pct = totalN > 0 ? `${((rc.val/totalN)*100).toFixed(2)}%` : "0.00%";
    const card = document.createElement("div");
    card.className = "region-card";
    card.innerHTML = `
      <div class="region-badge-row">
        <span class="region-pill"><span class="region-dot" style="background:${rc.color};box-shadow:0 0 6px ${rc.color}"></span>${rc.name}</span>
        <span class="hint-tag">${rc.notation}</span>
      </div>
      <div class="region-prob-val">${rc.val}</div>
      <div class="region-meta"><span>${pct} de N=${totalN}</span></div>`;
    grid.appendChild(card);
  });
}

// ============================================================
// TAB 3 — EXAMPLES
// ============================================================
function initExamplesListeners() {
  document.querySelectorAll(".example-card").forEach(card => {
    const loadPreset = () => {
      const key = card.dataset.preset;
      applyPreset(key);
      // Switch to solver tab
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      document.getElementById("nav-solver").classList.add("active");
      document.getElementById("panel-solver").classList.add("active");
    };
    card.addEventListener("click", loadPreset);
    card.querySelector(".example-load-btn").addEventListener("click", e => { e.stopPropagation(); loadPreset(); });
  });
}

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;

  showNumEventsUI(p.numEvents);
  if (p.inputMode === "probabilities") {
    document.getElementById("mode-prob").checked = true;
  } else {
    document.getElementById("mode-counts").checked = true;
    document.getElementById("input-sample-space").value = p.sampleSpace || 100;
  }
  updateCountMode();

  if (p.numEvents === 1) {
    document.getElementById("name-a1").value = p.nameA || "Evento A";
    document.getElementById("val-a1").value  = p.valA;
  } else if (p.numEvents === 2) {
    document.getElementById("name-a").value = p.nameA || "Evento A";
    document.getElementById("name-b").value = p.nameB || "Evento B";
    document.getElementById("val-a").value  = p.valA;
    document.getElementById("val-b").value  = p.valB;
    state.isDisjoint = !!p.isDisjoint;
    document.getElementById("check-disjoint").checked = state.isDisjoint;
    document.getElementById("val-ab").value       = p.valAB    !== "" ? p.valAB    : "";
    document.getElementById("val-union-ab").value = p.valUnion !== "" ? p.valUnion : "";
    updateDisjointUI();
  } else {
    document.getElementById("name-3a").value = p.nameA || "Evento A";
    document.getElementById("name-3b").value = p.nameB || "Evento B";
    document.getElementById("name-3c").value = p.nameC || "Evento C";
    document.getElementById("val-3a").value  = p.valA;
    document.getElementById("val-3b").value  = p.valB;
    document.getElementById("val-3c").value  = p.valC;
    document.getElementById("val-3-ab").value   = p.val3AB;
    document.getElementById("val-3-ac").value   = p.val3AC;
    document.getElementById("val-3-bc").value   = p.val3BC;
    document.getElementById("val-3-abc").value  = p.val3ABC  !== "" ? p.val3ABC  : "";
    document.getElementById("val-3-union").value = p.val3Union !== "" ? p.val3Union : "";
  }

  updatePrefixes();
  solveProblem();
}

// ============================================================
// TAB 4 — CALCULADORA CIENTÍFICA (Casio FX-350ES Plus style)
// ============================================================
const calc = {
  expression: "",     // what's being typed
  shiftOn: false,
  alphaOn: false,
  angleMode: "DEG",   // DEG | RAD | GRAD
  memory: 0,
  lastAnswer: 0,
  history: []
};

function initCalculator() {
  document.querySelectorAll(".calc-btn").forEach(btn => {
    btn.addEventListener("click", () => handleCalcBtn(btn));
  });
  document.getElementById("btn-clear-history").addEventListener("click", () => {
    calc.history = [];
    document.getElementById("calc-history-list").innerHTML = `<p class="history-empty">Aún no hay cálculos registrados.</p>`;
  });
  // Keyboard support
  document.addEventListener("keydown", e => {
    if (!document.getElementById("panel-calculator").classList.contains("active")) return;
    handleCalcKey(e);
  });
  updateCalcDisplay();
}

function handleCalcBtn(btn) {
  const action = btn.dataset.action;
  const val    = btn.dataset.val;

  // SHIFT
  if (action === "fn-shift") {
    calc.shiftOn = !calc.shiftOn;
    btn.style.background = calc.shiftOn ? "rgba(200,170,20,.35)" : "";
    return;
  }
  if (action === "fn-alpha") {
    calc.alphaOn = !calc.alphaOn;
    btn.style.background = calc.alphaOn ? "rgba(20,100,200,.35)" : "";
    return;
  }
  if (action === "toggle-angle") {
    const modes = ["DEG","RAD","GRAD"];
    calc.angleMode = modes[(modes.indexOf(calc.angleMode)+1) % modes.length];
    btn.textContent = calc.angleMode;
    document.getElementById("calc-angle-mode").textContent = calc.angleMode;
    return;
  }
  if (action === "fn-mode") return;

  // Determine effective action considering SHIFT
  let eff = action;
  if (calc.shiftOn && btn.dataset.shift) {
    eff = btn.dataset.shift;
  }

  if (action === "ac")      { calcAC(); }
  else if (action === "del"){ calcDEL(); }
  else if (action === "equals"){ calcEval(); }
  else if (action === "digit") { calcAppend(val); }
  else if (action === "dot")   { calcAppend("."); }
  else if (action === "op")    { calcAppend(val === "×" ? "*" : val === "÷" ? "/" : val === "−" ? "-" : val); }
  else if (action === "paren-open")  { calcAppend("("); }
  else if (action === "paren-close") { calcAppend(")"); }
  else if (action === "insert-pi")   { calcAppend("π"); }
  else if (action === "insert-exp")  { calcAppend("E"); }
  else if (action === "ans")         { calcAppend("ANS"); }
  else if (action === "calc-x2")  { applyFn("^2"); }
  else if (eff === "x3")          { applyFn("^3"); }
  else if (action === "calc-sqrt")  { calcPrefixFn("sqrt("); }
  else if (eff === "cbrt")          { calcPrefixFn("cbrt("); }
  else if (action === "calc-pow")   { calcAppend("^"); }
  else if (eff === "xroot")         { calcAppend("root("); }
  else if (action === "calc-log")   { calcPrefixFn("log("); }
  else if (eff === "10x")           { calcPrefixFn("pow(10,"); }
  else if (action === "calc-ln")    { calcPrefixFn("ln("); }
  else if (eff === "ex")            { calcPrefixFn("exp("); }
  else if (action === "calc-sin")   { calcPrefixFn("sin("); }
  else if (eff === "asin")          { calcPrefixFn("asin("); }
  else if (action === "calc-cos")   { calcPrefixFn("cos("); }
  else if (eff === "acos")          { calcPrefixFn("acos("); }
  else if (action === "calc-tan")   { calcPrefixFn("tan("); }
  else if (eff === "atan")          { calcPrefixFn("atan("); }
  else if (action === "calc-hyp-sin")   { calcPrefixFn("sinh("); }
  else if (eff === "hyp-asin")          { calcPrefixFn("asinh("); }
  else if (action === "calc-hyp-cos")   { calcPrefixFn("cosh("); }
  else if (eff === "hyp-acos")          { calcPrefixFn("acosh("); }
  else if (action === "calc-hyp-tan")   { calcPrefixFn("tanh("); }
  else if (eff === "hyp-atan")          { calcPrefixFn("atanh("); }
  else if (action === "calc-nPr") { calcAppend("nPr("); }
  else if (action === "calc-nCr") { calcAppend("nCr("); }
  else if (action === "calc-percent") { applyFn("/100"); }
  else if (action === "mem-sto") { calc.memory = calc.lastAnswer; document.getElementById("mem-display").textContent = fmt(calc.memory); }
  else if (action === "mem-rcl") { calcAppend(String(calc.memory)); }
  else if (action === "insert-S2F") { tryFraction(); return; }

  // Reset shift/alpha after any non-meta action
  if (!["fn-shift","fn-alpha","toggle-angle","fn-mode"].includes(action)) {
    if (calc.shiftOn) {
      calc.shiftOn = false;
      document.getElementById("btn-shift").style.background = "";
    }
    if (calc.alphaOn) {
      calc.alphaOn = false;
      document.getElementById("btn-alpha").style.background = "";
    }
  }
  updateCalcDisplay();
}

function handleCalcKey(e) {
  const k = e.key;
  if (k >= "0" && k <= "9") calcAppend(k);
  else if (k === ".") calcAppend(".");
  else if (k === "+") calcAppend("+");
  else if (k === "-") calcAppend("-");
  else if (k === "*") calcAppend("*");
  else if (k === "/") calcAppend("/");
  else if (k === "(") calcAppend("(");
  else if (k === ")") calcAppend(")");
  else if (k === "^") calcAppend("^");
  else if (k === "Enter" || k === "=") { e.preventDefault(); calcEval(); }
  else if (k === "Backspace") calcDEL();
  else if (k === "Escape") calcAC();
  else { return; }
  updateCalcDisplay();
}

function calcAppend(ch) { calc.expression += ch; }
function calcPrefixFn(fn) { calc.expression += fn; }
function applyFn(suffix) { calc.expression += suffix; }

function calcAC() {
  calc.expression = "";
  document.getElementById("calc-result-display").textContent = "";
}

function calcDEL() {
  calc.expression = calc.expression.slice(0, -1);
}

function calcEval() {
  if (!calc.expression.trim()) return;
  try {
    const result = evaluateExpr(calc.expression);
    calc.lastAnswer = result;
    addToHistory(calc.expression, result);
    document.getElementById("calc-result-display").textContent = `= ${fmt(result)}`;
    calc.expression = fmt(result);
  } catch (err) {
    document.getElementById("calc-result-display").textContent = "Error: " + err.message;
  }
  updateCalcDisplay();
}

// ── Safe math evaluator ───────────────────────────────────────────────────────
function evaluateExpr(expr) {
  // Normalize operators
  let e = expr
    .replace(/\s+/g,"")
    .replace(/π/g, "(Math.PI)")
    .replace(/ANS/g, String(calc.lastAnswer))
    .replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-")
    .replace(/\^/g,"**")
    .replace(/E(\d)/g,"*10**$1")
    // Named functions — order matters (longer names first)
    .replace(/nPr\(([^,]+),([^)]+)\)/g, (_, n, r) => nPr(Number(n), Number(r)))
    .replace(/nCr\(([^,]+),([^)]+)\)/g, (_, n, r) => nCr(Number(n), Number(r)))
    .replace(/root\(([^,]+),([^)]+)\)/g, (_, x, n) => `(Math.pow(${x}, 1/${n}))`)
    .replace(/cbrt\(/g,"(Math.cbrt(").replace(/sqrt\(/g,"(Math.sqrt(")
    .replace(/asinh\(/g,"(Math.asinh(").replace(/acosh\(/g,"(Math.acosh(").replace(/atanh\(/g,"(Math.atanh(")
    .replace(/sinh\(/g,"(Math.sinh(").replace(/cosh\(/g,"(Math.cosh(").replace(/tanh\(/g,"(Math.tanh(")
    .replace(/asin\(/g,"(Math.asin(").replace(/acos\(/g,"(Math.acos(").replace(/atan\(/g,"(Math.atan(")
    .replace(/ln\(/g,"(Math.log(").replace(/log\(/g,"(Math.log10(").replace(/exp\(/g,"(Math.exp(")
    .replace(/pow\(/g,"(Math.pow(")
    .replace(/sin\(/g,"(Math.sin(").replace(/cos\(/g,"(Math.cos(").replace(/tan\(/g,"(Math.tan(");

  // Wrap trig args in degree conversion if DEG mode
  if (calc.angleMode === "DEG") {
    e = e.replace(/(Math\.sin|Math\.cos|Math\.tan)\((.*?)\)/g, (m, fn, arg) => `${fn}((${arg})*Math.PI/180)`);
    e = e.replace(/(Math\.asin|Math\.acos|Math\.atan)\((.*?)\)/g, (m, fn, arg) => `(${fn}(${arg})*180/Math.PI)`);
    e = e.replace(/(Math\.sinh|Math\.cosh|Math\.tanh|Math\.asinh|Math\.acosh|Math\.atanh)\((.*?)\)/g, (m,fn,arg) => `${fn}(${arg})`);
  } else if (calc.angleMode === "GRAD") {
    e = e.replace(/(Math\.sin|Math\.cos|Math\.tan)\((.*?)\)/g, (m, fn, arg) => `${fn}((${arg})*Math.PI/200)`);
    e = e.replace(/(Math\.asin|Math\.acos|Math\.atan)\((.*?)\)/g, (m, fn, arg) => `(${fn}(${arg})*200/Math.PI)`);
  }

  // Auto-close open parentheses
  const openCount = (e.match(/\(/g)||[]).length - (e.match(/\)/g)||[]).length;
  e += ")".repeat(Math.max(0, openCount));

  // Safety check: only allow safe characters
  if (/[a-zA-Z_$]/.test(e.replace(/Math\./g,"").replace(/Infinity/g,""))) {
    throw new Error("Expresión inválida");
  }

  const result = Function('"use strict"; return (' + e + ')')();
  if (typeof result !== "number" || isNaN(result)) throw new Error("Resultado inválido");
  return result;
}

function nPr(n, r) { return factorial(n) / factorial(n - r); }
function nCr(n, r) { return factorial(n) / (factorial(r) * factorial(n - r)); }
function factorial(n) {
  if (n < 0) throw new Error("Factorial negativo");
  if (n > 170) throw new Error("Número demasiado grande");
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}

function fmt(n) {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e10 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
  const s = n.toPrecision(10);
  return parseFloat(s).toString();
}

function tryFraction() {
  const v = calc.lastAnswer;
  if (Number.isInteger(v) || !isFinite(v)) return;
  // Approximation to simple fraction using continued fractions (up to denom 1000)
  let best = { n:Math.round(v), d:1, err:Math.abs(v - Math.round(v)) };
  for (let d = 2; d <= 1000; d++) {
    const n = Math.round(v * d);
    const err = Math.abs(v - n / d);
    if (err < best.err) best = { n, d, err };
    if (err < 1e-9) break;
  }
  const frac = `${best.n}/${best.d}`;
  calc.expression = frac;
  document.getElementById("calc-result-display").textContent = `≈ ${frac}`;
  updateCalcDisplay();
}

function addToHistory(expr, result) {
  const list = document.getElementById("calc-history-list");
  const empty = list.querySelector(".history-empty");
  if (empty) empty.remove();

  calc.history.unshift({ expr, result });
  if (calc.history.length > 50) calc.history.pop();

  const entry = document.createElement("div");
  entry.className = "history-entry";
  entry.innerHTML = `<div class="history-expr">${expr.replace(/</g,"&lt;")}</div><div class="history-result">= ${fmt(result)}</div>`;
  entry.addEventListener("click", () => { calc.expression = String(result); updateCalcDisplay(); });
  list.insertBefore(entry, list.firstChild);
}

function updateCalcDisplay() {
  const fd = document.getElementById("calc-formula-display");
  const rd = document.getElementById("calc-result-display");
  // Format display expression: replace internal tokens with pretty symbols
  let disp = calc.expression
    .replace(/\*\*/g,"^").replace(/\*/g,"×").replace(/\//g,"÷")
    .replace(/-/g,"−").replace(/Math\.PI/g,"π")
    .replace(/Math\.sqrt\(/g,"√(").replace(/Math\.cbrt\(/g,"∛(")
    .replace(/Math\.log\(/g,"ln(").replace(/Math\.log10\(/g,"log(")
    .replace(/Math\.exp\(/g,"eˣ(").replace(/Math\.pow\(10,/g,"10^(")
    .replace(/Math\.sin\(/g,"sin(").replace(/Math\.cos\(/g,"cos(").replace(/Math\.tan\(/g,"tan(")
    .replace(/Math\.asin\(/g,"sin⁻¹(").replace(/Math\.acos\(/g,"cos⁻¹(").replace(/Math\.atan\(/g,"tan⁻¹(")
    .replace(/Math\.sinh\(/g,"sinh(").replace(/Math\.cosh\(/g,"cosh(").replace(/Math\.tanh\(/g,"tanh(")
    .replace(/Math\.asinh\(/g,"sinh⁻¹(").replace(/Math\.acosh\(/g,"cosh⁻¹(").replace(/Math\.atanh\(/g,"tanh⁻¹(")
    .replace(/\(1×10\^\(/g,"×10^(");
  fd.textContent = disp || "0";
}
