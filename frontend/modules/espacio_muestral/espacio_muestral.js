/**
 * espacio_muestral.js - Módulo de Solucionador de Probabilidad y Partición del Espacio Muestral
 * Gestiona el formulario de entrada, modo de conteos vs probabilidades, cálculo de Laplace,
 * visualización de 1 evento, pasos algebraicos y métricas inferenciales.
 */

function initSolverListeners() {
  // Botones de selección de 1, 2 o 3 eventos
  document.querySelectorAll("[data-events]").forEach(btn => {
    btn.addEventListener("click", () => {
      showNumEventsUI(parseInt(btn.dataset.events));
    });
  });

  // Selector de modo: probabilidades [0-1] o conteos/frecuencias
  document.querySelectorAll('input[name="input_mode"]').forEach(r => {
    r.addEventListener("change", e => {
      state.inputMode = e.target.value;
      updatePrefixes();
      updateCountMode();
    });
  });

  // Checkbox de eventos disjuntos
  const disjointCheck = document.getElementById("check-disjoint");
  if (disjointCheck) {
    disjointCheck.addEventListener("change", e => {
      state.isDisjoint = e.target.checked;
      updateDisjointUI();
    });
  }

  // Envío del formulario
  const probForm = document.getElementById("prob-form");
  if (probForm) {
    probForm.addEventListener("submit", e => {
      e.preventDefault();
      solveProblem();
    });
  }

  // Botón reset
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      probForm.reset();
      state.isDisjoint = false;
      if (disjointCheck) disjointCheck.checked = false;
      updateDisjointUI();
    });
  }

  // Descarga SVG
  const btnSvg = document.getElementById("btn-download-svg");
  if (btnSvg) {
    btnSvg.addEventListener("click", () => {
      if (typeof downloadSVG === "function") {
        downloadSVG("venn-diagram", "venn_solucionador");
      }
    });
  }

  // Cerrar alerta axiomática
  const btnAxiomClose = document.getElementById("axiom-close-btn");
  if (btnAxiomClose) {
    btnAxiomClose.addEventListener("click", hideAxiomError);
  }
}

function showNumEventsUI(num) {
  state.numEvents = num;
  document.querySelectorAll("[data-events]").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.events) === num);
  });

  const b1 = document.getElementById("block-1-event");
  const b2 = document.getElementById("block-2-events");
  const r2 = document.getElementById("section-rel-2");
  const b3 = document.getElementById("block-3-events");
  const r3 = document.getElementById("section-rel-3");

  [b1, b2, r2, b3, r3].forEach(el => {
    if (el) el.classList.add("hidden");
  });

  if (num === 1 && b1) { b1.classList.remove("hidden"); }
  if (num === 2) {
    if (b2) b2.classList.remove("hidden");
    if (r2) r2.classList.remove("hidden");
  }
  if (num === 3) {
    if (b3) b3.classList.remove("hidden");
    if (r3) r3.classList.remove("hidden");
  }

  updateCountMode();
  updatePrefixes();
}

function updateCountMode() {
  const modeCountsEl = document.getElementById("mode-counts");
  const isCounts = modeCountsEl ? modeCountsEl.checked : false;
  state.inputMode = isCounts ? "counts" : "probabilities";

  const ssContainer = document.getElementById("sample-space-container");
  if (ssContainer) {
    ssContainer.classList.toggle("hidden", !isCounts);
  }

  const probInputs = [
    "val-a1", "val-a", "val-b", "val-3a", "val-3b", "val-3c",
    "val-ab", "val-union-ab", "val-3-ab", "val-3-ac", "val-3-bc", "val-3-abc", "val-3-union"
  ];
  probInputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (isCounts) {
      el.removeAttribute("max");
      el.step = "1";
    } else {
      el.max = "1";
      el.step = "any";
    }
  });
}

