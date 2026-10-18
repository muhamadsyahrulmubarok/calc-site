/* Futures calculator — USDT-M linear (calc.syahrul.web.id) */

const FUT_MODES = ["position", "pnl", "tpsl", "liq", "fee"];

function futNum(id) {
  return parseId(document.getElementById(id).value);
}

function futLeverage() {
  const sel = document.getElementById("fut-leverage").value;
  if (sel === "custom") {
    const c = futNum("fut-lev-custom");
    return Number.isFinite(c) && c > 0 ? c : NaN;
  }
  return Number(sel);
}

function futSide() {
  return document.getElementById("fut-side").value === "short" ? "short" : "long";
}

function futSign(side) {
  return side === "short" ? -1 : 1;
}

function setFutMode(mode) {
  const m = FUT_MODES.includes(mode) ? mode : "position";
  for (const id of FUT_MODES) {
    const box = document.getElementById(`fut-box-${id}`);
    if (box) box.hidden = id !== m;
  }
  document.querySelectorAll("#fut-modes [data-fut]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.fut === m));
  });
  renderFutures();
}

function syncLevCustom() {
  const custom = document.getElementById("fut-leverage").value === "custom";
  document.getElementById("fut-lev-custom-wrap").hidden = !custom;
}

function pnlLinear(entry, exit, size, side) {
  const diff = side === "long" ? exit - entry : entry - exit;
  return diff * size;
}

function liqPrice(entry, lev, side, mmr) {
  // Isolated approx for linear USDT-M
  if (side === "long") return entry * (1 - 1 / lev + mmr);
  return entry * (1 + 1 / lev - mmr);
}

function renderFutPosition() {
  const balance = futNum("fut-balance");
  const riskPct = futNum("fut-risk-pct");
  const entry = futNum("fut-pos-entry");
  const stop = futNum("fut-pos-stop");
  const lev = futLeverage();
  const side = futSide();

  if (![balance, riskPct, entry, stop, lev].every(Number.isFinite) || entry <= 0 || lev <= 0) {
    document.getElementById("fut-result").innerHTML = rows([["Hasil", "—"]]);
    return;
  }

  const stopDist = Math.abs(entry - stop);
  if (stopDist === 0) {
    document.getElementById("fut-result").innerHTML = rows([["Error", "Entry dan SL tidak boleh sama"]]);
    return;
  }

  // Validate SL side
  const slOk =
    (side === "long" && stop < entry) || (side === "short" && stop > entry);

  const riskUsd = balance * (riskPct / 100);
  const size = riskUsd / stopDist;
  const notional = size * entry;
  const margin = notional / lev;
  const mmr = 0.005;
  const liq = liqPrice(entry, lev, side, mmr);

  document.getElementById("fut-result").innerHTML = rows([
    ["Side", side.toUpperCase()],
    ["Risk $", formatId(riskUsd, 2) + " USDT"],
    ["Jarak SL", formatId(stopDist, 6)],
    ["Size (coin)", formatId(size, 6), true],
    ["Notional", formatId(notional, 2) + " USDT"],
    ["Margin (~)", formatId(margin, 2) + " USDT"],
    ["Likuidasi approx", formatId(liq, 4)],
    ...(slOk ? [] : [["Peringatan", "SL di sisi yang salah untuk " + side]]),
  ]);
}

function renderFutPnl() {
  const entry = futNum("fut-pnl-entry");
  const exit = futNum("fut-pnl-exit");
  let size = futNum("fut-pnl-size");
  const notionalIn = futNum("fut-pnl-notional");
  const lev = futLeverage();
  const side = futSide();

  if (Number.isFinite(notionalIn) && notionalIn > 0 && Number.isFinite(entry) && entry > 0) {
    size = notionalIn / entry;
  }

  if (![entry, exit, size, lev].every(Number.isFinite) || entry <= 0 || size <= 0 || lev <= 0) {
    document.getElementById("fut-result").innerHTML = rows([["Hasil", "—"]]);
    return;
  }

  const notional = size * entry;
  const margin = notional / lev;
  const pnl = pnlLinear(entry, exit, size, side);
  const pnlPct = (pnl / notional) * 100;
  const roe = (pnl / margin) * 100;

  document.getElementById("fut-result").innerHTML = rows([
    ["Side", side.toUpperCase()],
    ["Size", formatId(size, 6) + " coin"],
    ["Notional", formatId(notional, 2) + " USDT"],
    ["Margin", formatId(margin, 2) + " USDT"],
    ["PnL", formatId(pnl, 2) + " USDT", true],
    ["PnL % (price)", formatId(pnlPct, 2) + " %"],
    ["ROE %", formatId(roe, 2) + " %"],
  ]);
}

