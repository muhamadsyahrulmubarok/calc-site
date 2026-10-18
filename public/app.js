const MAX_HISTORY = 30;
const STORAGE_KEY = "calc.syahrul.history.v1";

const el = {
  display: document.getElementById("display"),
  expr: document.getElementById("expr"),
  sci: document.getElementById("sci-keys"),
  mode: document.getElementById("btn-mode"),
  angle: document.getElementById("btn-angle"),
  history: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),
  clearHistory: document.getElementById("btn-clear-history"),
};

const state = {
  current: "0",
  acc: null,
  op: null,
  fresh: false,
  error: null,
  degrees: true,
  history: loadHistory(),
};

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history.slice(0, MAX_HISTORY)));
}

function round(n) {
  if (!Number.isFinite(n)) return n;
  return Number(Number(n.toPrecision(12)));
}

function parseDisplay(str) {
  const normalized = String(str).replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return "Error";
  const abs = Math.abs(n);
  if ((abs !== 0 && abs < 1e-9) || abs >= 1e12) {
    return n.toExponential(6).replace(".", ",").replace("e", "e");
  }
  const rounded = round(n);
  const [intRaw, frac = ""] = String(Math.abs(rounded)).split(".");
  const int = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = rounded < 0 ? "−" : "";
  return frac ? `${sign}${int},${frac}` : `${sign}${int}`;
}

function setError(msg) {
  state.error = msg;
  state.current = "0";
  state.acc = null;
  state.op = null;
  state.fresh = true;
  render();
}

function applyOp(a, op, b) {
  switch (op) {
    case "+":
      return round(a + b);
    case "-":
      return round(a - b);
    case "×":
      return round(a * b);
    case "÷":
      if (b === 0) return NaN;
      return round(a / b);
    case "^":
      return round(a ** b);
    default:
      return b;
  }
}

function toRadians(n) {
  return state.degrees ? (n * Math.PI) / 180 : n;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i += 1) r *= i;
  return r;
}

function inputDigit(ch) {
  if (state.error) state.error = null;
  if (state.fresh) {
    state.current = ch === "," ? "0," : ch;
    state.fresh = false;
    render();
    return;
  }
  if (ch === ",") {
    if (state.current.includes(",")) return;
    state.current += ",";
    render();
    return;
  }
  if (state.current === "0") state.current = ch;
  else if (state.current.replace(/[^0-9]/g, "").length < 16) state.current += ch;
  render();
}

function setOp(op) {
  if (state.error) return;
  const value = parseDisplay(state.current);
  if (state.acc !== null && state.op && !state.fresh) {
    const result = applyOp(state.acc, state.op, value);
    if (!Number.isFinite(result)) {
      setError("Tidak bisa dibagi 0");
      return;
    }
    state.acc = result;
    state.current = formatNumber(result).replace("−", "-");
  } else {
    state.acc = value;
  }
  state.op = op;
  state.fresh = true;
  render();
}

function equals() {
  if (state.error || state.acc === null || !state.op) return;
  const b = parseDisplay(state.current);
  const a = state.acc;
  const result = applyOp(a, state.op, b);
  if (!Number.isFinite(result)) {
    setError(state.op === "÷" ? "Tidak bisa dibagi 0" : "Tidak terdefinisi");
    return;
  }
  pushHistory(`${formatNumber(a)} ${state.op} ${formatNumber(b)}`, result);
  state.current = formatNumber(result).replace("−", "-");
  state.acc = null;
  state.op = null;
  state.fresh = true;
  render();
}

function unary(fn) {
  if (state.error) return;
  const x = parseDisplay(state.current);
  let y;
  switch (fn) {
    case "square":
      y = round(x * x);
      break;
    case "sqrt":
      y = x < 0 ? NaN : round(Math.sqrt(x));
      break;
    case "inv":
      y = x === 0 ? NaN : round(1 / x);
      break;
    case "sin":
      y = round(Math.sin(toRadians(x)));
      break;
    case "cos":
      y = round(Math.cos(toRadians(x)));
      break;
    case "tan":
      y = round(Math.tan(toRadians(x)));
      break;
    case "ln":
      y = x <= 0 ? NaN : round(Math.log(x));
      break;
    case "log":
      y = x <= 0 ? NaN : round(Math.log10(x));
      break;
    case "fact":
      y = factorial(x);
      break;
    case "pow":
      setOp("^");
      return;
    default:
      return;
  }
  if (!Number.isFinite(y)) {
    setError("Tidak terdefinisi");
    return;
  }
  pushHistory(`${fnLabel(fn)}(${formatNumber(x)})`, y);
  state.current = formatNumber(y).replace("−", "-");
  state.fresh = true;
  render();
}