function updatePrefixes() {
  const isCounts = state.inputMode === "counts";
  const pfx = (letter) => isCounts ? `|${letter}| =` : `P(${letter}) =`;
  const setPrefix = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setPrefix("prefix-a1", pfx("A"));
  setPrefix("prefix-a",  pfx("A"));
  setPrefix("prefix-b",  pfx("B"));
  setPrefix("prefix-3a", pfx("A"));
  setPrefix("prefix-3b", pfx("B"));
  setPrefix("prefix-3c", pfx("C"));

  ["prefix-3ab", "prefix-3ac", "prefix-3bc", "prefix-3abc"].forEach((id, i) => {
    const labels = isCounts ? ["AB", "AC", "BC", "ABC"] : ["A∩B", "A∩C", "B∩C", "A∩B∩C"];
    const el = document.getElementById(id);
    if (el) el.textContent = labels[i];
  });
}

function updateDisjointUI() {
  const hint  = document.getElementById("disjoint-hint");
  const inter = document.getElementById("val-ab");
  if (!inter) return;
  if (state.isDisjoint) {
    if (hint) hint.classList.remove("hidden");
    inter.value = "0";
    inter.disabled = true;
  } else {
    if (hint) hint.classList.add("hidden");
    inter.disabled = false;
  }
}

