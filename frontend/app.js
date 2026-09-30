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

  const container = document.getElementById("venn-diagram");
  container.innerHTML = "";
  const w = Math.min(container.clientWidth || 520, 560);
  const h = 380;
  const pA = data.probabilities["P(A)"] || 0;
  const pNotA = data.probabilities["P(Aᶜ)"] !== undefined ? data.probabilities["P(Aᶜ)"] : (1 - pA);
  const nameA = (data.names && data.names.A) || "Evento A";
  const isCounts = data.input_mode === "counts";
  const sp = data.sample_space_size || 100;
  const cntA = isCounts ? (data.count_a !== undefined ? data.count_a : Math.round(pA * sp)) : Math.round(pA * sp);
  const cntNotA = sp - cntA;

  const svg = d3.select(container).append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("display", "block")
    .style("margin", "0 auto");

  // Universal set frame
  svg.append("rect")
    .attr("x", 12).attr("y", 12)
    .attr("width", w - 24).attr("height", h - 24)
    .attr("rx", 14)
    .attr("fill", "rgba(15,23,42,0.4)")
    .attr("stroke", "rgba(255,255,255,0.15)")
    .attr("stroke-width", 1.5);

  // U symbol (Espacio Muestral)
  svg.append("text")
    .attr("x", 26).attr("y", 38)
    .attr("class", "venn-universe-text")
    .html(`<tspan class="venn-universe-highlight">𝕌</tspan> (Espacio Muestral${isCounts ? ` | N=${sp}` : ''})`);

  // Circle A
  const cx = w / 2;
  const cy = h / 2 + 10;
  const r = Math.min(w, h) * 0.32;

  const circleG = svg.append("g");
  circleG.append("circle")
    .attr("cx", cx).attr("cy", cy).attr("r", r)
    .attr("fill", "#6366f1")
    .attr("fill-opacity", 0.45)
    .attr("stroke", "#6366f1")
    .attr("stroke-width", 2.5);

  // Text inside circle A
  const textA = circleG.append("text")
    .attr("class", "label")
    .attr("x", cx).attr("y", cy)
    .attr("text-anchor", "middle");

  textA.append("tspan")
    .attr("class", "venn-text-title")
    .attr("x", cx).attr("y", cy)
    .attr("dy", "-0.7em")
    .style("font-size", "14px")
    .text(nameA);

  textA.append("tspan")
    .attr("class", "venn-text-val")
    .attr("x", cx).attr("y", cy)
    .attr("dy", "0.75em")
    .style("font-size", "13px")
    .text(isCounts ? `n = ${cntA}` : `P(${nameA}) = ${pA.toFixed(4)}`);

  textA.append("tspan")
    .attr("class", "venn-text-sub")
    .attr("x", cx).attr("y", cy)
    .attr("dy", "2.1em")
    .text(`${(pA * 100).toFixed(2)}%`);

  // Exterior badge (Complement A^c)
  const extBox = svg.append("g").attr("transform", `translate(${w - 235}, 20)`);
  extBox.append("rect")
    .attr("width", 215).attr("height", 44)
    .attr("class", "venn-universe-bg");
  extBox.append("text")
    .attr("x", 12).attr("y", 18)
    .attr("class", "venn-universe-text")
    .text(`Complemento: `)
    .append("tspan").attr("class", "venn-universe-highlight")
    .text(isCounts ? `n = ${cntNotA}` : `P(${nameA}ᶜ) = ${pNotA.toFixed(4)}`);
  extBox.append("text")
    .attr("x", 12).attr("y", 34)
    .attr("class", "venn-text-sub")
    .text(`Exterior: ${(pNotA * 100).toFixed(2)}% del total`);

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

  // In-graph representation of data inside the Venn regions!
  formatSolverVennLabels(div, data);

  const tooltip = document.getElementById(tooltipId);
  div.selectAll("g.venn-area")
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

