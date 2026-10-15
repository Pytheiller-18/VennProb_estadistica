/**
 * diagrama_venn.js - Módulo de Visualización y Diagramas de Venn
 * Renderiza diagramas de 2 y 3 eventos usando D3.js y Venn.js.
 * Proyecta datos numéricos y porcentajes directamente dentro de cada región,
 * enmarca el Espacio Muestral (𝕌), gestiona el Diagrama de Venn por Datos Directos
 * y permite la exportación vectorial SVG.
 */

const VENN_COLORS = ["#6366f1", "#ec4899", "#06b6d4", "#a855f7", "#3b82f6", "#14b8a6", "#f59e0b"];

function renderVennDiagram(containerId, tooltipId, vennData, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (typeof venn === "undefined" || typeof d3 === "undefined") {
    container.innerHTML = `<div style="color:var(--rose);padding:2rem">Error: Librerías D3.js o Venn.js no disponibles.</div>`;
    return;
  }

  const w = Math.min(container.clientWidth || 520, 580);
  const h = 400;
  const chart = venn.VennDiagram().width(w).height(h);
  const div   = d3.select(container);
  div.datum(vennData).call(chart);

  div.selectAll(".venn-circle path")
    .style("fill",         (d, i) => VENN_COLORS[i % VENN_COLORS.length])
    .style("fill-opacity", 0.42)
    .style("stroke",       (d, i) => VENN_COLORS[i % VENN_COLORS.length])
    .style("stroke-width", "2px");

  div.selectAll(".venn-intersection path")
    .style("fill-opacity", 0.62)
    .style("stroke", "rgba(255,255,255,.35)")
    .style("stroke-width", "1.5px");

  // Inyección de etiquetas y valores directamente dentro de las áreas de la gráfica
  formatSolverVennLabels(div, data);

  const tooltip = document.getElementById(tooltipId);
  div.selectAll("g.venn-area")
    .on("mouseover", function(d) {
      venn.sortAreas(div, d);
      d3.select(this).select("path")
        .style("fill-opacity", 0.82)
        .style("stroke-width", "3.5px")
        .style("stroke", "#fff");
      if (tooltip) {
        const name = d.sets.join(" ∩ ");
        const sz   = d.size;
        const sp   = data ? data.sample_space_size : sz;
        const pct  = data && data.input_mode === "counts"
          ? `${((sz / sp) * 100).toFixed(2)}%`
          : `${sz.toFixed(2)}%`;
        tooltip.innerHTML = `
          <div class="venn-tooltip-title">${name}</div>
          <div class="venn-tooltip-detail"><span>Tamaño:</span><span>${sz.toFixed(2)}</span></div>
          <div class="venn-tooltip-detail"><span>Porcentaje:</span><span>${pct}</span></div>`;
        tooltip.classList.add("visible");
      }
    })
    .on("mousemove", function() {
      if (tooltip) {
        const r = container.getBoundingClientRect();
        tooltip.style.left = `${d3.event.clientX - r.left}px`;
        tooltip.style.top  = `${d3.event.clientY - r.top}px`;
      }
    })
    .on("mouseout", function() {
      if (tooltip) tooltip.classList.remove("visible");
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

  // Marco de Espacio Muestral (𝕌) y tarjeta Exterior / Ninguno
  const svg = div.select("svg");
  if (!svg.empty()) {
    svg.select(".venn-universe-corner").remove();
    const cornerGroup = svg.append("g").attr("class", "venn-universe-corner");

    cornerGroup.append("text")
      .attr("x", 16)
      .attr("y", 24)
      .attr("class", "venn-universe-text")
      .html(`<tspan class="venn-universe-highlight">𝕌</tspan> (Espacio Muestral${isCounts ? ` | N=${data.sample_space_size}` : ''})`);

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

// ── Tab 2: Diagrama de Venn por Datos Directos ────────────────────────────────
function initDirectVennListeners() {
  document.querySelectorAll("[data-direct-events]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = parseInt(btn.dataset.directEvents);
      state.directEvents = n;
      document.querySelectorAll("[data-direct-events]").forEach(b => {
        b.classList.toggle("active", parseInt(b.dataset.directEvents) === n);
      });
      const r2 = document.getElementById("vd-regions-2");
      const r3 = document.getElementById("vd-regions-3");
      const bc = document.getElementById("vd-box-c");
      if (r2) r2.classList.toggle("hidden", n !== 2);
      if (r3) r3.classList.toggle("hidden", n !== 3);
      if (bc) bc.classList.toggle("hidden", n !== 3);
    });
  });

  const vdForm = document.getElementById("venn-direct-form");
  if (vdForm) {
    vdForm.addEventListener("submit", e => {
      e.preventDefault();
      drawDirectVenn();
    });
  }

  const btnVdSvg = document.getElementById("btn-vd-download");
  if (btnVdSvg) {
    btnVdSvg.addEventListener("click", () => {
      downloadSVG("venn-direct-diagram", "diagrama_venn_directo");
    });
  }
}

function drawDirectVenn() {
  const n = state.directEvents;
  const nameA = (document.getElementById("vd-name-a")?.value || "").trim() || "A";
  const nameB = (document.getElementById("vd-name-b")?.value || "").trim() || "B";
  const nameC = (document.getElementById("vd-name-c")?.value || "").trim() || "C";
  const g = id => {
    const el = document.getElementById(id);
    return Math.max(parseFloat(el ? el.value : 0) || 0, 0);
  };

  let vennData, regionCards, totalN;

  if (n === 2) {
    const onlyA = g("vd-only-a"), onlyB = g("vd-only-b"), ab = g("vd-inter-ab"), neither = g("vd-neither-2");
    totalN = onlyA + onlyB + ab + neither;
    const sizeA = onlyA + ab;
    const sizeB = onlyB + ab;
    vennData = [
      { sets: [nameA], size: Math.max(sizeA, 0.001) },
      { sets: [nameB], size: Math.max(sizeB, 0.001) },
      { sets: [nameA, nameB], size: ab }
    ];
    regionCards = [
      { name: `Solo ${nameA}`, notation: `${nameA}\\${nameB}`, val: onlyA, color: "#6366f1" },
      { name: `Solo ${nameB}`, notation: `${nameB}\\${nameA}`, val: onlyB, color: "#ec4899" },
      { name: `${nameA} ∩ ${nameB}`, notation: `${nameA}∩${nameB}`, val: ab, color: "#a855f7" },
      { name: "Ninguno (Exterior)", notation: "∅", val: neither, color: "#64748b" }
    ];
  } else {
    const oA  = g("vd-3-only-a"), oB  = g("vd-3-only-b"), oC  = g("vd-3-only-c");
    const oAB = g("vd-3-only-ab"), oAC = g("vd-3-only-ac"), oBC = g("vd-3-only-bc");
    const abc = g("vd-3-abc"), neither = g("vd-3-neither");
    totalN = oA + oB + oC + oAB + oAC + oBC + abc + neither;
    const sA  = oA + oAB + oAC + abc;
    const sB  = oB + oAB + oBC + abc;
    const sC  = oC + oAC + oBC + abc;
    const sAB = oAB + abc;
    const sAC = oAC + abc;
    const sBC = oBC + abc;
    vennData = [
      { sets: [nameA], size: Math.max(sA, 0.001) },
      { sets: [nameB], size: Math.max(sB, 0.001) },
      { sets: [nameC], size: Math.max(sC, 0.001) },
      { sets: [nameA, nameB], size: sAB },
      { sets: [nameA, nameC], size: sAC },
      { sets: [nameB, nameC], size: sBC },
      { sets: [nameA, nameB, nameC], size: abc }
    ];
    regionCards = [
      { name: `Solo ${nameA}`, notation: `${nameA}\\(${nameB}∪${nameC})`, val: oA, color: "#6366f1" },
      { name: `Solo ${nameB}`, notation: `${nameB}\\(${nameA}∪${nameC})`, val: oB, color: "#ec4899" },
      { name: `Solo ${nameC}`, notation: `${nameC}\\(${nameA}∪${nameB})`, val: oC, color: "#06b6d4" },
      { name: `Solo ${nameA}∩${nameB}`, notation: `(${nameA}∩${nameB})\\${nameC}`, val: oAB, color: "#a855f7" },
      { name: `Solo ${nameA}∩${nameC}`, notation: `(${nameA}∩${nameC})\\${nameB}`, val: oAC, color: "#3b82f6" },
      { name: `Solo ${nameB}∩${nameC}`, notation: `(${nameB}∩${nameC})\\${nameA}`, val: oBC, color: "#14b8a6" },
      { name: `${nameA}∩${nameB}∩${nameC}`, notation: "Intersección triple", val: abc, color: "#f59e0b" },
      { name: "Ninguno (Exterior)", notation: "∅", val: neither, color: "#64748b" }
    ];
  }

  const container = document.getElementById("venn-direct-diagram");
  if (!container) return;
  container.innerHTML = "";

  if (typeof venn === "undefined" || typeof d3 === "undefined") {
    container.innerHTML = `<div style="color:var(--rose);padding:2rem">Error: Librerías no disponibles.</div>`;
    return;
  }
  const w = Math.min(container.clientWidth || 520, 580);
  const chart = venn.VennDiagram().width(w).height(400);
  const div   = d3.select(container);
  div.datum(vennData).call(chart);
  div.selectAll(".venn-circle path")
    .style("fill", (d, i) => VENN_COLORS[i % VENN_COLORS.length])
    .style("fill-opacity", 0.42)
    .style("stroke", (d, i) => VENN_COLORS[i % VENN_COLORS.length])
    .style("stroke-width", "2px");
  div.selectAll(".venn-intersection path")
    .style("fill-opacity", 0.62)
    .style("stroke", "rgba(255,255,255,.35)")
    .style("stroke-width", "1.5px");

  const regionValues = (n === 2)
    ? { onlyA: g("vd-only-a"), onlyB: g("vd-only-b"), ab: g("vd-inter-ab") }
    : { oA: g("vd-3-only-a"), oB: g("vd-3-only-b"), oC: g("vd-3-only-c"), oAB: g("vd-3-only-ab"), oAC: g("vd-3-only-ac"), oBC: g("vd-3-only-bc"), abc: g("vd-3-abc") };
  const neitherVal = (n === 2) ? g("vd-neither-2") : g("vd-3-neither");
  formatDirectVennLabels(div, n, nameA, nameB, nameC, regionValues, totalN, neitherVal);

  const tooltip = document.getElementById("venn-direct-tooltip");
  div.selectAll("g.venn-area")
    .on("mouseover", function(d) {
      venn.sortAreas(div, d);
      d3.select(this).select("path").style("fill-opacity", 0.82).style("stroke-width", "3.5px").style("stroke", "#fff");
      if (tooltip) {
        tooltip.innerHTML = `<div class="venn-tooltip-title">${d.sets.join(" ∩ ")}</div><div class="venn-tooltip-detail"><span>Tamaño:</span><span>${d.size.toFixed(0)}</span></div>`;
        tooltip.classList.add("visible");
      }
    })
    .on("mousemove", function() {
      if (tooltip) {
        const r = container.getBoundingClientRect();
        tooltip.style.left = `${d3.event.clientX - r.left}px`;
        tooltip.style.top  = `${d3.event.clientY - r.top}px`;
      }
    })
    .on("mouseout", function() {
      if (tooltip) tooltip.classList.remove("visible");
      d3.select(this).select("path")
        .style("fill-opacity", d => d.sets.length > 1 ? 0.62 : 0.42)
        .style("stroke-width", d => d.sets.length > 1 ? "1.5px" : "2px")
        .style("stroke", d => d.sets.length > 1 ? "rgba(255,255,255,.35)" : null);
    });

  const grid = document.getElementById("vd-regions-summary");
  if (grid) {
    grid.innerHTML = "";
    regionCards.forEach(rc => {
      const pct = totalN > 0 ? `${((rc.val / totalN) * 100).toFixed(2)}%` : "0.00%";
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
}

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
    const neitherPct = totalN > 0 ? `${((neitherVal / totalN) * 100).toFixed(1)}%` : "0%";
    gBox.append("text").attr("x", 10).attr("y", 29).attr("class", "venn-text-sub").text(`Porcentaje: ${neitherPct}`);
  }
}

// ── Exportación SVG ───────────────────────────────────────────────────────────
function downloadSVG(containerId, filename) {
  const svg = document.querySelector(`#${containerId} svg`);
  if (!svg) {
    alert("Primero genera o calcula el diagrama.");
    return;
  }
  let src = new XMLSerializer().serializeToString(svg);
  if (!src.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    src = src.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
