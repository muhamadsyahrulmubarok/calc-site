const PTKP = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
};

const PPH21_BRACKETS = [
  { max: 60_000_000, rate: 0.05 },
  { max: 250_000_000, rate: 0.15 },
  { max: 500_000_000, rate: 0.25 },
  { max: 5_000_000_000, rate: 0.3 },
  { max: Infinity, rate: 0.35 },
];

const UNITS = {
  panjang: {
    label: "Panjang",
    base: "m",
    items: [
      { id: "mm", label: "Milimeter (mm)", to: 0.001 },
      { id: "cm", label: "Sentimeter (cm)", to: 0.01 },
      { id: "m", label: "Meter (m)", to: 1 },
      { id: "km", label: "Kilometer (km)", to: 1000 },
      { id: "in", label: "Inci (in)", to: 0.0254 },
      { id: "ft", label: "Kaki (ft)", to: 0.3048 },
      { id: "yd", label: "Yard (yd)", to: 0.9144 },
      { id: "mi", label: "Mil (mi)", to: 1609.344 },
    ],
  },
  berat: {
    label: "Berat",
    items: [
      { id: "mg", label: "Miligram (mg)", to: 0.000001 },
      { id: "g", label: "Gram (g)", to: 0.001 },
      { id: "kg", label: "Kilogram (kg)", to: 1 },
      { id: "ton", label: "Ton (t)", to: 1000 },
      { id: "oz", label: "Ons (oz)", to: 0.028349523125 },
      { id: "lb", label: "Pound (lb)", to: 0.45359237 },
    ],
  },
  volume: {
    label: "Volume",
    items: [
      { id: "ml", label: "Mililiter (mL)", to: 0.001 },
      { id: "l", label: "Liter (L)", to: 1 },
      { id: "m3", label: "Meter kubik (m³)", to: 1000 },
      { id: "gal", label: "Galon US (gal)", to: 3.785411784 },
    ],
  },
  luas: {
    label: "Luas",
    items: [
      { id: "cm2", label: "cm²", to: 0.0001 },
      { id: "m2", label: "Meter persegi (m²)", to: 1 },
      { id: "ha", label: "Hektare (ha)", to: 10000 },
      { id: "acre", label: "Acre", to: 4046.8564224 },
    ],
  },
  data: {
    label: "Data",
    items: [
      { id: "b", label: "Byte (B)", to: 1 },
      { id: "kb", label: "KB (1000)", to: 1000 },
      { id: "mb", label: "MB (1000)", to: 1e6 },
      { id: "gb", label: "GB (1000)", to: 1e9 },
      { id: "tb", label: "TB (1000)", to: 1e12 },
      { id: "kib", label: "KiB (1024)", to: 1024 },
      { id: "mib", label: "MiB (1024)", to: 1024 ** 2 },
      { id: "gib", label: "GiB (1024)", to: 1024 ** 3 },
    ],
  },
  suhu: {
    label: "Suhu",
    special: true,
    items: [
      { id: "c", label: "Celsius (°C)" },
      { id: "f", label: "Fahrenheit (°F)" },
      { id: "k", label: "Kelvin (K)" },
    ],
  },
};