function renderFutTpsl() {
  const entry = futNum("fut-tp-entry");
  const size = futNum("fut-tp-size");
  const risk = futNum("fut-tp-risk");
  const rr = futNum("fut-tp-rr");
  const targetOverride = futNum("fut-tp-target");
  const side = futSide();

  if (![entry, size, risk].every(Number.isFinite) || entry <= 0 || size <= 0 || risk <= 0) {
    document.getElementById("fut-result").innerHTML = rows([["Hasil", "—"]]);
    return;
  }

  const stopDist = risk / size;
  const reward =
    Number.isFinite(targetOverride) && targetOverride > 0
      ? targetOverride
      : risk * (Number.isFinite(rr) && rr > 0 ? rr : 2);
  const tpDist = reward / size;

  const sl = side === "long" ? entry - stopDist : entry + stopDist;
  const tp = side === "long" ? entry + tpDist : entry - tpDist;
  const usedRr = risk > 0 ? reward / risk : NaN;

  document.getElementById("fut-result").innerHTML = rows([
    ["Side", side.toUpperCase()],
    ["Risk $", formatId(risk, 2) + " USDT"],
    ["Reward $", formatId(reward, 2) + " USDT"],
    ["R : R", formatId(usedRr, 2)],
    ["Stop loss", formatId(sl, 4), true],
    ["Take profit", formatId(tp, 4), true],
  ]);
}

function renderFutLiq() {
  const entry = futNum("fut-liq-entry");
  const lev = futLeverage();
  const mmrPct = futNum("fut-mmr");
  const side = futSide();
  const mode = document.getElementById("fut-margin-mode").value;

  if (![entry, lev, mmrPct].every(Number.isFinite) || entry <= 0 || lev <= 0) {
    document.getElementById("fut-result").innerHTML = rows([["Hasil", "—"]]);
    return;
  }

  const mmr = mmrPct / 100;
  const liq = liqPrice(entry, lev, side, mmr);
  const buffer = Math.abs(entry - liq);
  const bufferPct = (buffer / entry) * 100;

  document.getElementById("fut-result").innerHTML = rows([
    ["Mode", mode],
    ["Side", side.toUpperCase()],
    ["Leverage", formatId(lev, 2) + "×"],
    ["MMR", formatId(mmrPct, 3) + " %"],
    ["Harga likuidasi", formatId(liq, 4), true],
    ["Buffer dari entry", formatId(buffer, 4) + ` (${formatId(bufferPct, 2)}%)`],
    ...(mode === "cross"
      ? [["Catatan", "Cross: likuidasi nyata tergantung equity keseluruhan"]]
      : []),
  ]);
}

function renderFutFee() {
  const notional = futNum("fut-fee-notional");
  const feePct = futNum("fut-fee-pct");
  const fundRate = futNum("fut-funding-rate");
  const periods = futNum("fut-funding-n");

  if (![notional, feePct].every(Number.isFinite) || notional <= 0) {
    document.getElementById("fut-result").innerHTML = rows([["Hasil", "—"]]);
    return;
  }

  const fees = notional * (feePct / 100);
  const funding =
    Number.isFinite(fundRate) && Number.isFinite(periods)
      ? notional * (fundRate / 100) * periods
      : 0;
  const net = fees + funding;

  document.getElementById("fut-result").innerHTML = rows([
    ["Notional", formatId(notional, 2) + " USDT"],
    ["Trading fee (open+close)", formatId(fees, 4) + " USDT"],
    ["Funding total", formatId(funding, 4) + " USDT"],
    ["Biaya gabungan", formatId(net, 4) + " USDT", true],
    ["% dari notional", formatId((net / notional) * 100, 3) + " %"],
  ]);
}

function renderFutures() {
  const pressed = document.querySelector('#fut-modes [aria-pressed="true"]');
  const mode = pressed?.dataset.fut || "position";
  syncLevCustom();
  if (mode === "position") renderFutPosition();
  else if (mode === "pnl") renderFutPnl();
  else if (mode === "tpsl") renderFutTpsl();
  else if (mode === "liq") renderFutLiq();
  else renderFutFee();
}

function initFutures() {
  const panel = document.getElementById("panel-futures");
  if (!panel) return;

  document.getElementById("fut-modes").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-fut]");
    if (btn) setFutMode(btn.dataset.fut);
  });

  panel.addEventListener("input", renderFutures);
  panel.addEventListener("change", () => {
    syncLevCustom();
    renderFutures();
  });

  setFutMode("position");
}

initFutures();