async function solveProblem() {
  hideAxiomError();
  const payload = buildPayload();
  if (!payload) return;

  const btn = document.getElementById("btn-calculate");
  const orig = btn ? btn.innerHTML : "";
  if (btn) {
    btn.innerHTML = `<span class="pulse-mini"></span> Calculando...`;
    btn.disabled = true;
  }

  try {
    const res  = await fetch(API_SOLVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || data.status === "error") {
      showAxiomError(data.error || "Error en el cálculo.");
      return;
    }
    state.lastResult = data;
    renderResults(data);
  } catch {
    showAxiomError(`No se pudo conectar con el backend en ${API_SOLVE_URL}. Verifica que el servidor Flask esté corriendo con: python backend/app.py`);
  } finally {
    if (btn) {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  }
}

function buildPayload() {
  const isCounts = state.inputMode === "counts";
  const ssEl = document.getElementById("input-sample-space");
  const sampleSpace = ssEl && ssEl.value ? parseFloat(ssEl.value) : 100;
  const parseVal = id => {
    const el = document.getElementById(id);
    const v = el ? el.value : undefined;
    return (v !== undefined && v !== "") ? parseFloat(v) : null;
  };

  if (state.numEvents === 1) {
    const nameA = (document.getElementById("name-a1")?.value || "").trim() || "Evento A";
    const valA  = parseVal("val-a1");
    if (valA === null) {
      showAxiomError("Ingresa el valor del Evento A.");
      return null;
    }
    const payload = {
      num_events: 1,
      input_mode: state.inputMode,
      sample_space: sampleSpace,
      names: { A: nameA }
    };
    if (isCounts) payload.count_a = valA;
    else payload.p_a = valA;
    return payload;
  }

  if (state.numEvents === 2) {
    const nameA = (document.getElementById("name-a")?.value || "").trim() || "Evento A";
    const nameB = (document.getElementById("name-b")?.value || "").trim() || "Evento B";
    const valA  = parseVal("val-a");
    const valB  = parseVal("val-b");
    if (valA === null || valB === null) {
      showAxiomError("Ingresa P(A) y P(B).");
      return null;
    }

    const valAB    = parseVal("val-ab");
    const valUnion = parseVal("val-union-ab");

    if (!state.isDisjoint && valAB === null && valUnion === null) {
      showAxiomError("Ingresa la Intersección P(A∩B) o la Unión P(A∪B), o marca los eventos como Disjuntos.");
      return null;
    }

    const p = {
      num_events: 2,
      input_mode: state.inputMode,
      sample_space: sampleSpace,
      names: { A: nameA, B: nameB },
      is_disjoint: state.isDisjoint
    };
    if (isCounts) {
      p.count_a = valA;
      p.count_b = valB;
      if (state.isDisjoint) p.count_ab = 0;
      else if (valAB !== null) p.count_ab = valAB;
      if (valUnion !== null) p.count_union = valUnion;
    } else {
      p.p_a = valA;
      p.p_b = valB;
      if (state.isDisjoint) p.p_ab = 0;
      else if (valAB !== null) p.p_ab = valAB;
      if (valUnion !== null) p.p_union = valUnion;
    }
    return p;
  }

  if (state.numEvents === 3) {
    const nameA = (document.getElementById("name-3a")?.value || "").trim() || "Evento A";
    const nameB = (document.getElementById("name-3b")?.value || "").trim() || "Evento B";
    const nameC = (document.getElementById("name-3c")?.value || "").trim() || "Evento C";
    const vals  = ["val-3a", "val-3b", "val-3c", "val-3-ab", "val-3-ac", "val-3-bc"].map(parseVal);
    if (vals.some(v => v === null)) {
      showAxiomError("Completa los valores de los 3 eventos y las 3 intersecciones dobles.");
      return null;
    }
    const [vA, vB, vC, vAB, vAC, vBC] = vals;
    const vABC   = parseVal("val-3-abc");
    const vUnion = parseVal("val-3-union");
    if (vABC === null && vUnion === null) {
      showAxiomError("Proporciona P(A∩B∩C) o P(A∪B∪C) para deducir la otra.");
      return null;
    }
    const p = {
      num_events: 3,
      input_mode: state.inputMode,
      sample_space: sampleSpace,
      names: { A: nameA, B: nameB, C: nameC }
    };
    if (isCounts) {
      Object.assign(p, { count_a: vA, count_b: vB, count_c: vC, count_ab: vAB, count_ac: vAC, count_bc: vBC });
      if (vABC !== null) p.count_abc = vABC;
      if (vUnion !== null) p.count_union = vUnion;
    } else {
      Object.assign(p, { p_a: vA, p_b: vB, p_c: vC, p_ab: vAB, p_ac: vAC, p_bc: vBC });
      if (vABC !== null) p.p_abc = vABC;
      if (vUnion !== null) p.p_union = vUnion;
    }
    return p;
  }
  return null;
}

function renderResults(data) {
  if (data.num_events === 1) {
    renderOneEvent(data);
    return;
  }

  const badgeEl = document.getElementById("typology-badge");
  const countEl = document.getElementById("typology-events-count");
  const descEl  = document.getElementById("typology-description");

  if (badgeEl) badgeEl.textContent = data.typology;
  if (countEl) countEl.textContent = `${data.num_events} Eventos`;
  if (descEl) descEl.textContent = data.typology_description;

  if (typeof renderVennDiagram === "function") {
    renderVennDiagram("venn-diagram", "venn-tooltip", data.venn_data, data);
  }
  renderRegionsSummary("regions-grid", data.regions, data);
  renderSteps(data.steps);
  renderMetricsTable(data);
}

function renderOneEvent(data) {
  const badgeEl = document.getElementById("typology-badge");
  const countEl = document.getElementById("typology-events-count");
  const descEl  = document.getElementById("typology-description");

  if (badgeEl) badgeEl.textContent = data.typology;
  if (countEl) countEl.textContent = "1 Evento";
  if (descEl) descEl.textContent = data.typology_description;

  renderSteps(data.steps);
  renderMetricsTable(data);

  const container = document.getElementById("venn-diagram");
  if (!container) return;
  container.innerHTML = "";

  const w = Math.min(container.clientWidth || 520, 560);
  const h = 380;
  const pA = data.probabilities["P(A)"] || data.probabilities[Object.keys(data.probabilities)[0]] || 0;
  const pNotA = data.probabilities["P(Aᶜ)"] !== undefined ? data.probabilities["P(Aᶜ)"] : (1 - pA);
  const nameA = (data.names && data.names.A) || "Evento A";
  const isCounts = data.input_mode === "counts";
  const sp = data.sample_space_size || 100;
  const cntA = isCounts ? (data.count_a !== undefined ? data.count_a : Math.round(pA * sp)) : Math.round(pA * sp);
  const cntNotA = sp - cntA;

  if (typeof d3 === "undefined") {
    container.innerHTML = `<div style="color:var(--rose);padding:2rem">Error: Librería D3.js no disponible.</div>`;
    return;
  }

  const svg = d3.select(container).append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("display", "block")
    .style("margin", "0 auto");

  // Marco del Espacio Muestral (Universo)
  svg.append("rect")
    .attr("x", 12).attr("y", 12)
    .attr("width", w - 24).attr("height", h - 24)
    .attr("rx", 14)
    .attr("fill", "rgba(15,23,42,0.4)")
    .attr("stroke", "rgba(255,255,255,0.15)")
    .attr("stroke-width", 1.5);

  // Símbolo U (Espacio Muestral)
  svg.append("text")
    .attr("x", 26).attr("y", 38)
    .attr("class", "venn-universe-text")
    .html(`<tspan class="venn-universe-highlight">𝕌</tspan> (Espacio Muestral${isCounts ? ` | N=${sp}` : ''})`);

  // Círculo Evento A
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

  // Texto dentro del círculo A
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

  // Tarjeta de Exterior / Complemento A^c
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

  const regGrid = document.getElementById("regions-grid");
  if (regGrid) regGrid.innerHTML = "";
}

const REGION_DOTS = {
  only_a: "#6366f1", only_b: "#ec4899", only_c: "#06b6d4",
  only_ab: "#a855f7", only_ac: "#3b82f6", only_bc: "#14b8a6",
  intersection_ab: "#a855f7", intersection_abc: "#f59e0b", neither: "#64748b"
};

function renderRegionsSummary(gridId, regions, data) {
  const grid = document.getElementById(gridId);
  if (!grid || !regions) return;
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

function renderSteps(steps) {
  const container = document.getElementById("steps-container");
  const countBadge = document.getElementById("steps-count-badge");
  if (!container || !steps) return;
  if (countBadge) countBadge.textContent = `${steps.length} pasos`;
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
    try {
      return katex.renderToString(latex, { displayMode: true, throwOnError: false });
    } catch {}
  }
  return `<span style="font-family:monospace">${latex}</span>`;
}

const METRIC_DESC = {
  "P(A)": "Probabilidad simple del Evento A",
  "P(B)": "Probabilidad simple del Evento B",
  "P(C)": "Probabilidad simple del Evento C",
  "P(Aᶜ)": "Complemento de A — probabilidad de que no ocurra A",
  "P(Bᶜ)": "Complemento de B",
  "Odds a favor": "Relación P(A)/P(Aᶜ): por cada caso desfavorable",
  "P(A∩B)": "Probabilidad de que ocurran A y B simultáneamente",
  "P(A∩C)": "Probabilidad de que ocurran A y C simultáneamente",
  "P(B∩C)": "Probabilidad de que ocurran B y C simultáneamente",
  "P(A∩B∩C)": "Probabilidad de los 3 eventos al mismo tiempo",
  "P(A∪B)": "Al menos uno de A o B ocurre",
  "P(A∪B∪C)": "Al menos uno de los tres ocurre",
};

function renderMetricsTable(data) {
  const tbody = document.getElementById("metrics-table-body");
  if (!tbody || !data || !data.probabilities) return;
  tbody.innerHTML = "";
  Object.entries(data.probabilities).forEach(([k, v]) => {
    if (typeof v !== "number") return;
    const row = document.createElement("tr");
    const pct = `${(v * 100).toFixed(2)}%`;
    const cnt = (v * (data.sample_space_size || 100)).toFixed(1);
    const desc = METRIC_DESC[k] || "Métrica inferencial calculada";
    row.innerHTML = `<td>${k}</td><td><strong>${v.toFixed(4)}</strong></td><td>${pct}</td><td>${cnt}</td><td style="color:var(--txt-m)">${desc}</td>`;
    tbody.appendChild(row);
  });
}

function showAxiomError(msg) {
  const b = document.getElementById("axiom-error-banner");
  const msgEl = document.getElementById("axiom-error-message");
  if (msgEl) msgEl.textContent = msg;
  if (b) {
    b.classList.remove("hidden");
    b.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function hideAxiomError() {
  const b = document.getElementById("axiom-error-banner");
  if (b) b.classList.add("hidden");
}