function parseId(str) {
  const raw = String(str || "").trim();
  if (!raw) return NaN;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/ /g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function formatId(n, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const opts =
    abs >= 1e10 || (abs !== 0 && abs < 0.0001)
      ? { maximumSignificantDigits: 8 }
      : { minimumFractionDigits: 0, maximumFractionDigits: digits };
  return n.toLocaleString("id-ID", opts);
}

function formatRp(n) {
  if (!Number.isFinite(n)) return "—";
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function rows(items) {
  return items
    .map(
      ([k, v, hi]) =>
        `<div${hi ? ' class="hi"' : ""}><dt>${k}</dt><dd>${v}</dd></div>`,
    )
    .join("");
}

function pph21Tax(pkp) {
  let tax = 0;
  let prev = 0;
  let rest = Math.max(0, Math.floor(pkp / 1000) * 1000);
  for (const b of PPH21_BRACKETS) {
    const slice = Math.min(rest, b.max - prev);
    if (slice > 0) tax += slice * b.rate;
    rest -= slice;
    prev = b.max;
    if (rest <= 0) break;
  }
  return tax;
}

function calcPph21() {
  const amount = parseId(document.getElementById("pph21-amount").value);
  const period = document.getElementById("pph21-period").value;
  const status = document.getElementById("pph21-status").value;
  const jabatan = document.getElementById("pph21-jabatan").checked;
  if (!Number.isFinite(amount) || amount < 0) {
    document.getElementById("pph-result").innerHTML = rows([["Isi penghasilan", "—"]]);
    return;
  }
  const yearly = period === "month" ? amount * 12 : amount;
  const biaya = jabatan ? Math.min(yearly * 0.05, 6_000_000) : 0;
  const neto = yearly - biaya;
  const ptkp = PTKP[status];
  const pkp = Math.max(0, neto - ptkp);
  const tax = pph21Tax(pkp);
  document.getElementById("pph-result").innerHTML = rows([
    ["Penghasilan setahun", formatRp(yearly)],
    ["Biaya jabatan", formatRp(biaya)],
    ["PTKP " + status, formatRp(ptkp)],
    ["PKP", formatRp(Math.floor(pkp / 1000) * 1000)],
    ["PPh 21 setahun", formatRp(tax), true],
    ["PPh 21 / bulan", formatRp(tax / 12)],
    ["Take-home setahun", formatRp(yearly - tax)],
    ["Take-home / bulan", formatRp((yearly - tax) / 12), true],
  ]);
}

function rateFromSelect(selId, customId, wrapId) {
  const sel = document.getElementById(selId);
  const wrap = document.getElementById(wrapId);
  const custom = document.getElementById(customId);
  const isCustom = sel.value === "custom";
  wrap.hidden = !isCustom;
  if (isCustom) {
    const pct = parseId(custom.value);
    return Number.isFinite(pct) ? pct / 100 : NaN;
  }
  return Number(sel.value);
}

function calcPph23() {
  const amount = parseId(document.getElementById("pph23-amount").value);
  const rate = rateFromSelect("pph23-rate", "pph23-custom", "pph23-custom-wrap");
  const basis = document.getElementById("pph23-basis").value;
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate < 0 || rate >= 1) {
    document.getElementById("pph-result").innerHTML = rows([["Isi nominal & tarif", "—"]]);
    return;
  }
  let dpp;
  let tax;
  if (basis === "nett") {
    tax = amount * (rate / (1 - rate));
    dpp = amount;
  } else {
    dpp = amount;
    tax = amount * rate;
  }
  const gross = dpp + (basis === "nett" ? tax : 0);
  const received = basis === "nett" ? amount : dpp - tax;
  document.getElementById("pph-result").innerHTML = rows([
    ["DPP", formatRp(basis === "nett" ? amount : dpp)],
    ["Tarif", `${formatId(rate * 100, 2)}%`],
    ["PPh 23", formatRp(tax), true],
    [basis === "nett" ? "Gross-up (dibayar pemberi)" : "Diterima penerima", formatRp(basis === "nett" ? gross : received), true],
  ]);
}

function calcPph42() {
  const amount = parseId(document.getElementById("pph42-amount").value);
  const rate = rateFromSelect("pph42-rate", "pph42-custom", "pph42-custom-wrap");
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate < 0) {
    document.getElementById("pph-result").innerHTML = rows([["Isi nominal", "—"]]);
    return;
  }
  const tax = amount * rate;
  document.getElementById("pph-result").innerHTML = rows([
    ["DPP", formatRp(amount)],
    ["Tarif final", `${formatId(rate * 100, 2)}%`],
    ["PPh 4(2)", formatRp(tax), true],
    ["Nett diterima", formatRp(amount - tax)],
  ]);
}

function renderPph() {
  const jenis = document.getElementById("pph-jenis").value;
  document.getElementById("pph21-box").hidden = jenis !== "pph21";
  document.getElementById("pph23-box").hidden = jenis !== "pph23";
  document.getElementById("pph42-box").hidden = jenis !== "pph42";
  if (jenis === "pph21") calcPph21();
  else if (jenis === "pph23") calcPph23();
  else calcPph42();
}

function renderDiskon() {
  const price = parseId(document.getElementById("disc-price").value);
  const pct = parseId(document.getElementById("disc-pct").value) || 0;
  const pct2 = parseId(document.getElementById("disc-pct2").value) || 0;
  const nominal = parseId(document.getElementById("disc-nominal").value) || 0;
  const finalIn = parseId(document.getElementById("disc-final").value);

  if (Number.isFinite(price) && price > 0 && Number.isFinite(finalIn) && finalIn >= 0 && !(pct || pct2 || nominal)) {
    const off = price - finalIn;
    const p = (off / price) * 100;
    document.getElementById("disc-result").innerHTML = rows([
      ["Harga asli", formatRp(price)],
      ["Harga akhir", formatRp(finalIn)],
      ["Hemat", formatRp(off)],
      ["Diskon", `${formatId(p, 2)}%`, true],
    ]);
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    document.getElementById("disc-result").innerHTML = rows([["Isi harga asli", "—"]]);
    return;
  }
  const after1 = price * (1 - pct / 100);
  const after2 = after1 * (1 - pct2 / 100);
  const end = Math.max(0, after2 - nominal);
  document.getElementById("disc-result").innerHTML = rows([
    ["Harga asli", formatRp(price)],
    ["Setelah diskon 1", formatRp(after1)],
    ["Setelah diskon 2", formatRp(after2)],
    ["Hemat total", formatRp(price - end)],
    ["Harga akhir", formatRp(end), true],
  ]);
}