function fnLabel(fn) {
  return { square: "sqr", sqrt: "√", inv: "1/", sin: "sin", cos: "cos", tan: "tan", ln: "ln", log: "log", fact: "n!" }[fn] || fn;
}

function percent() {
  if (state.error) return;
  const x = parseDisplay(state.current);
  let y;
  if (state.acc !== null && (state.op === "+" || state.op === "-")) y = round(state.acc * (x / 100));
  else y = round(x / 100);
  state.current = formatNumber(y).replace("−", "-");
  state.fresh = true;
  render();
}

function negate() {
  if (state.error) return;
  if (state.current.startsWith("-") || state.current.startsWith("−")) {
    state.current = state.current.replace(/^[-−]/, "");
  } else if (state.current !== "0") {
    state.current = `-${state.current}`;
  }
  render();
}

function allClear() {
  state.current = "0";
  state.acc = null;
  state.op = null;
  state.fresh = false;
  state.error = null;
  render();
}

function backspace() {
  if (state.error) {
    allClear();
    return;
  }
  if (state.fresh) return;
  const next = state.current.replace("−", "-").slice(0, -1);
  state.current = next === "" || next === "-" ? "0" : next;
  render();
}

function insertConst(name) {
  const n = name === "pi" ? Math.PI : Math.E;
  state.error = null;
  state.current = formatNumber(n).replace("−", "-");
  state.fresh = true;
  render();
}

function pushHistory(sum, value) {
  state.history.unshift({ sum, value });
  state.history = state.history.slice(0, MAX_HISTORY);
  saveHistory();
}

function recallHistory(value) {
  state.error = null;
  state.current = formatNumber(value).replace("−", "-");
  state.fresh = true;
  render();
}

function render() {
  if (state.error) {
    el.display.textContent = state.error;
    el.display.classList.add("error");
  } else {
    el.display.classList.remove("error");
    const shown = state.current.replace("-", "−");
    el.display.textContent = shown.includes(",") || /e/i.test(shown)
      ? shown
      : formatNumber(parseDisplay(state.current));
  }
  el.expr.textContent = state.acc !== null && state.op ? `${formatNumber(state.acc)} ${state.op}` : "";

  el.history.innerHTML = "";
  for (const item of state.history) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<div class="sum">${item.sum}</div><div class="val">${formatNumber(item.value)}</div>`;
    btn.addEventListener("click", () => recallHistory(item.value));
    li.appendChild(btn);
    el.history.appendChild(li);
  }
  el.historyEmpty.hidden = state.history.length > 0;
}

document.getElementById("keys").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button");
  if (!btn) return;
  if (btn.dataset.digit) inputDigit(btn.dataset.digit);
  else if (btn.dataset.op) setOp(btn.dataset.op);
  else if (btn.dataset.fn) unary(btn.dataset.fn);
  else if (btn.dataset.const) insertConst(btn.dataset.const);
  else if (btn.dataset.action === "eq") equals();
  else if (btn.dataset.action === "ac") allClear();
  else if (btn.dataset.action === "back") backspace();
  else if (btn.dataset.action === "neg") negate();
  else if (btn.dataset.action === "percent") percent();
});

el.mode.addEventListener("click", () => {
  const on = el.sci.classList.toggle("hidden") === false;
  el.mode.setAttribute("aria-pressed", String(on));
});

el.angle.addEventListener("click", () => {
  state.degrees = !state.degrees;
  el.angle.textContent = state.degrees ? "Deg" : "Rad";
  el.angle.setAttribute("aria-pressed", String(state.degrees));
});

el.clearHistory.addEventListener("click", () => {
  state.history = [];
  saveHistory();
  render();
});

window.addEventListener("keydown", (ev) => {
  if (document.getElementById("panel-calc")?.hidden) return;
  if (
    ev.target instanceof HTMLInputElement ||
    ev.target instanceof HTMLTextAreaElement ||
    ev.target instanceof HTMLSelectElement
  ) {
    return;
  }
  const k = ev.key;
  if (k >= "0" && k <= "9") {
    inputDigit(k);
    ev.preventDefault();
  } else if (k === "." || k === ",") {
    inputDigit(",");
    ev.preventDefault();
  } else if (k === "+") setOp("+");
  else if (k === "-") setOp("-");
  else if (k === "*") setOp("×");
  else if (k === "/") {
    setOp("÷");
    ev.preventDefault();
  } else if (k === "%") percent();
  else if (k === "Enter" || k === "=") {
    equals();
    ev.preventDefault();
  } else if (k === "Backspace") {
    backspace();
    ev.preventDefault();
  } else if (k === "Escape") allClear();
  else if (k === "^") unary("pow");
});

render();