function formatSolverVennLabels(div, data) {
  if (!data || !data.regions) return;
  const isCounts  = data.input_mode === "counts";
  const numEvents = data.num_events;
  const names     = data.names || {};
  const nameA     = names.A || "A";
  const nameB     = names.B || "B";
  const nameC     = names.C || "C";

  function getRegionInfo(dSets) {
    if (numEvents === 2) {
      if (dSets.length === 1) {
        if (dSets[0] === nameA) {
          const r = data.regions.only_a;
          return { title: `Solo ${nameA}`, valStr: isCounts ? `n = ${r.count}` : `P = ${r.prob.toFixed(4)}`, pctStr: r.percentage };
        } else if (dSets[0] === nameB) {
          const r = data.regions.only_b;
          return { title: `Solo ${nameB}`, valStr: isCounts ? `n = ${r.count}` : `P = ${r.prob.toFixed(4)}`, pctStr: r.percentage };
        }
      } else if (dSets.length === 2) {
        const r = data.regions.intersection_ab;
        return { title: `${nameA} ∩ ${nameB}`, valStr: isCounts ? `n = ${r.count}` : `P = ${r.prob.toFixed(4)}`, pctStr: r.percentage };
      }
    } else if (numEvents === 3) {
      if (dSets.length === 1) {
        if (dSets[0] === nameA) {
          const r = data.regions.only_a;
          return { title: `Solo ${nameA}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
        } else if (dSets[0] === nameB) {
          const r = data.regions.only_b;
          return { title: `Solo ${nameB}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
        } else if (dSets[0] === nameC) {
          const r = data.regions.only_c;
          return { title: `Solo ${nameC}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
        }
      } else if (dSets.length === 2) {
        const hasA = dSets.includes(nameA), hasB = dSets.includes(nameB), hasC = dSets.includes(nameC);
        if (hasA && hasB) {
          const r = data.regions.only_ab;
          return { title: `${nameA}∩${nameB}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
        } else if (hasA && hasC) {
          const r = data.regions.only_ac;
          return { title: `${nameA}∩${nameC}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
        } else if (hasB && hasC) {
          const r = data.regions.only_bc;
          return { title: `${nameB}∩${nameC}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
        }
      } else if (dSets.length === 3) {
        const r = data.regions.intersection_abc;
        return { title: `${nameA}∩${nameB}∩${nameC}`, valStr: isCounts ? `n=${r.count}` : `P=${r.prob.toFixed(4)}`, pctStr: r.percentage };
      }
    }
    return null;
  }

  // Update existing SVG text labels
  div.selectAll("g.venn-area").each(function(d) {
    const info = getRegionInfo(d.sets);
    if (!info) return;

    let textNode = d3.select(this).select("text");
    if (textNode.empty()) {
      textNode = d3.select(this).append("text").attr("class", "label");
    }

    const x = textNode.attr("x") || 0;
    const y = textNode.attr("y") || 0;

    textNode.text(null);
    textNode.append("tspan")
      .attr("class", "venn-text-title")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", "-0.65em")
      .text(info.title);

    textNode.append("tspan")
      .attr("class", "venn-text-val")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", "0.75em")
      .text(info.valStr);

    textNode.append("tspan")
      .attr("class", "venn-text-sub")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", "1.9em")
      .text(info.pctStr);
  });

  // Add Universal set badge & Exterior / Ninguno inside SVG
  const svg = div.select("svg");
  if (!svg.empty()) {
    svg.select(".venn-universe-corner").remove();
    const cornerGroup = svg.append("g").attr("class", "venn-universe-corner");

    // Top-left universe symbol
    cornerGroup.append("text")
      .attr("x", 16)
      .attr("y", 24)
      .attr("class", "venn-universe-text")
      .html(`<tspan class="venn-universe-highlight">𝕌</tspan> (Espacio Muestral${isCounts ? ` | N=${data.sample_space_size}` : ''})`);

    // Top-right exterior / neither box
    const neither = data.regions.neither;
    if (neither) {
      const neitherVal = isCounts ? `n = ${neither.count}` : `P = ${neither.prob.toFixed(4)}`;
      const boxW = 210, boxH = 36;
      const svgW = parseFloat(svg.attr("width")) || 540;
      const boxX = svgW - boxW - 14;

      const gBox = cornerGroup.append("g").attr("transform", `translate(${boxX}, 12)`);
      gBox.append("rect")
        .attr("width", boxW)
        .attr("height", boxH)
        .attr("class", "venn-universe-bg");

      gBox.append("text")
        .attr("x", 10)
        .attr("y", 15)
        .attr("class", "venn-universe-text")
        .text(`Exterior / Ninguno: `)
        .append("tspan")
        .attr("class", "venn-universe-highlight")
        .text(neitherVal);

      gBox.append("text")
        .attr("x", 10)
        .attr("y", 29)
        .attr("class", "venn-text-sub")
        .text(`Complemento: ${neither.percentage}`);
    }
  }
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

  // In-graph representation of data inside the Direct Venn regions!
  const regionValues = (n === 2)
    ? { onlyA: g("vd-only-a"), onlyB: g("vd-only-b"), ab: g("vd-inter-ab") }
    : { oA: g("vd-3-only-a"), oB: g("vd-3-only-b"), oC: g("vd-3-only-c"), oAB: g("vd-3-only-ab"), oAC: g("vd-3-only-ac"), oBC: g("vd-3-only-bc"), abc: g("vd-3-abc") };
  const neitherVal = (n === 2) ? g("vd-neither-2") : g("vd-3-neither");
  formatDirectVennLabels(div, n, nameA, nameB, nameC, regionValues, totalN, neitherVal);

  const tooltip = document.getElementById("venn-direct-tooltip");
  div.selectAll("g.venn-area")
    .on("mouseover", function(d) {
      venn.sortAreas(div,d);
      d3.select(this).select("path").style("fill-opacity",0.82).style("stroke-width","3.5px").style("stroke","#fff");
      tooltip.innerHTML = `<div class="venn-tooltip-title">${d.sets.join(" ∩ ")}</div><div class="venn-tooltip-detail"><span>Tamaño:</span><span>${d.size.toFixed(0)}</span></div>`;
      tooltip.classList.add("visible");
    })
    .on("mousemove", function() { const r=container.getBoundingClientRect(); tooltip.style.left=`${d3.event.clientX-r.left}px`; tooltip.style.top=`${d3.event.clientY-r.top}px`; })
    .on("mouseout", function() { tooltip.classList.remove("visible"); d3.select(this).select("path").style("fill-opacity",d=>d.sets.length>1?0.62:0.42).style("stroke-width",d=>d.sets.length>1?"1.5px":"2px").style("stroke",d=>d.sets.length>1?"rgba(255,255,255,.35)":null); });

function formatDirectVennLabels(div, n, nameA, nameB, nameC, regionValues, totalN, neitherVal) {
  div.selectAll("g.venn-area").each(function(d) {
    let title = "", val = 0;
    if (n === 2) {
      if (d.sets.length === 1) {
        if (d.sets[0] === nameA) { title = `Solo ${nameA}`; val = regionValues.onlyA; }
        else { title = `Solo ${nameB}`; val = regionValues.onlyB; }
      } else {
        title = `${nameA} ∩ ${nameB}`; val = regionValues.ab;
      }
    } else {
      if (d.sets.length === 1) {
        if (d.sets[0] === nameA) { title = `Solo ${nameA}`; val = regionValues.oA; }
        else if (d.sets[0] === nameB) { title = `Solo ${nameB}`; val = regionValues.oB; }
        else { title = `Solo ${nameC}`; val = regionValues.oC; }
      } else if (d.sets.length === 2) {
        const hasA = d.sets.includes(nameA), hasB = d.sets.includes(nameB), hasC = d.sets.includes(nameC);
        if (hasA && hasB) { title = `${nameA}∩${nameB}`; val = regionValues.oAB; }
        else if (hasA && hasC) { title = `${nameA}∩${nameC}`; val = regionValues.oAC; }
        else { title = `${nameB}∩${nameC}`; val = regionValues.oBC; }
      } else if (d.sets.length === 3) {
        title = `${nameA}∩${nameB}∩${nameC}`; val = regionValues.abc;
      }
    }

    let textNode = d3.select(this).select("text");
    if (textNode.empty()) textNode = d3.select(this).append("text").attr("class", "label");

    const x = textNode.attr("x") || 0;
    const y = textNode.attr("y") || 0;
    const pct = totalN > 0 ? `${((val / totalN) * 100).toFixed(1)}%` : "";

    textNode.text(null);
    textNode.append("tspan").attr("class", "venn-text-title").attr("x", x).attr("y", y).attr("dy", "-0.65em").text(title);
    textNode.append("tspan").attr("class", "venn-text-val").attr("x", x).attr("y", y).attr("dy", "0.75em").text(val);
    if (pct) {
      textNode.append("tspan").attr("class", "venn-text-sub").attr("x", x).attr("y", y).attr("dy", "1.9em").text(`(${pct})`);
    }
  });

  const svg = div.select("svg");
  if (!svg.empty()) {
    svg.select(".venn-universe-corner").remove();
    const cornerGroup = svg.append("g").attr("class", "venn-universe-corner");
    cornerGroup.append("text")
      .attr("x", 16)
      .attr("y", 24)
      .attr("class", "venn-universe-text")
      .html(`<tspan class="venn-universe-highlight">𝕌</tspan> (Total N = ${totalN})`);

    const boxW = 200, boxH = 36;
    const svgW = parseFloat(svg.attr("width")) || 540;
    const boxX = svgW - boxW - 14;
    const gBox = cornerGroup.append("g").attr("transform", `translate(${boxX}, 12)`);
    gBox.append("rect").attr("width", boxW).attr("height", boxH).attr("class", "venn-universe-bg");
    gBox.append("text").attr("x", 10).attr("y", 15).attr("class", "venn-universe-text").text("Exterior / Ninguno: ").append("tspan").attr("class", "venn-universe-highlight").text(neitherVal);
    const neitherPct = totalN > 0 ? `${((neitherVal/totalN)*100).toFixed(1)}%` : "0%";
    gBox.append("text").attr("x", 10).attr("y", 29).attr("class", "venn-text-sub").text(`Porcentaje: ${neitherPct}`);
  }
}

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
  expression: "",       // what's being typed
  cursorPos: 0,         // text cursor position
  shiftOn: false,
  alphaOn: false,
  angleMode: "DEG",     // DEG | RAD | GRAD
  memory: 0,
  lastAnswer: 0,
  lastFraction: null,   // { num, den, exact }
  displayMode: "frac",  // "frac" | "dec" | "mixed"
  history: []
};

function initCalculator() {
  document.querySelectorAll(".calc-btn").forEach(btn => {
    btn.addEventListener("click", () => handleCalcBtn(btn));
  });

  const fd = document.getElementById("calc-formula-display");
  if (fd) {
    fd.addEventListener("click", () => {
      calc.cursorPos = calc.expression.length;
      updateCalcDisplay();
    });
  }

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

  // Arrow navigation
  if (action === "arrow-left") {
    calc.cursorPos = Math.max(0, calc.cursorPos - 1);
    updateCalcDisplay();
    return;
  }
  if (action === "arrow-right") {
    calc.cursorPos = Math.min(calc.expression.length, calc.cursorPos + 1);
    updateCalcDisplay();
    return;
  }

  // Determine effective action considering SHIFT
  let eff = action;
  if (calc.shiftOn && btn.dataset.shift) {
    eff = btn.dataset.shift;
  }

  if (action === "ac")             { calcAC(); }
  else if (action === "del")       { calcDEL(); }
  else if (action === "equals")    { calcEval(); }
  else if (action === "calc-frac") { handleFracBtn(); }
  else if (action === "digit")     { calcInsert(val); }
  else if (action === "dot")       { calcInsert("."); }
  else if (action === "op")        { calcInsert(val === "×" ? "*" : val === "÷" ? "/" : val === "−" ? "-" : val); }
  else if (action === "paren-open"){ calcInsert("("); }
  else if (action === "paren-close"){ calcInsert(")"); }
  else if (action === "insert-pi") { calcInsert("π"); }
  else if (action === "insert-exp"){ calcInsert("E"); }
  else if (action === "ans")       { calcInsert("ANS"); }
  else if (action === "calc-x2")   { calcInsert("^2"); }
  else if (eff === "x3")           { calcInsert("^3"); }
  else if (action === "calc-sqrt") { calcInsert("sqrt("); }
  else if (eff === "cbrt")         { calcInsert("cbrt("); }
  else if (action === "calc-pow")  { calcInsert("^"); }
  else if (eff === "xroot")        { calcInsert("root("); }
  else if (action === "calc-log")  { calcInsert("log("); }
  else if (eff === "10x")          { calcInsert("pow(10,"); }
  else if (action === "calc-ln")   { calcInsert("ln("); }
  else if (eff === "ex")           { calcInsert("exp("); }
  else if (action === "calc-sin")  { calcInsert("sin("); }
  else if (eff === "asin")         { calcInsert("asin("); }
  else if (action === "calc-cos")  { calcInsert("cos("); }
  else if (eff === "acos")         { calcInsert("acos("); }
  else if (action === "calc-tan")  { calcInsert("tan("); }
  else if (eff === "atan")         { calcInsert("atan("); }
  else if (action === "calc-hyp-sin")  { calcInsert("sinh("); }
  else if (eff === "hyp-asin")         { calcInsert("asinh("); }
  else if (action === "calc-hyp-cos")  { calcInsert("cosh("); }
  else if (eff === "hyp-acos")         { calcInsert("acosh("); }
  else if (action === "calc-hyp-tan")  { calcInsert("tanh("); }
  else if (eff === "hyp-atan")         { calcInsert("atanh("); }
  else if (action === "calc-nPr")      { calcInsert("nPr("); }
  else if (action === "calc-nCr")      { calcInsert("nCr("); }
  else if (action === "calc-percent")  { calcInsert("/100"); }
  else if (action === "mem-sto")       { calc.memory = calc.lastAnswer; document.getElementById("mem-display").textContent = fmt(calc.memory); }
  else if (action === "mem-rcl")       { calcInsert(String(calc.memory)); }
  else if (action === "insert-S2F")    { handleS2F(); return; }

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
}

function handleCalcKey(e) {
  const k = e.key;
  if (k >= "0" && k <= "9") calcInsert(k);
  else if (k === ".") calcInsert(".");
  else if (k === "+") calcInsert("+");
  else if (k === "-") calcInsert("-");
  else if (k === "*") calcInsert("*");
  else if (k === "/") calcInsert("/");
  else if (k === "(") calcInsert("(");
  else if (k === ")") calcInsert(")");
  else if (k === "^") calcInsert("^");
  else if (k === "ArrowLeft")  { calc.cursorPos = Math.max(0, calc.cursorPos - 1); updateCalcDisplay(); }
  else if (k === "ArrowRight") { calc.cursorPos = Math.min(calc.expression.length, calc.cursorPos + 1); updateCalcDisplay(); }
  else if (k === "Enter" || k === "=") { e.preventDefault(); calcEval(); }
  else if (k === "Backspace") calcDEL();
  else if (k === "Escape") calcAC();
}

function calcInsert(str, cursorOffset = str.length) {
  const pos = Math.min(Math.max(0, calc.cursorPos), calc.expression.length);
  calc.expression = calc.expression.slice(0, pos) + str + calc.expression.slice(pos);
  calc.cursorPos = pos + cursorOffset;
  updateCalcDisplay();
}

function calcDEL() {
  if (calc.cursorPos > 0) {
    const pos = calc.cursorPos;
    calc.expression = calc.expression.slice(0, pos - 1) + calc.expression.slice(pos);
    calc.cursorPos = pos - 1;
    updateCalcDisplay();
  }
}

function calcAC() {
  calc.expression = "";
  calc.cursorPos = 0;
  calc.lastFraction = null;
  document.getElementById("calc-result-display").innerHTML = "";
  updateCalcDisplay();
}

function handleFracBtn() {
  if (calc.shiftOn) {
    // Mixed fraction template: a b/c -> +( / )
    calcInsert("+(/)", 2);
    calc.shiftOn = false;
    document.getElementById("btn-shift").style.background = "";
    return;
  }
  const pos = calc.cursorPos;
  const expr = calc.expression;
  const prevChar = pos > 0 ? expr[pos - 1] : "";
  if (/[0-9)π]/.test(prevChar)) {
    calcInsert("/");
  } else {
    calcInsert("(/)", 1);
  }
}

// ── Continued Fractions for Exact Rational Representation ────────────────────
function toFraction(val, maxDenom = 10000) {
  if (!isFinite(val)) return null;
  const sign = val < 0 ? -1 : 1;
  let x = Math.abs(val);
  if (Math.abs(x - Math.round(x)) < 1e-10) {
    return { num: sign * Math.round(x), den: 1, exact: true };
  }
  let m00 = 1, m01 = 0, m10 = 0, m11 = 1;
  let b = x;
  for (let iter = 0; iter < 30; iter++) {
    let a = Math.floor(b);
    let t0 = m00 * a + m01; m01 = m00; m00 = t0;
    let t1 = m10 * a + m11; m11 = m10; m10 = t1;
    if (m10 > maxDenom) break;
    let err = Math.abs(x - m00 / m10);
    if (err < 1e-11) break;
    let rem = b - a;
    if (rem < 1e-12) break;
    b = 1 / rem;
  }
  return { num: sign * m00, den: m10, exact: Math.abs(val - (sign * m00 / m10)) < 1e-6 };
}

function handleS2F() {
  const rd = document.getElementById("calc-result-display");
  if (!calc.lastFraction && calc.lastAnswer !== null) {
    calc.lastFraction = toFraction(calc.lastAnswer);
  }
  if (!calc.lastFraction || calc.lastFraction.den === 1) return;

  const f = calc.lastFraction;
  const num = f.num, den = f.den;
  const isImproper = Math.abs(num) > den;

  if (calc.displayMode === "frac") {
    if (isImproper) {
      calc.displayMode = "mixed";
      const whole = Math.trunc(num / den);
      const rem   = Math.abs(num % den);
      rd.innerHTML = `= ${whole} <span class="casio-fraction"><span class="c-num">${rem}</span><span class="c-bar"></span><span class="c-den">${den}</span></span>`;
    } else {
      calc.displayMode = "dec";
      rd.textContent = `= ${fmt(calc.lastAnswer)}`;
    }
  } else if (calc.displayMode === "mixed") {
    calc.displayMode = "dec";
    rd.textContent = `= ${fmt(calc.lastAnswer)}`;
  } else {
    calc.displayMode = "frac";
    rd.innerHTML = `= <span class="casio-fraction"><span class="c-num">${num}</span><span class="c-bar"></span><span class="c-den">${den}</span></span>`;
  }
}

function calcEval() {
  if (!calc.expression.trim()) return;
  const rd = document.getElementById("calc-result-display");
  try {
    const result = evaluateExpr(calc.expression);
    calc.lastAnswer = result;
    addToHistory(calc.expression, result);

    const frac = toFraction(result);
    calc.lastFraction = frac;

    if (frac && frac.den > 1 && frac.exact) {
      calc.displayMode = "frac";
      rd.innerHTML = `= <span class="casio-fraction"><span class="c-num">${frac.num}</span><span class="c-bar"></span><span class="c-den">${frac.den}</span></span> <span style="font-size:.78em;color:rgba(0,40,0,.6);margin-left:4px">(${fmt(result)})</span>`;
    } else {
      calc.displayMode = "dec";
      rd.textContent = `= ${fmt(result)}`;
    }

    // Set expression for continuous chaining
    calc.expression = fmt(result);
    calc.cursorPos = calc.expression.length;
  } catch (err) {
    rd.textContent = "Error: " + err.message;
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

function addToHistory(expr, result) {
  const list = document.getElementById("calc-history-list");
  const empty = list.querySelector(".history-empty");
  if (empty) empty.remove();

  calc.history.unshift({ expr, result });
  if (calc.history.length > 50) calc.history.pop();

  const entry = document.createElement("div");
  entry.className = "history-entry";
  entry.innerHTML = `<div class="history-expr">${expr.replace(/</g,"&lt;")}</div><div class="history-result">= ${fmt(result)}</div>`;
  entry.addEventListener("click", () => {
    calc.expression = String(result);
    calc.cursorPos = calc.expression.length;
    updateCalcDisplay();
  });
  list.insertBefore(entry, list.firstChild);
}

function updateCalcDisplay() {
  const fd = document.getElementById("calc-formula-display");
  if (!fd) return;

  const expr = calc.expression;
  const pos  = Math.min(Math.max(0, calc.cursorPos), expr.length);
  const left = expr.slice(0, pos);
  const right = expr.slice(pos);

  const formatSide = s => s
    .replace(/\*\*/g,"^").replace(/\*/g,"×").replace(/\//g,"÷")
    .replace(/-/g,"−").replace(/Math\.PI/g,"π")
    .replace(/Math\.sqrt\(/g,"√(").replace(/sqrt\(/g,"√(")
    .replace(/Math\.cbrt\(/g,"∛(").replace(/cbrt\(/g,"∛(")
    .replace(/Math\.log\(/g,"ln(").replace(/Math\.log10\(/g,"log(")
    .replace(/Math\.exp\(/g,"eˣ(").replace(/Math\.pow\(10,/g,"10^(")
    .replace(/Math\.sin\(/g,"sin(").replace(/Math\.cos\(/g,"cos(").replace(/Math\.tan\(/g,"tan(")
    .replace(/Math\.asin\(/g,"sin⁻¹(").replace(/Math\.acos\(/g,"cos⁻¹(").replace(/Math\.atan\(/g,"tan⁻¹(")
    .replace(/Math\.sinh\(/g,"sinh(").replace(/Math\.cosh\(/g,"cosh(").replace(/Math\.tanh\(/g,"tanh(")
    .replace(/Math\.asinh\(/g,"sinh⁻¹(").replace(/Math\.acosh\(/g,"cosh⁻¹(").replace(/Math\.atanh\(/g,"tanh⁻¹(")
    .replace(/root\(/g,"√(")
    .replace(/E(\d)/g,"×10^$1");

  const leftDisp  = formatSide(left);
  const rightDisp = formatSide(right);

  fd.innerHTML = `${leftDisp}<span class="calc-cursor"></span>${rightDisp}`;
}