function toCelsius(v, from) {
  if (from === "c") return v;
  if (from === "f") return ((v - 32) * 5) / 9;
  if (from === "k") return v - 273.15;
  return NaN;
}

function fromCelsius(c, to) {
  if (to === "c") return c;
  if (to === "f") return (c * 9) / 5 + 32;
  if (to === "k") return c + 273.15;
  return NaN;
}

function fillUnitSelects() {
  const cat = document.getElementById("unit-cat");
  if (!cat.options.length) {
    for (const [id, pack] of Object.entries(UNITS)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = pack.label;
      cat.appendChild(opt);
    }
  }
  const pack = UNITS[cat.value] || UNITS.panjang;
  const from = document.getElementById("unit-from");
  const to = document.getElementById("unit-to");
  const prevFrom = from.value;
  const prevTo = to.value;
  from.innerHTML = "";
  to.innerHTML = "";
  for (const item of pack.items) {
    const a = document.createElement("option");
    a.value = item.id;
    a.textContent = item.label;
    from.appendChild(a);
    to.appendChild(a.cloneNode(true));
  }
  from.value = pack.items.some((i) => i.id === prevFrom) ? prevFrom : pack.items[0].id;
  to.value = pack.items.some((i) => i.id === prevTo) ? prevTo : pack.items[Math.min(1, pack.items.length - 1)].id;
}

function renderUnit() {
  const cat = document.getElementById("unit-cat").value;
  const pack = UNITS[cat];
  const value = parseId(document.getElementById("unit-value").value);
  const fromId = document.getElementById("unit-from").value;
  const toId = document.getElementById("unit-to").value;
  if (!Number.isFinite(value)) {
    document.getElementById("unit-result").innerHTML = rows([["Hasil", "—"]]);
    return;
  }
  let out;
  if (pack.special) {
    out = fromCelsius(toCelsius(value, fromId), toId);
  } else {
    const from = pack.items.find((i) => i.id === fromId);
    const to = pack.items.find((i) => i.id === toId);
    out = (value * from.to) / to.to;
  }
  const fromLabel = pack.items.find((i) => i.id === fromId)?.label || fromId;
  const toLabel = pack.items.find((i) => i.id === toId)?.label || toId;
  document.getElementById("unit-result").innerHTML = rows([
    [fromLabel, formatId(value, 6)],
    [toLabel, formatId(out, 6), true],
  ]);
}

const TABS = ["calc", "futures", "pph", "diskon", "satuan"];

function showTab(id) {
  const tab = TABS.includes(id) ? id : "calc";
  for (const t of TABS) {
    const panel = document.getElementById(`panel-${t}`);
    const on = t === tab;
    if (panel) {
      panel.hidden = !on;
      panel.classList.toggle("hidden", !on);
    }
    document.querySelector(`.tabs [data-tab="${t}"]`)?.setAttribute("aria-selected", String(on));
  }
  document.getElementById("calc-toggles").hidden = tab !== "calc";
  if (tab === "futures" && typeof renderFutures === "function") renderFutures();
  if (tab === "pph") renderPph();
  if (tab === "diskon") renderDiskon();
  if (tab === "satuan") renderUnit();
  if (location.hash !== `#${tab}`) history.replaceState(null, "", `#${tab}`);
}

function initTools() {
  fillUnitSelects();
  document.querySelector(".tabs").addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-tab]");
    if (btn) showTab(btn.dataset.tab);
  });
  document.getElementById("panel-pph").addEventListener("input", renderPph);
  document.getElementById("panel-pph").addEventListener("change", renderPph);
  document.getElementById("panel-diskon").addEventListener("input", renderDiskon);
  document.getElementById("unit-cat").addEventListener("change", () => {
    fillUnitSelects();
    renderUnit();
  });
  document.getElementById("unit-from").addEventListener("change", renderUnit);
  document.getElementById("unit-to").addEventListener("change", renderUnit);
  document.getElementById("unit-value").addEventListener("input", renderUnit);
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
  showTab(location.hash.slice(1) || "calc");
}

initTools();
