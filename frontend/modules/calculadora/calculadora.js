/**
 * calculadora.js - Módulo de la Calculadora Científica (Casio fx-350ES PLUS)
 * Emula la pantalla LCD con cursor interactivo, tecla de fracción natural (■/□),
 * conversor S↔D con algoritmo de fracciones continuas, combinatoria (nCr, nPr, factorial),
 * trigonometría con DEG/RAD/GRAD, memoria (M) e historial de operaciones.
 */

const calc = {
  expression: "",       // Expresión en edición
  cursorPos: 0,         // Posición del cursor en texto
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

  const btnClearHist = document.getElementById("btn-clear-history");
  if (btnClearHist) {
    btnClearHist.addEventListener("click", () => {
      calc.history = [];
      const hl = document.getElementById("calc-history-list");
      if (hl) hl.innerHTML = `<p class="history-empty">Aún no hay cálculos registrados.</p>`;
    });
  }

  // Soporte de teclado físico cuando la pestaña de la calculadora está activa
  document.addEventListener("keydown", e => {
    const calcPanel = document.getElementById("panel-calculator");
    if (!calcPanel || !calcPanel.classList.contains("active")) return;
    handleCalcKey(e);
  });

  updateCalcDisplay();
}

function handleCalcBtn(btn) {
  const action = btn.dataset.action;
  const val    = btn.dataset.val;

  // Teclas modificadoras
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
    const modes = ["DEG", "RAD", "GRAD"];
    calc.angleMode = modes[(modes.indexOf(calc.angleMode) + 1) % modes.length];
    btn.textContent = calc.angleMode;
    const angleEl = document.getElementById("calc-angle-mode");
    if (angleEl) angleEl.textContent = calc.angleMode;
    return;
  }
  if (action === "fn-mode") return;

  // Navegación de cursor
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

  // Acción efectiva considerando SHIFT
  let eff = action;
  if (calc.shiftOn && btn.dataset.shift) {
    eff = btn.dataset.shift;
  }

  if (action === "ac")              { calcAC(); }
  else if (action === "del")        { calcDEL(); }
  else if (action === "equals")     { calcEval(); }
  else if (action === "calc-frac")  { handleFracBtn(); }
  else if (action === "digit")      { calcInsert(val); }
  else if (action === "dot")        { calcInsert("."); }
  else if (action === "op")         { calcInsert(val === "×" ? "*" : val === "÷" ? "/" : val === "−" ? "-" : val); }
  else if (action === "paren-open") { calcInsert("("); }
  else if (action === "paren-close"){ calcInsert(")"); }
  else if (action === "insert-pi")  { calcInsert("π"); }
  else if (action === "insert-exp") { calcInsert("E"); }
  else if (action === "ans")        { calcInsert("ANS"); }
  else if (action === "calc-x2")    { calcInsert("^2"); }
  else if (eff === "x3")            { calcInsert("^3"); }
  else if (action === "calc-sqrt")  { calcInsert("sqrt("); }
  else if (eff === "cbrt")          { calcInsert("cbrt("); }
  else if (action === "calc-pow")   { calcInsert("^"); }
  else if (eff === "xroot")         { calcInsert("root("); }
  else if (action === "calc-log")   { calcInsert("log("); }
  else if (eff === "10x")           { calcInsert("pow(10,"); }
  else if (action === "calc-ln")    { calcInsert("ln("); }
  else if (eff === "ex")            { calcInsert("exp("); }
  else if (action === "calc-sin")   { calcInsert("sin("); }
  else if (eff === "asin")          { calcInsert("asin("); }
  else if (action === "calc-cos")   { calcInsert("cos("); }
  else if (eff === "acos")          { calcInsert("acos("); }
  else if (action === "calc-tan")   { calcInsert("tan("); }
  else if (eff === "atan")          { calcInsert("atan("); }
  else if (action === "calc-hyp-sin")  { calcInsert("sinh("); }
  else if (eff === "hyp-asin")         { calcInsert("asinh("); }
  else if (action === "calc-hyp-cos")  { calcInsert("cosh("); }
  else if (eff === "hyp-acos")         { calcInsert("acosh("); }
  else if (action === "calc-hyp-tan")  { calcInsert("tanh("); }
  else if (eff === "hyp-atan")         { calcInsert("atanh("); }
  else if (action === "calc-nPr")      { calcInsert("nPr("); }
  else if (action === "calc-nCr")      { calcInsert("nCr("); }
  else if (action === "calc-percent")  { calcInsert("/100"); }
  else if (action === "mem-sto") {
    calc.memory = calc.lastAnswer;
    const memEl = document.getElementById("mem-display");
    if (memEl) memEl.textContent = fmt(calc.memory);
  }
  else if (action === "mem-rcl")    { calcInsert(String(calc.memory)); }
  else if (action === "insert-S2F") { handleS2F(); return; }

  // Restablecer SHIFT/ALPHA
  if (!["fn-shift", "fn-alpha", "toggle-angle", "fn-mode"].includes(action)) {
    if (calc.shiftOn) {
      calc.shiftOn = false;
      const bShift = document.getElementById("btn-shift");
      if (bShift) bShift.style.background = "";
    }
    if (calc.alphaOn) {
      calc.alphaOn = false;
      const bAlpha = document.getElementById("btn-alpha");
      if (bAlpha) bAlpha.style.background = "";
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
  const resEl = document.getElementById("calc-result-display");
  if (resEl) resEl.innerHTML = "";
  updateCalcDisplay();
}

function handleFracBtn() {
  if (calc.shiftOn) {
    calcInsert("+(/)", 2);
    calc.shiftOn = false;
    const bShift = document.getElementById("btn-shift");
    if (bShift) bShift.style.background = "";
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

// ── Algoritmo de Fracciones Continuas ──────────────────────────────────────────
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
  if (!rd) return;
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

    if (rd) {
      if (frac && frac.den > 1 && frac.exact) {
        calc.displayMode = "frac";
        rd.innerHTML = `= <span class="casio-fraction"><span class="c-num">${frac.num}</span><span class="c-bar"></span><span class="c-den">${frac.den}</span></span> <span style="font-size:.78em;color:rgba(0,40,0,.6);margin-left:4px">(${fmt(result)})</span>`;
      } else {
        calc.displayMode = "dec";
        rd.textContent = `= ${fmt(result)}`;
      }
    }

    calc.expression = fmt(result);
    calc.cursorPos = calc.expression.length;
  } catch (err) {
    if (rd) rd.textContent = "Error: " + err.message;
  }
  updateCalcDisplay();
}

function evaluateExpr(expr) {
  let e = expr
    .replace(/\s+/g, "")
    .replace(/π/g, "(Math.PI)")
    .replace(/ANS/g, String(calc.lastAnswer))
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/\^/g, "**")
    .replace(/E(\d)/g, "*10**$1")
    .replace(/nPr\(([^,]+),([^)]+)\)/g, (_, n, r) => nPr(Number(n), Number(r)))
    .replace(/nCr\(([^,]+),([^)]+)\)/g, (_, n, r) => nCr(Number(n), Number(r)))
    .replace(/root\(([^,]+),([^)]+)\)/g, (_, x, n) => `(Math.pow(${x}, 1/${n}))`)
    .replace(/cbrt\(/g, "(Math.cbrt(").replace(/sqrt\(/g, "(Math.sqrt(")
    .replace(/asinh\(/g, "(Math.asinh(").replace(/acosh\(/g, "(Math.acosh(").replace(/atanh\(/g, "(Math.atanh(")
    .replace(/sinh\(/g, "(Math.sinh(").replace(/cosh\(/g, "(Math.cosh(").replace(/tanh\(/g, "(Math.tanh(")
    .replace(/asin\(/g, "(Math.asin(").replace(/acos\(/g, "(Math.acos(").replace(/atan\(/g, "(Math.atan(")
    .replace(/ln\(/g, "(Math.log(").replace(/log\(/g, "(Math.log10(").replace(/exp\(/g, "(Math.exp(")
    .replace(/pow\(/g, "(Math.pow(")
    .replace(/sin\(/g, "(Math.sin(").replace(/cos\(/g, "(Math.cos(").replace(/tan\(/g, "(Math.tan(");

  if (calc.angleMode === "DEG") {
    e = e.replace(/(Math\.sin|Math\.cos|Math\.tan)\((.*?)\)/g, (m, fn, arg) => `${fn}((${arg})*Math.PI/180)`);
    e = e.replace(/(Math\.asin|Math\.acos|Math\.atan)\((.*?)\)/g, (m, fn, arg) => `(${fn}(${arg})*180/Math.PI)`);
    e = e.replace(/(Math\.sinh|Math\.cosh|Math\.tanh|Math\.asinh|Math\.acosh|Math\.atanh)\((.*?)\)/g, (m, fn, arg) => `${fn}(${arg})`);
  } else if (calc.angleMode === "GRAD") {
    e = e.replace(/(Math\.sin|Math\.cos|Math\.tan)\((.*?)\)/g, (m, fn, arg) => `${fn}((${arg})*Math.PI/200)`);
    e = e.replace(/(Math\.asin|Math\.acos|Math\.atan)\((.*?)\)/g, (m, fn, arg) => `(${fn}(${arg})*200/Math.PI)`);
  }

  const openCount = (e.match(/\(/g) || []).length - (e.match(/\)/g) || []).length;
  e += ")".repeat(Math.max(0, openCount));

  if (/[a-zA-Z_$]/.test(e.replace(/Math\./g, "").replace(/Infinity/g, ""))) {
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
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function fmt(n) {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e10 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
  const s = n.toPrecision(10);
  return parseFloat(s).toString();
}

function addToHistory(expr, result) {
  const list = document.getElementById("calc-history-list");
  if (!list) return;
  const empty = list.querySelector(".history-empty");
  if (empty) empty.remove();

  calc.history.unshift({ expr, result });
  if (calc.history.length > 50) calc.history.pop();

  const entry = document.createElement("div");
  entry.className = "history-entry";
  entry.innerHTML = `<div class="history-expr">${expr.replace(/</g, "&lt;")}</div><div class="history-result">= ${fmt(result)}</div>`;
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
    .replace(/\*\*/g, "^").replace(/\*/g, "×").replace(/\//g, "÷")
    .replace(/-/g, "−").replace(/Math\.PI/g, "π")
    .replace(/Math\.sqrt\(/g, "√(").replace(/sqrt\(/g, "√(")
    .replace(/Math\.cbrt\(/g, "∛(").replace(/cbrt\(/g, "∛(")
    .replace(/Math\.log\(/g, "ln(").replace(/Math\.log10\(/g, "log(")
    .replace(/Math\.exp\(/g, "eˣ(").replace(/Math\.pow\(10,/g, "10^(")
    .replace(/Math\.sin\(/g, "sin(").replace(/Math\.cos\(/g, "cos(").replace(/Math\.tan\(/g, "tan(")
    .replace(/Math\.asin\(/g, "sin⁻¹(").replace(/Math\.acos\(/g, "cos⁻¹(").replace(/Math\.atan\(/g, "tan⁻¹(")
    .replace(/Math\.sinh\(/g, "sinh(").replace(/Math\.cosh\(/g, "cosh(").replace(/Math\.tanh\(/g, "tanh(")
    .replace(/Math\.asinh\(/g, "sinh⁻¹(").replace(/Math\.acosh\(/g, "cosh⁻¹(").replace(/Math\.atanh\(/g, "tanh⁻¹(")
    .replace(/root\(/g, "√(")
    .replace(/E(\d)/g, "×10^$1");

  const leftDisp  = formatSide(left);
  const rightDisp = formatSide(right);

  fd.innerHTML = `${leftDisp}<span class="calc-cursor"></span>${rightDisp}`;
}
