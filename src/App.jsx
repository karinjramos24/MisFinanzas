import React, { useState, useEffect, useMemo, useCallback, Component } from "react";
import {
  Home, BarChart3, Target, Settings, X, AlertTriangle, CheckCircle2, Sparkles,
  ChevronRight, Heart, PiggyBank, ArrowUpRight, ArrowDownRight, Trash2, Edit3,
  Filter, Moon, Sun, Download, Plus, Calendar
} from "lucide-react";

/* ── TOKENS ─────────────────────────────────────────────────────────── */
const TOKENS = {
  paper: "#F6EFFB", paperDark: "#241B33", ink: "#4A3B5C", inkDark: "#EFE4FA",
  emerald: "#7FB99A", emeraldSoft: "#DFF3E8", amber: "#E8A85C", amberSoft: "#FCE9D2",
  red: "#E18AA0", redSoft: "#FBE1E9", line: "#E3D3F2", lineDark: "#3A2C4F",
  lilac: "#C9A8E8", lilacSoft: "#EDE0FA", pink: "#F4C9D9",
};

const CATS_GASTO = [
  "Servicios públicos", "Transporte", "Gastos personales", "Desayunos",
  "Almuerzos", "Fines de semana", "Regalos", "Deudas", "Otros gastos",
];
const CATS_INGRESO = ["Salario", "Prima", "Vacaciones", "Bonificación", "Cesantías", "Independiente", "Regalo", "Inversión", "Otro"];
const METODOS = ["Efectivo", "Débito", "Crédito", "Transferencia"];
const CREDITO_TIPOS = ["Pago inmediato", "Acumula próximo mes", "Diferir en cuotas"];
const DEUDA_TC_TIPOS = ["Pago total de una vez", "Cuotas fijas"];

const CATEGORY_EMOJI = {
  "Servicios públicos": "💡", "Transporte": "🚌", "Gastos personales": "🧴",
  "Desayunos": "🥐", "Almuerzos": "🍱", "Fines de semana": "🌸",
  "Regalos": "🎁", "Deudas": "🏦", "Otros gastos": "✨",
  "Salario": "💼", "Prima": "🎉", "Vacaciones": "🌴",
  "Bonificación": "⭐", "Cesantías": "🏦", "Independiente": "🧵",
  "Regalo": "🎀", "Inversión": "🌱", "Otro": "💫",
};
const catEmoji = (cat) => CATEGORY_EMOJI[cat] || "🌷";

const fmt = (n) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

/* ── PERÍODO POR SALARIO ─────────────────────────────────────────────── */
function buildPeriods(ingresos) {
  const salarios = ingresos.filter((i) => i.categoria === "Salario").map((i) => i.fecha).sort();
  if (salarios.length === 0) return [];
  return salarios.map((fecha, idx) => ({
    key: fecha, inicio: fecha,
    fin: salarios[idx + 1] ? offsetDay(salarios[idx + 1], -1) : null,
    label: periodLabel(fecha),
  }));
}
function offsetDay(iso, days) {
  const d = new Date(iso); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function periodLabel(inicio) {
  const [y, m, d] = inicio.split("-");
  const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${names[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}
function inPeriod(fecha, inicio, fin) {
  if (fecha < inicio) return false;
  if (fin && fecha > fin) return false;
  return true;
}
function getCurrentPeriod(periods) {
  const today = todayISO();
  for (let i = periods.length - 1; i >= 0; i--) {
    if (periods[i].inicio <= today) return periods[i];
  }
  return periods[periods.length - 1] || null;
}
function getPreviousPeriod(periods, current) {
  if (!current) return null;
  const idx = periods.findIndex((p) => p.key === current.key);
  return idx > 0 ? periods[idx - 1] : null;
}

const STORAGE_KEY = "finanzas-data-v1";

/* ── SEED DATA ───────────────────────────────────────────────────────── */
const seedData = () => {
  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const day = (y, m, d) => iso(new Date(y, m, d));
  const y = now.getFullYear(); const m = now.getMonth();
  return {
    ingresos: [
      { id: uid(), fecha: day(y, m-1, 23), valor: 3200000, categoria: "Salario", fuente: "Empleo principal", notas: "" },
      { id: uid(), fecha: day(y, m, 23), valor: 3200000, categoria: "Salario", fuente: "Empleo principal", notas: "" },
    ],
    gastos: [
      { id: uid(), fecha: day(y, m, 24), valor: 180000, categoria: "Servicios públicos", descripcion: "Energía + agua", metodo: "Débito", impulsivo: false, creditoTipo: null, cuotas: null },
      { id: uid(), fecha: day(y, m, 25), valor: 90000, categoria: "Transporte", descripcion: "Recargas", metodo: "Efectivo", impulsivo: false, creditoTipo: null, cuotas: null },
      { id: uid(), fecha: day(y, m, 27), valor: 45000, categoria: "Fines de semana", descripcion: "Cine + comida", metodo: "Crédito", impulsivo: true, creditoTipo: "Pago inmediato", cuotas: null },
      { id: uid(), fecha: day(y, m, 28), valor: 120000, categoria: "Almuerzos", descripcion: "Semana 1", metodo: "Efectivo", impulsivo: false, creditoTipo: null, cuotas: null },
    ],
    ahorros: [{ id: uid(), fecha: day(y, m, 23), valor: 400000, meta: null, observaciones: "Ahorro mensual fijo" }],
    metas: [{ id: uid(), nombre: "Cuota inicial vivienda", monto: 20000000, fecha: "2027-12-31", abonos: [{ id: uid(), fecha: day(y, m, 23), valor: 400000, notas: "Abono inicial" }] }],
    deudas: [{ id: uid(), nombre: "Préstamo banco", montoTotal: 5000000, saldoPendiente: 4000000, abonos: [], fecha: todayISO(), notas: "" }],
    deudasTC: [],
    limites: {
      "Servicios públicos": 220000, "Transporte": 150000, "Gastos personales": 80000,
      "Desayunos": 150000, "Almuerzos": 200000, "Fines de semana": 150000,
      "Regalos": 60000, "Deudas": 200000, "Otros gastos": 100000,
    },
    darkMode: false,
  };
};

/* ── STORAGE ─────────────────────────────────────────────────────────── */
function useStorage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.deudas) parsed.deudas = [];
        if (!parsed.deudasTC) parsed.deudasTC = [];
        if (parsed.metas) {
          parsed.metas = parsed.metas.map((meta) => {
            try {
              if (!Array.isArray(meta.abonos)) {
                const v = typeof meta.ahorroAcumulado === "number" && meta.ahorroAcumulado > 0 ? meta.ahorroAcumulado : 0;
                const abonos = v > 0 ? [{ id: uid(), fecha: meta.fecha || todayISO(), valor: v, notas: "Abono inicial" }] : [];
                const { ahorroAcumulado: _, ...rest } = meta;
                return { ...rest, abonos };
              }
              return { ...meta, abonos: meta.abonos.map((a) => ({ id: a.id || uid(), ...a })) };
            } catch (_) { return { ...meta, abonos: meta.abonos || [] }; }
          });
        }
        setData(parsed);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (_) {}
      } else {
        const seed = seedData();
        setData(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (e) {
      try {
        const rawFallback = localStorage.getItem(STORAGE_KEY);
        if (rawFallback) {
          setData(JSON.parse(rawFallback));
          setError("Hubo un problema al cargar tus datos. Ve a Ajustes y descarga un respaldo por seguridad.");
        } else {
          const seed = seedData();
          setData(seed);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch (_) {}
        }
      } catch (_) {
        setError("No se pudieron cargar tus datos. Por favor recarga la página.");
        setData(seedData());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((next) => {
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setError(null); }
    catch (e) { setError("No se pudo guardar. Tus cambios están en pantalla pero podrían perderse."); }
  }, []);

  return { data, setData: persist, loading, error };
}

/* ── ANALYTICS ───────────────────────────────────────────────────────── */
function useAnalytics(data) {
  return useMemo(() => {
    if (!data) return null;
    const { ingresos, gastos, ahorros, limites, metas } = data;
    const periods = buildPeriods(ingresos);
    const curPeriod = getCurrentPeriod(periods);
    const prevPeriod = getPreviousPeriod(periods, curPeriod);
    const sumIn = (arr) => arr.reduce((s, x) => s + x.valor, 0);
    const byPeriod = (arr, period) => !period ? [] : arr.filter((x) => inPeriod(x.fecha, period.inicio, period.fin));

    const periodicSummary = periods.map((p) => {
      const gastosP = byPeriod(gastos, p);
      const gasReal = gastosP.reduce((s, g) => {
        if (g.metodo === "Crédito" && (g.creditoTipo === "Acumula próximo mes" || g.creditoTipo === "Diferir en cuotas")) return s;
        return s + g.valor;
      }, 0);
      const ing = sumIn(byPeriod(ingresos, p));
      const aho = sumIn(byPeriod(ahorros, p));
      // Abonos a deudas realizados en este período también reducen el saldo disponible
      const abonosDeudas = (data.deudas || []).reduce((s, d) => {
        return s + (d.abonos || []).filter((a) => inPeriod(a.fecha, p.inicio, p.fin || "9999-12-31")).reduce((ss, a) => ss + (Number(a.valor) || 0), 0);
      }, 0);
      const abonosTC = (data.deudasTC || []).reduce((s, d) => {
        return s + (d.abonos || []).filter((a) => inPeriod(a.fecha, p.inicio, p.fin || "9999-12-31")).reduce((ss, a) => ss + (Number(a.valor) || 0), 0);
      }, 0);
      const totalComprometido = gasReal + aho + abonosDeudas + abonosTC;
      return { period: p, ingresos: ing, gastos: gasReal, ahorro: aho, abonosDeudas, abonosTC, libre: ing - totalComprometido };
    });

    const curM = periodicSummary.find((s) => s.period?.key === curPeriod?.key) || { ingresos: 0, gastos: 0, ahorro: 0, libre: 0 };
    const prevM = periodicSummary.find((s) => s.period?.key === prevPeriod?.key) || { ingresos: 0, gastos: 0, ahorro: 0, libre: 0 };

    const curGastosByCat = {};
    byPeriod(gastos, curPeriod).forEach((g) => {
      if (g.metodo === "Crédito" && (g.creditoTipo === "Acumula próximo mes" || g.creditoTipo === "Diferir en cuotas")) return;
      curGastosByCat[g.categoria] = (curGastosByCat[g.categoria] || 0) + g.valor;
    });
    const prevGastosByCat = {};
    byPeriod(gastos, prevPeriod).forEach((g) => {
      if (g.metodo === "Crédito" && (g.creditoTipo === "Acumula próximo mes" || g.creditoTipo === "Diferir en cuotas")) return;
      prevGastosByCat[g.categoria] = (prevGastosByCat[g.categoria] || 0) + g.valor;
    });

    const creditoAcumulado = byPeriod(gastos, curPeriod).filter((g) => g.metodo === "Crédito" && g.creditoTipo === "Acumula próximo mes");
    const totalAcumulado = sumIn(creditoAcumulado);
    const cuotasPendientes = byPeriod(gastos, curPeriod).filter((g) => g.metodo === "Crédito" && g.creditoTipo === "Diferir en cuotas").reduce((s, g) => s + g.valor, 0);

    const catRanking = Object.entries(curGastosByCat).sort((a, b) => b[1] - a[1]);
    const topCat = catRanking[0] || null;
    const last3 = periodicSummary.slice(-4, -1);
    const avgAhorro3 = last3.length ? last3.reduce((s, m) => s + m.ahorro, 0) / last3.length : 0;

    const impulsivos = byPeriod(gastos, curPeriod).filter((g) => g.impulsivo);
    const impulsivoTotal = sumIn(impulsivos);
    const impulsivoPct = curM.gastos > 0 ? (impulsivoTotal / curM.gastos) * 100 : 0;
    const small = byPeriod(gastos, curPeriod).filter((g) => g.valor > 0 && g.valor <= 25000);
    const smallTotal = sumIn(small);

    const limiteStatus = Object.entries(limites || {}).map(([cat, limite]) => {
      const gastado = curGastosByCat[cat] || 0;
      const pct = limite > 0 ? (gastado / limite) * 100 : 0;
      return { categoria: cat, limite, gastado, pct };
    });

    const tasaAhorro = curM.ingresos > 0 ? (curM.ahorro / curM.ingresos) * 100 : 0;
    const pctGastoSobreIngreso = curM.ingresos > 0 ? (curM.gastos / curM.ingresos) * 100 : 0;
    const librePct = curM.ingresos > 0 ? (curM.libre / curM.ingresos) * 100 : 0;

    const capacidadAhorro = last3.length > 0 ? last3.reduce((s, m) => s + Math.max(m.ahorro, 0), 0) / last3.length : Math.max(curM.ahorro, 0);
    const totalDeudas = (data.deudas || []).reduce((s, d) => s + d.saldoPendiente, 0) + (data.deudasTC || []).reduce((s, d) => s + d.saldoPendiente, 0);
    const deudaVsCapacidad = capacidadAhorro > 0 ? totalDeudas / (capacidadAhorro * 12) : null;

    const restantesPorMeta = (metas || []).map((meta) => {
      const abonos = Array.isArray(meta.abonos) ? meta.abonos : [];
      const acum = abonos.reduce((s, a) => s + (Number(a.valor) || 0), 0);
      return Math.max((meta.monto || 0) - acum, 0);
    });
    const totalRestante = restantesPorMeta.reduce((s, r) => s + r, 0);

    const metasConProyeccion = (metas || []).map((meta, idx) => {
      try {
        const abonos = Array.isArray(meta.abonos) ? meta.abonos : [];
        const ahorroAcumulado = abonos.reduce((s, a) => s + (Number(a.valor) || 0), 0);
        const restante = restantesPorMeta[idx];
        const pct = meta.monto > 0 ? Math.min((ahorroAcumulado / meta.monto) * 100, 100) : 0;

        let cuotaSugerida = null, mesesHastaFecha = null;
        if (meta.fecha && restante > 0) {
          const diffMs = new Date(meta.fecha) - new Date();
          mesesHastaFecha = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)), 1);
          cuotaSugerida = Math.ceil(restante / mesesHastaFecha);
        }

        const peso = totalRestante > 0 ? restante / totalRestante : (metas.length > 0 ? 1 / metas.length : 1);
        const cuotaProporcional = Math.ceil(capacidadAhorro * peso);
        const cuotaRecomendada = cuotaProporcional;
        const mesesConCapacidad = cuotaRecomendada > 0 ? Math.ceil(restante / cuotaRecomendada) : null;

        const cuotaBase = cuotaSugerida || cuotaProporcional;
        let deficitAcumulado = 0, cuotaAjustada = null;
        if (abonos.length > 0 && cuotaBase > 0) {
          const diff = cuotaBase - (Number(abonos[abonos.length - 1].valor) || 0);
          if (diff > 0) { deficitAcumulado = diff; cuotaAjustada = Math.ceil(cuotaBase + diff); }
        }

        let viabilidad = "viable", mensajeAsesor = "";
        if (capacidadAhorro <= 0) {
          viabilidad = "critica"; mensajeAsesor = "⚠️ Registra ahorros para calcular tu capacidad.";
        } else if (cuotaProporcional > 0 && cuotaSugerida && cuotaSugerida > cuotaProporcional * 1.5) {
          viabilidad = "ajustada"; mensajeAsesor = `💡 La cuota para tu fecha meta ($${fmt(cuotaSugerida)}) supera lo que te corresponde ($${fmt(cuotaProporcional)}). Considera extender el plazo.`;
        } else {
          viabilidad = "viable"; mensajeAsesor = `✅ Meta viable. Aportando $${fmt(cuotaRecomendada)}/período la lograrías en ~${mesesConCapacidad} períodos.`;
        }

        return { ...meta, abonos, ahorroAcumulado, restante, pct, cuotaSugerida, mesesHastaFecha, deficitAcumulado, cuotaAjustada, cuotaRecomendada, mesesConCapacidad, cuotaProporcional, peso, viabilidad, mensajeAsesor, capacidadAhorro };
      } catch (_) {
        return { ...meta, abonos: [], ahorroAcumulado: 0, restante: meta.monto || 0, pct: 0, cuotaSugerida: null, mesesHastaFecha: null, deficitAcumulado: 0, cuotaAjustada: null, cuotaRecomendada: null, mesesConCapacidad: null, viabilidad: "viable", mensajeAsesor: "", capacidadAhorro: 0 };
      }
    });

    const recs = [];
    limiteStatus.forEach((l) => {
      if (l.pct >= 100) recs.push({ tipo: "critico", texto: `Superaste el límite de ${l.categoria} este período.` });
      else if (l.pct >= 80) recs.push({ tipo: "alerta", texto: `Cerca del límite en ${l.categoria}: ${Math.round(l.pct)}% usado.` });
    });
    if (prevPeriod) {
      Object.entries(curGastosByCat).forEach(([cat, val]) => {
        const prev = prevGastosByCat[cat] || 0;
        if (prev > 0 && val > prev * 1.2) recs.push({ tipo: "info", texto: `${cat} subió ${Math.round(((val-prev)/prev)*100)}% vs período anterior.` });
      });
    }
    if (avgAhorro3 > 0 && curM.ahorro < avgAhorro3) recs.push({ tipo: "alerta", texto: `Ahorraste menos que el promedio reciente ($${fmt(curM.ahorro)} vs $${fmt(avgAhorro3)}).` });
    if (impulsivoPct > 25) recs.push({ tipo: "alerta", texto: `Gastos impulsivos: ${Math.round(impulsivoPct)}% de lo gastado.` });
    if (small.length >= 4) recs.push({ tipo: "info", texto: `${small.length} "gastos hormiga" suman $${fmt(smallTotal)}.` });
    if (curM.ingresos > 0 && librePct < 10) recs.push({ tipo: "critico", texto: `Margen libre bajo (${Math.round(librePct)}%). Ajusta gastos variables.` });
    if (totalAcumulado > 0) recs.push({ tipo: "alerta", texto: `$${fmt(totalAcumulado)} de crédito llegarán al próximo período.` });
    metasConProyeccion.forEach((m) => {
      if (m.pct >= 100) recs.push({ tipo: "exito", texto: `¡Cumpliste la meta "${m.nombre}"! 🎉` });
    });
    if (topCat && curM.ingresos > 0) {
      const p = (topCat[1] / curM.ingresos) * 100;
      if (p > 15) recs.push({ tipo: "info", texto: `${topCat[0]} es tu mayor gasto: ${Math.round(p)}% del ingreso.` });
    }

    const anyOver100 = limiteStatus.some((l) => l.pct >= 100);
    const anyOver80 = limiteStatus.some((l) => l.pct >= 80);
    let semaforo = "verde";
    if (anyOver100 || librePct < 5) semaforo = "rojo";
    else if (anyOver80 || librePct < 15) semaforo = "amarillo";

    return {
      periods, periodicSummary, curPeriod, prevPeriod, curM, prevM,
      curGastosByCat, prevGastosByCat, catRanking, topCat,
      avgAhorro3, impulsivoTotal, impulsivoPct, smallTotal, smallCount: small.length,
      totalAcumulado, cuotasPendientes, limiteStatus, tasaAhorro, pctGastoSobreIngreso,
      libre: curM.libre, librePct, metasConProyeccion, recs, semaforo,
      capacidadAhorro, totalDeudas, deudaVsCapacidad,
    };
  }, [data]);
}

/* ── UI ATOMS ────────────────────────────────────────────────────────── */
function Ring({ pct, size = 64, stroke = 7, color, trackColor }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(pct, 100)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-t-[28px] max-h-[88vh] overflow-y-auto pb-8 animate-[slideUp_0.25s_ease-out]">
        <div className="sticky top-0 bg-[var(--paper)] pt-3 pb-2 px-5 flex items-center justify-between border-b border-[var(--line)]">
          <div className="w-8" />
          <h2 className="font-display text-lg" style={{ color: "var(--ink)" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: "var(--ink)" }} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-utility uppercase tracking-wide mb-1.5" style={{ color: "var(--ink)", opacity: 0.6 }}>{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-xl px-3.5 py-3 text-[15px] font-utility outline-none border transition-colors";
function TextInput(props) { return <input {...props} className={inputClass} style={{ background: "var(--input-bg)", borderColor: "var(--line)", color: "var(--ink)", ...props.style }} />; }
function SelectInput({ children, ...props }) { return <select {...props} className={inputClass} style={{ background: "var(--input-bg)", borderColor: "var(--line)", color: "var(--ink)" }}>{children}</select>; }

/* ── ADD MOVEMENT SHEET ──────────────────────────────────────────────── */
function AddMovementSheet({ open, onClose, type, onSave, initialData, metas, onAgregarAbonoMeta }) {
  const [fecha, setFecha] = useState(todayISO());
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState(type === "gasto" ? CATS_GASTO[0] : type === "ingreso" ? CATS_INGRESO[0] : "");
  const [customCatName, setCustomCatName] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [metodo, setMetodo] = useState(METODOS[0]);
  const [impulsivo, setImpulsivo] = useState(false);
  const [creditoTipo, setCreditoTipo] = useState(CREDITO_TIPOS[0]);
  const [cuotas, setCuotas] = useState("");
  const [metaSeleccionada, setMetaSeleccionada] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFecha(initialData.fecha || todayISO());
        setValor(String(initialData.valor || ""));
        setCategoria(initialData.categoria || (type === "gasto" ? CATS_GASTO[0] : CATS_INGRESO[0]));
        setDescripcion(initialData.descripcion || initialData.fuente || initialData.observaciones || "");
        setMetodo(initialData.metodo || METODOS[0]);
        setImpulsivo(initialData.impulsivo || false);
        setCreditoTipo(initialData.creditoTipo || CREDITO_TIPOS[0]);
        setCuotas(initialData.cuotas ? String(initialData.cuotas) : "");
        setCustomCatName(""); setMetaSeleccionada("");
      } else {
        setFecha(todayISO()); setValor("");
        setCategoria(type === "gasto" ? CATS_GASTO[0] : type === "ingreso" ? CATS_INGRESO[0] : "");
        setCustomCatName(""); setDescripcion("");
        setMetodo(METODOS[0]); setCreditoTipo(CREDITO_TIPOS[0]); setCuotas(""); setImpulsivo(false); setMetaSeleccionada("");
      }
    }
  }, [open, type, initialData]);

  if (!open) return null;
  const isEditing = !!initialData;

  const handleSubmit = () => {
    const num = parseFloat(valor);
    if (!num || num <= 0) return;
    const finalCat = categoria === "Otros gastos" && customCatName.trim() ? customCatName.trim() : categoria;
    const baseId = initialData?.id || uid();
    if (type === "gasto") {
      onSave({ id: baseId, fecha, valor: num, categoria: finalCat, descripcion, metodo, impulsivo,
        creditoTipo: metodo === "Crédito" ? creditoTipo : null,
        cuotas: metodo === "Crédito" && creditoTipo === "Diferir en cuotas" ? parseInt(cuotas) || null : null });
    } else if (type === "ingreso") {
      onSave({ id: baseId, fecha, valor: num, categoria, fuente: descripcion, notas: "" });
    } else {
      const ahorroItem = { id: baseId, fecha, valor: num, meta: metaSeleccionada || null, observaciones: descripcion };
      // Pasar metaSeleccionada para que el handler lo haga todo en un solo updateAndSave
      onSave(ahorroItem, metaSeleccionada || null);
    }
    onClose();
  };

  const title = isEditing
    ? (type === "gasto" ? "Editar gasto" : type === "ingreso" ? "Editar ingreso" : "Editar ahorro")
    : (type === "gasto" ? "Nuevo gasto" : type === "ingreso" ? "Nuevo ingreso" : "Nuevo ahorro");

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <Field label="Fecha"><TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
      <Field label="Valor (COP)"><TextInput type="number" inputMode="decimal" placeholder="0" value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
      {type === "gasto" && (
        <>
          <Field label="Categoría">
            <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATS_GASTO.map((c) => <option key={c} value={c}>{catEmoji(c)} {c}</option>)}
            </SelectInput>
          </Field>
          {categoria === "Otros gastos" && (
            <Field label="Nombre del gasto"><TextInput value={customCatName} onChange={(e) => setCustomCatName(e.target.value)} placeholder="Ej: Mascota" /></Field>
          )}
          <Field label="Descripción"><TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" /></Field>
          <Field label="Método de pago">
            <SelectInput value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectInput>
          </Field>
          {metodo === "Crédito" && (
            <>
              <Field label="💳 ¿Cómo se paga este crédito?">
                <SelectInput value={creditoTipo} onChange={(e) => setCreditoTipo(e.target.value)}>
                  {CREDITO_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectInput>
              </Field>
              {creditoTipo === "Diferir en cuotas" && (
                <Field label="Número de cuotas"><TextInput type="number" inputMode="numeric" placeholder="Ej: 3" value={cuotas} onChange={(e) => setCuotas(e.target.value)} /></Field>
              )}
            </>
          )}
          <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
            <input type="checkbox" checked={impulsivo} onChange={(e) => setImpulsivo(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-utility" style={{ color: "var(--ink)" }}>Fue un gasto impulsivo</span>
          </label>
        </>
      )}
      {type === "ingreso" && (
        <>
          <Field label="Categoría">
            <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATS_INGRESO.map((c) => <option key={c} value={c}>{catEmoji(c)} {c}</option>)}
            </SelectInput>
          </Field>
          <Field label="Fuente / notas"><TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" /></Field>
        </>
      )}
      {type === "ahorro" && (
        <>
          {metas && metas.length > 0 && (
            <Field label="¿A qué meta vas a abonar? (opcional)">
              <SelectInput value={metaSeleccionada} onChange={(e) => setMetaSeleccionada(e.target.value)}>
                <option value="">Sin meta específica</option>
                {metas.filter((m) => {
                  const abonos = Array.isArray(m.abonos) ? m.abonos : [];
                  const acum = abonos.reduce((s, a) => s + (Number(a.valor) || 0), 0);
                  return acum < m.monto;
                }).map((m) => <option key={m.id} value={m.id}>🌸 {m.nombre}</option>)}
              </SelectInput>
              {metaSeleccionada && <p className="text-[11px] font-utility mt-1.5 opacity-70" style={{ color: "var(--emerald)" }}>✅ El abono se registrará automáticamente en esta meta</p>}
            </Field>
          )}
          <Field label="Observaciones"><TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" /></Field>
        </>
      )}
      <button onClick={handleSubmit} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px] active:scale-[0.98] transition-transform" style={{ background: "var(--lilac)", color: "#FFFFFF" }}>
        {isEditing ? "Guardar cambios ✅" : "Guardar movimiento"}
      </button>
    </Sheet>
  );
}

/* ── SEMÁFORO ────────────────────────────────────────────────────────── */
function SemaforoBadge({ semaforo }) {
  const map = {
    verde: { color: "var(--emerald)", label: "Vas genial", emoji: "🌷", bg: "var(--emerald-soft)" },
    amarillo: { color: "var(--amber)", label: "Ojo aquí", emoji: "🌼", bg: "var(--amber-soft)" },
    rojo: { color: "var(--red)", label: "Necesita mimos", emoji: "🌺", bg: "var(--red-soft)" },
  };
  const s = map[semaforo];
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: s.bg }}>
      <span className="text-xs">{s.emoji}</span>
      <span className="text-xs font-utility font-medium" style={{ color: s.color }}>{s.label}</span>
    </div>
  );
}

/* ── DASHBOARD ───────────────────────────────────────────────────────── */
function RecCard({ rec }) {
  const cfg = {
    critico: { icon: <AlertTriangle size={16} />, color: "var(--red)", bg: "var(--red-soft)" },
    alerta: { icon: <AlertTriangle size={16} />, color: "var(--amber)", bg: "var(--amber-soft)" },
    exito: { icon: <CheckCircle2 size={16} />, color: "var(--emerald)", bg: "var(--emerald-soft)" },
    info: { icon: <Sparkles size={16} />, color: "var(--ink)", bg: "var(--card-alt)" },
  }[rec.tipo] || { icon: <Sparkles size={16} />, color: "var(--ink)", bg: "var(--card-alt)" };
  return (
    <div className="rounded-[16px] p-3.5 flex items-start gap-2.5" style={{ background: cfg.bg }}>
      <span style={{ color: cfg.color, marginTop: 1 }}>{cfg.icon}</span>
      <p className="text-[13.5px] font-utility leading-snug flex-1" style={{ color: "var(--ink)" }}>{rec.texto}</p>
    </div>
  );
}

function MetaPreview({ meta }) {
  return (
    <div className="rounded-[18px] p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-utility font-medium text-sm" style={{ color: "var(--ink)" }}>{meta.nombre}</span>
        <span className="font-mono text-xs font-semibold" style={{ color: "var(--emerald)" }}>{Math.round(meta.pct)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--line)" }}>
        <div className="h-full rounded-full" style={{ width: `${meta.pct}%`, background: "var(--lilac)" }} />
      </div>
      <div className="flex items-center justify-between text-xs font-utility opacity-70" style={{ color: "var(--ink)" }}>
        <span>${fmt(meta.ahorroAcumulado || 0)} de ${fmt(meta.monto)}</span>
        {meta.mesesConCapacidad != null && <span>~{meta.mesesConCapacidad} períodos</span>}
      </div>
    </div>
  );
}

function Dashboard({ analytics, onNavigate }) {
  if (!analytics) return null;
  const { curM, tasaAhorro, libre, semaforo, recs, metasConProyeccion, totalAcumulado, cuotasPendientes } = analytics;
  const topRecs = recs.slice(0, 3);
  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-utility uppercase tracking-wide opacity-60" style={{ color: "var(--ink)" }}>
            {analytics.curPeriod ? `Desde el ${periodLabel(analytics.curPeriod.inicio)}` : "Sin período activo"}
          </p>
          <h1 className="font-display text-[28px] leading-tight" style={{ color: "var(--ink)" }}>Tu mes en bonito ✨</h1>
          {curM.ingresos > 0 && <p className="text-xs font-utility mt-0.5" style={{ color: "var(--emerald)", opacity: 0.8 }}>💰 Total ingresado: ${fmt(curM.ingresos)}</p>}
        </div>
        <SemaforoBadge semaforo={semaforo} />
      </div>

      <div className="rounded-[24px] p-5 flex items-center gap-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="relative flex-shrink-0">
          <Ring pct={Math.max(analytics.librePct, 0)} size={84} stroke={8}
            color={semaforo === "rojo" ? "var(--red)" : semaforo === "amarillo" ? "var(--amber)" : "var(--emerald)"} trackColor="var(--line)" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={26} style={{ color: "var(--ink)", opacity: 0.5 }} fill="var(--pink)" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-utility opacity-60" style={{ color: "var(--ink)" }}>Saldo libre del período</p>
          <p className="font-mono text-2xl font-semibold tabular-nums" style={{ color: "var(--ink)" }}>${fmt(libre)}</p>
          <p className="text-xs font-utility opacity-60 mt-0.5" style={{ color: "var(--ink)" }}>{Math.round(analytics.librePct)}% de tu ingreso disponible</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: <ArrowUpRight size={16} />, label: "Ingresos", value: curM.ingresos, color: "var(--emerald)" },
          { icon: <ArrowDownRight size={16} />, label: "Gastos", value: curM.gastos, color: "var(--red)" },
          { icon: <PiggyBank size={16} />, label: "Ahorro", value: curM.ahorro, color: "var(--amber)" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-[18px] p-3.5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="mb-2" style={{ color }}>{icon}</div>
            <p className="text-[10px] font-utility uppercase tracking-wide opacity-60 mb-0.5" style={{ color: "var(--ink)" }}>{label}</p>
            <p className="font-mono text-[15px] font-semibold tabular-nums leading-tight" style={{ color: "var(--ink)" }}>${fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-utility uppercase tracking-wide opacity-60" style={{ color: "var(--ink)" }}>Tasa de ahorro</span>
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--emerald)" }}>{Math.round(tasaAhorro)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(tasaAhorro, 100)}%`, background: "var(--emerald)" }} />
        </div>
      </div>

      {(totalAcumulado > 0 || cuotasPendientes > 0) && (
        <div className="rounded-[20px] p-4" style={{ background: "var(--amber-soft)", border: "1px solid var(--amber)" }}>
          <p className="text-xs font-utility font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--amber)" }}>💳 Lo que llega al próximo período</p>
          {totalAcumulado > 0 && <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}><span className="opacity-70">Crédito acumulado</span><span className="font-semibold" style={{ color: "var(--amber)" }}>${fmt(totalAcumulado)}</span></div>}
          {cuotasPendientes > 0 && <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}><span className="opacity-70">Cuotas diferidas</span><span className="font-semibold" style={{ color: "var(--amber)" }}>${fmt(cuotasPendientes)}</span></div>}
          <div className="flex justify-between text-xs font-utility pt-2 mt-1" style={{ color: "var(--ink)", borderTop: "1px solid var(--amber)" }}>
            <span className="font-semibold opacity-70">Total pendiente</span>
            <span className="font-semibold" style={{ color: "var(--red)" }}>${fmt(totalAcumulado + cuotasPendientes)}</span>
          </div>
        </div>
      )}

      {topRecs.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[17px]" style={{ color: "var(--ink)" }}>Consejos para ti</h3>
            <button onClick={() => onNavigate("analisis")} className="text-xs font-utility flex items-center gap-0.5" style={{ color: "var(--emerald)" }}>Ver todos <ChevronRight size={14} /></button>
          </div>
          {topRecs.map((r, i) => <RecCard key={i} rec={r} />)}
        </div>
      )}

      {metasConProyeccion.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-display text-[17px]" style={{ color: "var(--ink)" }}>Metas de ahorro</h3>
          {metasConProyeccion.slice(0, 2).map((m) => <MetaPreview key={m.id} meta={m} />)}
        </div>
      )}
    </div>
  );
}

/* ── HISTORY ─────────────────────────────────────────────────────────── */
function History({ data, onDelete, onEdit }) {
  const [filterType, setFilterType] = useState("todos");
  const [filterCat, setFilterCat] = useState("todas");
  const [showFilters, setShowFilters] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const all = useMemo(() => {
    const items = [
      ...data.ingresos.map((i) => ({ ...i, tipo: "ingreso" })),
      ...data.gastos.map((g) => ({ ...g, tipo: "gasto" })),
      ...data.ahorros.map((a) => ({ ...a, tipo: "ahorro" })),
    ];
    return items.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [data]);

  const allCats = useMemo(() => {
    const s = new Set();
    data.gastos.forEach((g) => s.add(g.categoria));
    data.ingresos.forEach((i) => s.add(i.categoria));
    return Array.from(s);
  }, [data]);

  const filtered = all.filter((x) => {
    if (filterType !== "todos" && x.tipo !== filterType) return false;
    if (filterCat !== "todas" && x.categoria !== filterCat) return false;
    return true;
  });

  const typeConfig = {
    ingreso: { color: "var(--emerald)", icon: <ArrowUpRight size={15} />, sign: "+" },
    gasto: { color: "var(--red)", icon: <ArrowDownRight size={15} />, sign: "−" },
    ahorro: { color: "var(--amber)", icon: <PiggyBank size={15} />, sign: "→" },
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Historial</h1>
        <button onClick={() => setShowFilters((s) => !s)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <Filter size={16} style={{ color: "var(--ink)" }} />
        </button>
      </div>
      {showFilters && (
        <div className="flex gap-2">
          <SelectInput value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1">
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
            <option value="ahorro">Ahorros</option>
          </SelectInput>
          <SelectInput value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="flex-1">
            <option value="todas">Todas las categorías</option>
            {allCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="text-center py-16"><p className="font-utility text-sm opacity-50" style={{ color: "var(--ink)" }}>Nada que mostrar todavía.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((x) => {
            const cfg = typeConfig[x.tipo];
            return (
              <div key={x.id} className="rounded-[16px] p-3.5 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--card-alt)", color: cfg.color }}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-utility text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                    {x.categoria ? `${catEmoji(x.categoria)} ${x.categoria}` : (x.fuente || x.observaciones || "Movimiento")}
                  </p>
                  <p className="text-xs font-utility opacity-55" style={{ color: "var(--ink)" }}>
                    {x.fecha} {x.metodo ? `· ${x.metodo}` : ""} {x.creditoTipo ? `· ${x.creditoTipo}` : ""} {x.impulsivo ? "· Impulsivo" : ""}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold flex-shrink-0" style={{ color: cfg.color }}>{cfg.sign}${fmt(x.valor)}</span>
                <button onClick={() => setEditItem(x)} className="flex-shrink-0 opacity-50 mr-1"><Edit3 size={15} style={{ color: "var(--lilac)" }} /></button>
                <button onClick={() => onDelete(x.tipo, x.id)} className="flex-shrink-0 opacity-40"><Trash2 size={15} style={{ color: "var(--ink)" }} /></button>
              </div>
            );
          })}
        </div>
      )}
      {editItem && (
        <AddMovementSheet open={!!editItem} onClose={() => setEditItem(null)} type={editItem.tipo} initialData={editItem}
          onSave={(updated) => { onEdit(editItem.tipo, updated); setEditItem(null); }} />
      )}
    </div>
  );
}

/* ── ANALYSIS ────────────────────────────────────────────────────────── */
function Analysis({ analytics }) {
  if (!analytics) return null;
  const { periodicSummary, catRanking, curM, limiteStatus, recs, impulsivoPct, smallTotal, smallCount, totalAcumulado, cuotasPendientes } = analytics;
  const maxVal = Math.max(...periodicSummary.map((s) => Math.max(s.ingresos, s.gastos)), 1);

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Análisis</h1>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Ingresos vs. gastos por período 💸</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {periodicSummary.slice(-6).map((s) => (
            <div key={s.period.key}>
              <div className="flex justify-between text-xs font-utility mb-1 opacity-70" style={{ color: "var(--ink)" }}>
                <span>{periodLabel(s.period.inicio)}</span>
                <span className="font-mono">${fmt(s.libre)} libre</span>
              </div>
              <div className="h-2.5 rounded-full mb-1" style={{ width: `${(s.ingresos / maxVal) * 100}%`, background: "var(--emerald)", minWidth: 4 }} />
              <div className="h-2.5 rounded-full" style={{ width: `${(s.gastos / maxVal) * 100}%`, background: "var(--red)", minWidth: 4 }} />
            </div>
          ))}
          <div className="flex gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-utility opacity-70" style={{ color: "var(--ink)" }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--emerald)" }} /> Ingresos</span>
            <span className="flex items-center gap-1.5 text-xs font-utility opacity-70" style={{ color: "var(--ink)" }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--red)" }} /> Gastos</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Gasto por categoría</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {catRanking.length === 0 && <p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Sin gastos registrados este período.</p>}
          {catRanking.map(([cat, val]) => {
            const pct = curM.ingresos > 0 ? (val / curM.ingresos) * 100 : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}>
                  <span className="opacity-80">{catEmoji(cat)} {cat}</span>
                  <span className="font-mono opacity-70">${fmt(val)} · {Math.round(pct)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct * 2, 100)}%`, background: "var(--amber)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Presupuesto vs. real</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {limiteStatus.map((l) => {
            const color = l.pct >= 100 ? "var(--red)" : l.pct >= 80 ? "var(--amber)" : "var(--emerald)";
            return (
              <div key={l.categoria}>
                <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}>
                  <span className="opacity-80">{catEmoji(l.categoria)} {l.categoria}</span>
                  <span className="font-mono opacity-70">${fmt(l.gastado)} / ${fmt(l.limite)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(l.pct, 100)}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Comportamiento</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] p-3.5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="text-[10px] font-utility uppercase tracking-wide opacity-60 mb-1" style={{ color: "var(--ink)" }}>Gasto impulsivo</p>
            <p className="font-mono text-lg font-semibold" style={{ color: "var(--ink)" }}>{Math.round(impulsivoPct)}%</p>
          </div>
          <div className="rounded-[18px] p-3.5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <p className="text-[10px] font-utility uppercase tracking-wide opacity-60 mb-1" style={{ color: "var(--ink)" }}>Gastos hormiga</p>
            <p className="font-mono text-lg font-semibold" style={{ color: "var(--ink)" }}>${fmt(smallTotal)}</p>
            <p className="text-[11px] font-utility opacity-50" style={{ color: "var(--ink)" }}>{smallCount} movimientos</p>
          </div>
          {(totalAcumulado + cuotasPendientes) > 0 && (
            <div className="rounded-[18px] p-3.5 col-span-2" style={{ background: "var(--amber-soft)", border: "1px solid var(--amber)" }}>
              <p className="text-[10px] font-utility uppercase tracking-wide opacity-70 mb-2" style={{ color: "var(--ink)" }}>💳 Deuda pendiente próximo período</p>
              {totalAcumulado > 0 && <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}><span className="opacity-70">Crédito acumulado</span><span className="font-semibold" style={{ color: "var(--amber)" }}>${fmt(totalAcumulado)}</span></div>}
              {cuotasPendientes > 0 && <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}><span className="opacity-70">Cuotas diferidas</span><span className="font-semibold" style={{ color: "var(--amber)" }}>${fmt(cuotasPendientes)}</span></div>}
              <div className="flex justify-between text-xs font-utility mt-1.5 pt-1.5" style={{ color: "var(--ink)", borderTop: "1px solid var(--amber)" }}>
                <span className="font-semibold">Total</span>
                <span className="font-semibold" style={{ color: "var(--red)" }}>${fmt(totalAcumulado + cuotasPendientes)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Todos los consejos</h3>
        <div className="space-y-2.5">
          {recs.length === 0
            ? <p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Sin recomendaciones por ahora.</p>
            : recs.map((r, i) => <RecCard key={i} rec={r} />)}
        </div>
      </section>
    </div>
  );
}

/* ── VIABILIDAD BADGE ────────────────────────────────────────────────── */
function ViabilidadBadge({ viabilidad }) {
  const map = {
    viable: { color: "var(--emerald)", bg: "var(--emerald-soft)", label: "✅ Viable" },
    ajustada: { color: "var(--amber)", bg: "var(--amber-soft)", label: "⚠️ Ajustada" },
    critica: { color: "var(--red)", bg: "var(--red-soft)", label: "🚨 Capacidad limitada" },
  };
  const v = map[viabilidad] || map.viable;
  return <span className="text-[10px] font-utility font-semibold px-2 py-0.5 rounded-full" style={{ background: v.bg, color: v.color }}>{v.label}</span>;
}

/* ── ERROR BOUNDARY ──────────────────────────────────────────────────── */
class MetasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="px-5 pt-10 pb-4 text-center space-y-4">
          <p className="text-3xl">🛠️</p>
          <p className="font-display text-lg" style={{ color: "var(--ink)" }}>Algo salió mal en Metas</p>
          <p className="text-xs font-utility opacity-60 leading-relaxed" style={{ color: "var(--ink)" }}>{this.state.error?.message || "Error desconocido"}</p>
          <button onClick={() => { try { const raw = localStorage.getItem("finanzas-data-v1"); if (raw) { const d = JSON.parse(raw); d.metas = (d.metas || []).map((m) => ({ ...m, abonos: Array.isArray(m.abonos) ? m.abonos.map((a, i) => ({ id: a.id || `ab-${i}`, fecha: a.fecha || todayISO(), valor: Number(a.valor) || 0 })) : [] })); localStorage.setItem("finanzas-data-v1", JSON.stringify(d)); } } catch(e) {} window.location.reload(); }} className="w-full rounded-xl py-3 font-utility font-semibold text-sm" style={{ background: "var(--lilac)", color: "#fff" }}>🔧 Reparar y recargar</button>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="w-full rounded-xl py-3 font-utility text-sm opacity-60" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── GOALS & LIMITS ──────────────────────────────────────────────────── */
function GoalsAndLimits({ data, analytics, onAddMeta, onEditarMeta, onAgregarAbono, onEditarAbono, onEliminarAbono, onDeleteMeta, onUpdateLimit }) {
  const [showAddMeta, setShowAddMeta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaMeta, setFechaMeta] = useState("");
  const [editMeta, setEditMeta] = useState(null);
  const [abonoValues, setAbonoValues] = useState({});
  const [expandedMeta, setExpandedMeta] = useState(null);
  const [expandedAbonos, setExpandedAbonos] = useState({});
  const [editAbono, setEditAbono] = useState(null);

  const capacidadAhorro = analytics?.capacidadAhorro || 0;
  const totalDeudas = analytics?.totalDeudas || 0;
  const deudaVsCapacidad = analytics?.deudaVsCapacidad;

  const handleAddMeta = () => {
    const m = parseFloat(monto);
    if (!nombre.trim() || !m || m <= 0) return;
    onAddMeta({ id: uid(), nombre: nombre.trim(), monto: m, fecha: fechaMeta || null, abonos: [] });
    setNombre(""); setMonto(""); setFechaMeta(""); setShowAddMeta(false);
  };

  const handleGuardarEditMeta = () => {
    if (!editMeta) return;
    const m = parseFloat(editMeta.monto);
    if (!editMeta.nombre.trim() || !m || m <= 0) return;
    onEditarMeta(editMeta.id, { nombre: editMeta.nombre.trim(), monto: m, fecha: editMeta.fecha || null });
    setEditMeta(null);
  };

  const handleAbono = (metaId) => {
    const val = parseFloat(abonoValues[metaId]);
    if (!val || val <= 0) return;
    onAgregarAbono(metaId, { valor: val });
    setAbonoValues((prev) => ({ ...prev, [metaId]: "" }));
  };

  const handleGuardarEdicion = () => {
    if (!editAbono) return;
    const val = parseFloat(editAbono.valor);
    if (!val || val <= 0) return;
    onEditarAbono(editAbono.metaId, editAbono.abonoId, val, editAbono.fecha);
    setEditAbono(null);
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Metas y límites 🌸</h1>

      <div className="rounded-[20px] p-4" style={{ background: "var(--lilac-soft)", border: "1px solid var(--lilac)" }}>
        <p className="text-xs font-utility font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--lilac)" }}>🧠 Tu capacidad de ahorro estimada</p>
        <p className="font-mono text-2xl font-semibold mb-1" style={{ color: "var(--ink)" }}>${fmt(capacidadAhorro)}<span className="text-sm font-utility opacity-50"> /período</span></p>
        <p className="text-xs font-utility opacity-60" style={{ color: "var(--ink)" }}>Promedio de lo que realmente ahorraste en períodos anteriores.</p>
        {totalDeudas > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--lilac)" }}>
            <p className="text-xs font-utility opacity-70 mb-1" style={{ color: "var(--ink)" }}>📋 Total deudas: <span className="font-semibold" style={{ color: "var(--red)" }}>${fmt(totalDeudas)}</span>{deudaVsCapacidad != null && ` · ~${deudaVsCapacidad.toFixed(1)} años para liquidarlas`}</p>
          </div>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[16px]" style={{ color: "var(--ink)" }}>Metas de ahorro</h3>
          <button onClick={() => setShowAddMeta(true)} className="flex items-center gap-1 text-xs font-utility font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
            <Plus size={14} /> Nueva
          </button>
        </div>
        <div className="space-y-4">
          {(analytics?.metasConProyeccion || []).map((m) => (
            <div key={m.id} className="rounded-[20px] p-4" style={{ background: "var(--card)", border: `1px solid ${m.viabilidad === "critica" ? "var(--red)" : m.viabilidad === "ajustada" ? "var(--amber)" : "var(--line)"}` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-utility font-semibold text-sm" style={{ color: "var(--ink)" }}>{m.nombre}</span>
                    <ViabilidadBadge viabilidad={m.viabilidad} />
                  </div>
                  {m.fecha && <p className="text-[11px] font-utility opacity-50 mt-0.5" style={{ color: "var(--ink)" }}>
                    Meta: {(() => { try { return new Date(m.fecha).toLocaleDateString("es-CO", { month: "long", year: "numeric" }); } catch(_) { return m.fecha; } })()}
                    {m.mesesHastaFecha != null && ` · ${m.mesesHastaFecha} períodos restantes`}
                  </p>}
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => setEditMeta({ id: m.id, nombre: m.nombre, monto: String(m.monto), fecha: m.fecha || "" })} className="opacity-50"><Edit3 size={14} style={{ color: "var(--lilac)" }} /></button>
                  <button onClick={() => onDeleteMeta(m.id)} className="opacity-30"><Trash2 size={14} style={{ color: "var(--ink)" }} /></button>
                </div>
              </div>

              <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--line)" }}>
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.pct >= 100 ? "var(--emerald)" : "var(--lilac)" }} />
              </div>
              <div className="flex justify-between text-xs font-utility mb-3" style={{ color: "var(--ink)" }}>
                <span className="opacity-60">${fmt(m.ahorroAcumulado)} ahorrados</span>
                <span className="font-semibold opacity-80">{Math.round(m.pct)}% de ${fmt(m.monto)}</span>
              </div>

              {/* Déficit */}
              {m.deficitAcumulado > 0 && m.restante > 0 && (
                <button onClick={() => setExpandedMeta(expandedMeta === `deficit-${m.id}` ? null : `deficit-${m.id}`)} className="w-full text-left rounded-[12px] px-3 py-2 mb-2" style={{ background: "var(--amber-soft)" }}>
                  <p className="text-[11px] font-utility font-semibold" style={{ color: "var(--amber)" }}>⚠️ Alerta de déficit {expandedMeta === `deficit-${m.id}` ? "▲" : "▼"}</p>
                  {expandedMeta === `deficit-${m.id}` && <p className="text-[12px] font-utility mt-1 leading-relaxed" style={{ color: "var(--ink)" }}>El período pasado abonaste menos de lo sugerido (déficit: ${fmt(m.deficitAcumulado)}). Para recuperar el ritmo abona <span className="font-semibold" style={{ color: "var(--amber)" }}>${fmt(m.cuotaAjustada)}</span> en el próximo.</p>}
                </button>
              )}

              {/* Consejo unificado */}
              {m.restante > 0 && (
                <button onClick={() => setExpandedMeta(expandedMeta === `consejo-${m.id}` ? null : `consejo-${m.id}`)} className="w-full text-left rounded-[12px] px-3 py-2 mb-3" style={{ background: m.viabilidad === "critica" ? "var(--red-soft)" : m.viabilidad === "ajustada" ? "var(--amber-soft)" : "var(--lilac-soft)" }}>
                  <p className="text-[11px] font-utility font-semibold" style={{ color: m.viabilidad === "critica" ? "var(--red)" : m.viabilidad === "ajustada" ? "var(--amber)" : "var(--lilac)" }}>
                    🧠 Consejo de tu asesora {expandedMeta === `consejo-${m.id}` ? "▲" : "▼"}
                  </p>
                  {expandedMeta === `consejo-${m.id}` && (
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between text-xs font-utility pt-1" style={{ color: "var(--ink)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <span className="opacity-60">Falta por ahorrar</span>
                        <span className="font-semibold">${fmt(m.restante)}</span>
                      </div>
                      <div className="rounded-[10px] p-2.5" style={{ background: "rgba(255,255,255,0.5)" }}>
                        <p className="text-[10px] font-utility font-semibold uppercase tracking-wide mb-1.5 opacity-60" style={{ color: "var(--ink)" }}>Opción A — Según tu capacidad de ahorro</p>
                        {m.cuotaRecomendada > 0 ? (
                          <>
                            <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}><span className="opacity-70">Puedes pagar por período</span><span className="font-semibold" style={{ color: "var(--emerald)" }}>${fmt(m.cuotaRecomendada)}</span></div>
                            <div className="flex justify-between text-xs font-utility" style={{ color: "var(--ink)" }}><span className="opacity-70">Lo lograrías en</span><span className="font-semibold">~{Math.ceil(m.restante / m.cuotaRecomendada)} períodos</span></div>
                          </>
                        ) : <p className="text-[11px] font-utility opacity-60" style={{ color: "var(--ink)" }}>Registra ahorros para calcular tu capacidad.</p>}
                      </div>
                      <div className="rounded-[10px] p-2.5" style={{ background: "rgba(255,255,255,0.5)" }}>
                        <p className="text-[10px] font-utility font-semibold uppercase tracking-wide mb-1.5 opacity-60" style={{ color: "var(--ink)" }}>Opción B — Para cumplir tu fecha meta</p>
                        {m.cuotaSugerida != null && m.mesesHastaFecha != null ? (
                          <>
                            <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}><span className="opacity-70">Necesitas pagar por período</span><span className="font-semibold" style={{ color: "var(--lilac)" }}>${fmt(m.cuotaSugerida)}</span></div>
                            <div className="flex justify-between text-xs font-utility" style={{ color: "var(--ink)" }}><span className="opacity-70">Tienes</span><span className="font-semibold">~{m.mesesHastaFecha} períodos</span></div>
                          </>
                        ) : <p className="text-[11px] font-utility opacity-60" style={{ color: "var(--ink)" }}>Agrega una fecha límite para ver esta opción.</p>}
                      </div>
                      {m.viabilidad !== "viable" && <p className="text-[11px] font-utility leading-relaxed opacity-80" style={{ color: "var(--ink)" }}>{m.mensajeAsesor}</p>}
                    </div>
                  )}
                </button>
              )}

              {m.pct >= 100 ? (
                <div className="text-center py-1"><span className="text-sm font-utility font-semibold" style={{ color: "var(--emerald)" }}>🎉 ¡Meta cumplida!</span></div>
              ) : (
                <div className="flex gap-2 mb-3">
                  <TextInput type="number" placeholder="Añadir abono" value={abonoValues[m.id] || ""} onChange={(e) => setAbonoValues((prev) => ({ ...prev, [m.id]: e.target.value }))} style={{ fontSize: "14px", padding: "8px 12px" }} />
                  <button onClick={() => handleAbono(m.id)} className="px-4 py-2 rounded-xl text-sm font-utility font-semibold flex-shrink-0" style={{ background: "var(--emerald)", color: "#fff" }}>Abonar</button>
                </div>
              )}

              {m.abonos && m.abonos.length > 0 && (
                <div>
                  <button onClick={() => setExpandedAbonos((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} className="text-[11px] font-utility opacity-60 mb-2" style={{ color: "var(--ink)" }}>
                    {expandedAbonos[m.id] ? "▲ Ocultar" : "▼ Ver"} abonos ({m.abonos.length})
                  </button>
                  {expandedAbonos[m.id] && (
                    <div className="space-y-1.5">
                      {m.abonos.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-[10px] px-3 py-2" style={{ background: "var(--card-alt)" }}>
                          {editAbono?.abonoId === a.id ? (
                            <div className="flex gap-2 flex-1">
                              <TextInput type="number" value={editAbono.valor} onChange={(e) => setEditAbono((p) => ({ ...p, valor: e.target.value }))} style={{ fontSize: "13px", padding: "4px 8px" }} />
                              <TextInput type="date" value={editAbono.fecha} onChange={(e) => setEditAbono((p) => ({ ...p, fecha: e.target.value }))} style={{ fontSize: "13px", padding: "4px 8px" }} />
                              <button onClick={handleGuardarEdicion} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "var(--emerald)", color: "#fff" }}>✓</button>
                              <button onClick={() => setEditAbono(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--line)", color: "var(--ink)" }}>✕</button>
                            </div>
                          ) : (
                            <>
                              <div><span className="text-xs font-utility opacity-60" style={{ color: "var(--ink)" }}>{a.fecha}</span><span className="text-xs font-semibold ml-2" style={{ color: "var(--emerald)" }}>${fmt(a.valor)}</span></div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditAbono({ metaId: m.id, abonoId: a.id, valor: String(a.valor), fecha: a.fecha })} className="opacity-50"><Edit3 size={13} style={{ color: "var(--lilac)" }} /></button>
                                <button onClick={() => onEliminarAbono(m.id, a.id)} className="opacity-40"><Trash2 size={13} style={{ color: "var(--ink)" }} /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {(!analytics?.metasConProyeccion || analytics.metasConProyeccion.length === 0) && (
            <div className="text-center py-8"><p className="text-3xl mb-2">🌱</p><p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Aún no tienes metas.</p></div>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Límites por categoría</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {CATS_GASTO.map((cat) => (
            <div key={cat} className="flex items-center justify-between gap-3">
              <span className="text-sm font-utility flex-1" style={{ color: "var(--ink)" }}>{catEmoji(cat)} {cat}</span>
              <TextInput type="number" defaultValue={data.limites[cat] || ""} placeholder="Sin límite" className="w-28 !py-2 !text-sm text-right" onBlur={(e) => onUpdateLimit(cat, parseFloat(e.target.value) || 0)} />
            </div>
          ))}
        </div>
      </section>

      {/* Sheet de edición de meta */}
      <Sheet open={!!editMeta} onClose={() => setEditMeta(null)} title="Editar meta ✏️">
        <Field label="Nombre">
          <TextInput value={editMeta?.nombre || ""} onChange={(e) => setEditMeta((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la meta" />
        </Field>
        <Field label="Monto objetivo">
          <TextInput type="number" value={editMeta?.monto || ""} onChange={(e) => setEditMeta((p) => ({ ...p, monto: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Fecha límite (opcional)">
          <TextInput type="date" value={editMeta?.fecha || ""} onChange={(e) => setEditMeta((p) => ({ ...p, fecha: e.target.value }))} />
        </Field>
        <button onClick={handleGuardarEditMeta} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px]" style={{ background: "var(--lilac)", color: "#FFFFFF" }}>
          Guardar cambios ✅
        </button>
      </Sheet>

      <Sheet open={showAddMeta} onClose={() => setShowAddMeta(false)} title="Nueva meta 🌸">
        <Field label="Nombre"><TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cuota inicial vivienda" /></Field>
        <Field label="Monto objetivo"><TextInput type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" /></Field>
        <Field label="Fecha límite (opcional)"><TextInput type="date" value={fechaMeta} onChange={(e) => setFechaMeta(e.target.value)} /></Field>
        {monto && parseFloat(monto) > 0 && capacidadAhorro > 0 && (
          <div className="rounded-[12px] p-3 mb-3" style={{ background: "var(--lilac-soft)" }}>
            <p className="text-[12px] font-utility" style={{ color: "var(--ink)" }}>Con tu capacidad actual de <span className="font-semibold">${fmt(capacidadAhorro)}/período</span>, alcanzarías esta meta en <span className="font-semibold">~{Math.ceil(parseFloat(monto) / capacidadAhorro)} períodos</span>.</p>
          </div>
        )}
        <button onClick={handleAddMeta} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px]" style={{ background: "var(--lilac)", color: "#FFFFFF" }}>Crear meta</button>
      </Sheet>
    </div>
  );
}

/* ── DEUDAS ──────────────────────────────────────────────────────────── */
function DeudasView({ data, onAddDeuda, onAbonarDeuda, onEditarAbonoDeuda, onEliminarAbonoDeuda, onDeleteDeuda, onEditarDeuda, onAddDeudaTC, onAbonarDeudaTC, onDeleteDeudaTC, onEditarAbonoTC, onEliminarAbonoTC, onEditarDeudaTC }) {
  const [showAddDeuda, setShowAddDeuda] = useState(false);
  const [nombre, setNombre] = useState(""); const [monto, setMonto] = useState(""); const [notas, setNotas] = useState("");
  const [showAddTC, setShowAddTC] = useState(false);
  const [tcNombre, setTcNombre] = useState(""); const [tcMonto, setTcMonto] = useState(""); const [tcTipo, setTcTipo] = useState(DEUDA_TC_TIPOS[0]); const [tcCuotas, setTcCuotas] = useState(""); const [tcNotas, setTcNotas] = useState("");
  const [abonoValues, setAbonoValues] = useState({});
  const [expandedAbonos, setExpandedAbonos] = useState({});
  const [editAbono, setEditAbono] = useState(null);
  const [editDeuda, setEditDeuda] = useState(null); // { id, nombre, montoTotal, notas, isTC }

  const handleAddDeuda = () => { const m = parseFloat(monto); if (!nombre.trim() || !m || m <= 0) return; onAddDeuda({ id: uid(), nombre: nombre.trim(), montoTotal: m, saldoPendiente: m, abonos: [], fecha: todayISO(), notas: notas.trim() }); setNombre(""); setMonto(""); setNotas(""); setShowAddDeuda(false); };
  const handleAddTC = () => { const m = parseFloat(tcMonto); if (!tcNombre.trim() || !m || m <= 0) return; const c = parseInt(tcCuotas) || 1; onAddDeudaTC({ id: uid(), nombre: tcNombre.trim(), montoTotal: m, saldoPendiente: m, abonos: [], fecha: todayISO(), notas: tcNotas.trim(), tipo: tcTipo, cuotasTotal: c, cuotaMensual: tcTipo === "Cuotas fijas" ? Math.ceil(m / c) : m }); setTcNombre(""); setTcMonto(""); setTcCuotas(""); setTcNotas(""); setShowAddTC(false); };
  const handleAbono = (id, saldo, isTC) => { const val = parseFloat(abonoValues[id]); if (!val || val <= 0) return; if (isTC) onAbonarDeudaTC(id, Math.min(val, saldo)); else onAbonarDeuda(id, Math.min(val, saldo)); setAbonoValues((p) => ({ ...p, [id]: "" })); };
  const handleGuardarEdicion = () => { if (!editAbono) return; const val = parseFloat(editAbono.valor); if (!val || val <= 0) return; if (editAbono.isTC) onEditarAbonoTC(editAbono.id, editAbono.abonoId, val, editAbono.fecha); else onEditarAbonoDeuda(editAbono.id, editAbono.abonoId, val, editAbono.fecha); setEditAbono(null); };
  const handleGuardarEditDeuda = () => {
    if (!editDeuda) return;
    const m = parseFloat(editDeuda.montoTotal);
    if (!editDeuda.nombre.trim() || !m || m <= 0) return;
    const cambios = { nombre: editDeuda.nombre.trim(), notas: editDeuda.notas || "" };
    if (editDeuda.isTC) onEditarDeudaTC(editDeuda.id, cambios);
    else onEditarDeuda(editDeuda.id, cambios);
    setEditDeuda(null);
  };

  const renderDeuda = (d, isTC) => {
    const pct = d.montoTotal > 0 ? Math.min(((d.montoTotal - d.saldoPendiente) / d.montoTotal) * 100, 100) : 0;
    return (
      <div key={d.id} className="rounded-[20px] p-4" style={{ background: "var(--card)", border: `1px solid ${isTC ? "var(--amber)" : "var(--line)"}` }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-utility font-semibold text-sm" style={{ color: "var(--ink)" }}>{d.nombre}</p>
            {d.notas && <p className="text-[11px] font-utility opacity-50 mt-0.5" style={{ color: "var(--ink)" }}>{d.notas}</p>}
            {isTC && d.cuotaMensual && d.saldoPendiente > 0 && <p className="text-[11px] font-utility mt-1" style={{ color: "var(--amber)" }}>💡 Cuota sugerida: <span className="font-semibold">${fmt(d.cuotaMensual)}</span></p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditDeuda({ id: d.id, nombre: d.nombre, montoTotal: String(d.montoTotal), notas: d.notas || "", isTC })} className="opacity-50"><Edit3 size={14} style={{ color: "var(--lilac)" }} /></button>
            <button onClick={() => isTC ? onDeleteDeudaTC(d.id) : onDeleteDeuda(d.id)} className="opacity-30"><Trash2 size={14} style={{ color: "var(--ink)" }} /></button>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--line)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--emerald)" : isTC ? "var(--amber)" : "var(--lilac)" }} />
        </div>
        <div className="flex justify-between text-xs font-utility mb-3" style={{ color: "var(--ink)" }}>
          <span className="opacity-60">Pagado: <span className="font-semibold" style={{ color: "var(--emerald)" }}>${fmt(d.montoTotal - d.saldoPendiente)}</span></span>
          <span className="opacity-60">Pendiente: <span className="font-semibold" style={{ color: "var(--red)" }}>${fmt(d.saldoPendiente)}</span></span>
        </div>
        {d.saldoPendiente > 0 ? (
          <div className="flex gap-2 mb-3">
            <TextInput type="number" placeholder="Valor del abono" value={abonoValues[d.id] || ""} onChange={(e) => setAbonoValues((p) => ({ ...p, [d.id]: e.target.value }))} style={{ fontSize: "14px", padding: "8px 12px" }} />
            <button onClick={() => handleAbono(d.id, d.saldoPendiente, isTC)} className="px-4 py-2 rounded-xl text-sm font-utility font-semibold flex-shrink-0" style={{ background: isTC ? "var(--amber)" : "var(--lilac)", color: "#fff" }}>Abonar</button>
          </div>
        ) : <div className="text-center py-1 mb-3"><span className="text-xs font-utility font-semibold" style={{ color: "var(--emerald)" }}>✅ ¡Pagada!</span></div>}
        {d.abonos && d.abonos.length > 0 && (
          <div>
            <button onClick={() => setExpandedAbonos((p) => ({ ...p, [d.id]: !p[d.id] }))} className="text-[11px] font-utility opacity-60 mb-2" style={{ color: "var(--ink)" }}>{expandedAbonos[d.id] ? "▲ Ocultar" : "▼ Ver"} abonos ({d.abonos.length})</button>
            {expandedAbonos[d.id] && (
              <div className="space-y-1.5">
                {d.abonos.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-[10px] px-3 py-2" style={{ background: "var(--card-alt)" }}>
                    {editAbono?.abonoId === a.id ? (
                      <div className="flex gap-2 flex-1">
                        <TextInput type="number" value={editAbono.valor} onChange={(e) => setEditAbono((p) => ({ ...p, valor: e.target.value }))} style={{ fontSize: "13px", padding: "4px 8px" }} />
                        <TextInput type="date" value={editAbono.fecha} onChange={(e) => setEditAbono((p) => ({ ...p, fecha: e.target.value }))} style={{ fontSize: "13px", padding: "4px 8px" }} />
                        <button onClick={handleGuardarEdicion} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "var(--emerald)", color: "#fff" }}>✓</button>
                        <button onClick={() => setEditAbono(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--line)", color: "var(--ink)" }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div><span className="text-xs font-utility opacity-60" style={{ color: "var(--ink)" }}>{a.fecha}</span><span className="text-xs font-semibold ml-2" style={{ color: "var(--emerald)" }}>${fmt(a.valor)}</span></div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditAbono({ id: d.id, abonoId: a.id, valor: String(a.valor), fecha: a.fecha, isTC })} className="opacity-50"><Edit3 size={13} style={{ color: "var(--lilac)" }} /></button>
                          <button onClick={() => isTC ? onEliminarAbonoTC(d.id, a.id) : onEliminarAbonoDeuda(d.id, a.id)} className="opacity-40"><Trash2 size={13} style={{ color: "var(--ink)" }} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Mis deudas 🏦</h1>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-[16px]" style={{ color: "var(--ink)" }}>💳 Tarjeta de crédito</h3>
          <button onClick={() => setShowAddTC(true)} className="flex items-center gap-1 text-xs font-utility font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}><Plus size={14} /> Nueva</button>
        </div>
        <p className="text-xs font-utility opacity-60 mb-3" style={{ color: "var(--ink)" }}>El saldo solo se reduce cuando tú registras un abono manualmente.</p>
        {(data.deudasTC || []).length === 0 && <div className="text-center py-6 rounded-[18px]" style={{ background: "var(--card)", border: "1px solid var(--line)" }}><p className="text-2xl mb-1">💳</p><p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Sin deudas de tarjeta</p></div>}
        <div className="space-y-4">{(data.deudasTC || []).map((d) => renderDeuda(d, true))}</div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[16px]" style={{ color: "var(--ink)" }}>🏦 Otras deudas</h3>
          <button onClick={() => setShowAddDeuda(true)} className="flex items-center gap-1 text-xs font-utility font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--lilac-soft)", color: "var(--lilac)" }}><Plus size={14} /> Nueva</button>
        </div>
        {(data.deudas || []).length === 0 && <div className="text-center py-6 rounded-[18px]" style={{ background: "var(--card)", border: "1px solid var(--line)" }}><p className="text-2xl mb-1">🎉</p><p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Sin otras deudas. ¡Genial!</p></div>}
        <div className="space-y-4">{(data.deudas || []).map((d) => renderDeuda(d, false))}</div>
      </section>

      {/* Sheet edición de deuda */}
      <Sheet open={!!editDeuda} onClose={() => setEditDeuda(null)} title="Editar deuda ✏️">
        <Field label="Nombre">
          <TextInput value={editDeuda?.nombre || ""} onChange={(e) => setEditDeuda((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la deuda" />
        </Field>
        <Field label="Notas (opcional)">
          <TextInput value={editDeuda?.notas || ""} onChange={(e) => setEditDeuda((p) => ({ ...p, notas: e.target.value }))} placeholder="Ej: Banco X, vence en mayo..." />
        </Field>
        <button onClick={handleGuardarEditDeuda} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px]" style={{ background: "var(--lilac)", color: "#fff" }}>
          Guardar cambios ✅
        </button>
      </Sheet>

      <Sheet open={showAddTC} onClose={() => setShowAddTC(false)} title="Nueva deuda de tarjeta 💳">
        <Field label="Nombre / descripción"><TextInput value={tcNombre} onChange={(e) => setTcNombre(e.target.value)} placeholder="Ej: Compra ropa, Viaje..." /></Field>
        <Field label="Monto total"><TextInput type="number" value={tcMonto} onChange={(e) => setTcMonto(e.target.value)} placeholder="0" /></Field>
        <Field label="¿Cómo lo pagarás?"><SelectInput value={tcTipo} onChange={(e) => setTcTipo(e.target.value)}>{DEUDA_TC_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}</SelectInput></Field>
        {tcTipo === "Cuotas fijas" && <Field label="Número de cuotas"><TextInput type="number" value={tcCuotas} onChange={(e) => setTcCuotas(e.target.value)} placeholder="Ej: 3" /></Field>}
        {tcMonto && tcTipo === "Cuotas fijas" && tcCuotas && <div className="rounded-[12px] p-3 mb-3" style={{ background: "var(--amber-soft)" }}><p className="text-[12px] font-utility" style={{ color: "var(--ink)" }}>Cuota mensual: <span className="font-semibold" style={{ color: "var(--amber)" }}>${fmt(Math.ceil(parseFloat(tcMonto) / (parseInt(tcCuotas) || 1)))}</span></p></div>}
        <Field label="Notas (opcional)"><TextInput value={tcNotas} onChange={(e) => setTcNotas(e.target.value)} placeholder="Ej: Banco X, vence en mayo..." /></Field>
        <button onClick={handleAddTC} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px]" style={{ background: "var(--amber)", color: "#fff" }}>Registrar deuda</button>
      </Sheet>

      <Sheet open={showAddDeuda} onClose={() => setShowAddDeuda(false)} title="Nueva deuda 🏦">
        <Field label="Nombre"><TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Préstamo banco..." /></Field>
        <Field label="Monto total"><TextInput type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" /></Field>
        <Field label="Notas (opcional)"><TextInput value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Cuota mensual $200.000" /></Field>
        <button onClick={handleAddDeuda} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px]" style={{ background: "var(--lilac)", color: "#fff" }}>Registrar deuda</button>
      </Sheet>
    </div>
  );
}

/* ── SETTINGS ────────────────────────────────────────────────────────── */
function SettingsView({ data, onToggleDark, onExport, onBackup, onRestore, error }) {
  const fileRef = React.useRef(null);
  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Ajustes</h1>
      {error && <div className="rounded-[16px] p-3.5 flex items-start gap-2.5" style={{ background: "var(--red-soft)" }}><AlertTriangle size={16} style={{ color: "var(--red)", marginTop: 1 }} /><p className="text-[13px] font-utility leading-snug" style={{ color: "var(--ink)" }}>{error}</p></div>}
      <button onClick={onToggleDark} className="w-full rounded-[18px] p-4 flex items-center justify-between" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <span className="flex items-center gap-3 font-utility text-sm" style={{ color: "var(--ink)" }}>{data.darkMode ? <Moon size={17} /> : <Sun size={17} />}Modo oscuro</span>
        <div className="w-11 h-6 rounded-full p-0.5 transition-colors" style={{ background: data.darkMode ? "var(--emerald)" : "var(--line)" }}><div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: data.darkMode ? "translateX(20px)" : "translateX(0)" }} /></div>
      </button>
      <button onClick={onExport} className="w-full rounded-[18px] p-4 flex items-center justify-between" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <span className="flex items-center gap-3 font-utility text-sm" style={{ color: "var(--ink)" }}><Download size={17} /> Exportar a CSV</span>
        <ChevronRight size={16} style={{ color: "var(--ink)", opacity: 0.4 }} />
      </button>
      <div className="rounded-[18px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="text-xs font-utility font-semibold uppercase tracking-wide opacity-60" style={{ color: "var(--ink)" }}>💾 Respaldo completo</p>
        <p className="text-xs font-utility opacity-50 leading-relaxed" style={{ color: "var(--ink)" }}>Guarda una copia de todos tus datos antes de actualizar la app.</p>
        <button onClick={onBackup} className="w-full rounded-xl py-3 font-utility font-semibold text-sm" style={{ background: "var(--emerald)", color: "#fff" }}>⬇️ Descargar respaldo</button>
        <button onClick={() => fileRef.current?.click()} className="w-full rounded-xl py-3 font-utility font-semibold text-sm" style={{ background: "var(--lilac)", color: "#fff" }}>⬆️ Restaurar desde respaldo</button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => onRestore(ev.target.result); reader.readAsText(file); e.target.value = ""; }} />
      </div>
      <div className="rounded-[18px] p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="text-xs font-utility opacity-60 leading-relaxed" style={{ color: "var(--ink)" }}>💌 Tus datos se guardan solitos. Todo queda en tu dispositivo.</p>
        <p className="text-[10px] font-utility opacity-30 mt-2 text-right" style={{ color: "var(--ink)" }}>v1.6.1</p>
      </div>
    </div>
  );
}

/* ── ROOT APP ────────────────────────────────────────────────────────── */
export default function App() {
  const { data, setData, loading, error } = useStorage();
  const analytics = useAnalytics(data);
  const [tab, setTab] = useState("dashboard");
  const [addSheet, setAddSheet] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const dark = data?.darkMode;
  const cssVars = dark ? {
    "--paper": TOKENS.paperDark, "--ink": TOKENS.inkDark, "--card": "#2D2240",
    "--card-alt": "#352846", "--line": TOKENS.lineDark, "--input-bg": "#2D2240",
    "--emerald": "#8FD4AE", "--emerald-soft": "#23402F", "--amber": "#F0BD7E",
    "--amber-soft": "#42301B", "--red": "#F0A3B8", "--red-soft": "#452531",
    "--lilac": "#C9A8E8", "--lilac-soft": "#3A2C4F", "--pink": "#F4C9D9",
  } : {
    "--paper": TOKENS.paper, "--ink": TOKENS.ink, "--card": "#FFFFFF",
    "--card-alt": "#F3EAFB", "--line": TOKENS.line, "--input-bg": "#FFFFFF",
    "--emerald": TOKENS.emerald, "--emerald-soft": TOKENS.emeraldSoft, "--amber": TOKENS.amber,
    "--amber-soft": TOKENS.amberSoft, "--red": TOKENS.red, "--red-soft": TOKENS.redSoft,
    "--lilac": TOKENS.lilac, "--lilac-soft": TOKENS.lilacSoft, "--pink": TOKENS.pink,
  };

  if (loading || !data) return <div className="min-h-screen flex items-center justify-center" style={{ background: TOKENS.paper }}><p className="font-utility text-sm" style={{ color: TOKENS.ink, opacity: 0.5 }}>Cargando tus datos…</p></div>;

  const updateAndSave = (mutator) => { const next = mutator(JSON.parse(JSON.stringify(data))); setData(next); };

  const handleAddMovement = (type) => (item, metaId) => {
    updateAndSave((d) => {
      if (type === "gasto") d.gastos.push(item);
      else if (type === "ingreso") d.ingresos.push(item);
      else if (type === "ahorro") {
        d.ahorros.push(item);
        // Si hay meta seleccionada, abonar en el mismo updateAndSave (operación atómica)
        if (metaId) {
          const meta = d.metas.find((m) => m.id === metaId);
          if (meta) {
            meta.abonos = [...(meta.abonos || []), { id: uid(), fecha: item.fecha, valor: item.valor }];
          }
        }
      }
      return d;
    });
  };

  const handleDelete = (tipo, id) => updateAndSave((d) => {
    if (tipo === "gasto") d.gastos = d.gastos.filter((x) => x.id !== id);
    else if (tipo === "ingreso") d.ingresos = d.ingresos.filter((x) => x.id !== id);
    else if (tipo === "ahorro") d.ahorros = d.ahorros.filter((x) => x.id !== id);
    return d;
  });

  const handleEdit = (tipo, updated) => updateAndSave((d) => {
    if (tipo === "gasto") d.gastos = d.gastos.map((x) => x.id === updated.id ? updated : x);
    else if (tipo === "ingreso") d.ingresos = d.ingresos.map((x) => x.id === updated.id ? updated : x);
    else if (tipo === "ahorro") d.ahorros = d.ahorros.map((x) => x.id === updated.id ? updated : x);
    return d;
  });

  const handleAddMeta = (meta) => updateAndSave((d) => { d.metas.push(meta); return d; });
  const handleEditarMeta = (id, cambios) => updateAndSave((d) => { d.metas = d.metas.map((m) => m.id === id ? { ...m, ...cambios } : m); return d; });
  const handleAgregarAbonoMeta = (metaId, abono) => updateAndSave((d) => { const m = d.metas.find((x) => x.id === metaId); if (m) m.abonos = [...(m.abonos || []), { id: uid(), fecha: todayISO(), ...abono }]; return d; });
  const handleEditarAbonoMeta = (metaId, abonoId, val, fecha) => updateAndSave((d) => { const m = d.metas.find((x) => x.id === metaId); if (m) m.abonos = (m.abonos || []).map((a) => a.id === abonoId ? { ...a, valor: val, fecha } : a); return d; });
  const handleEliminarAbonoMeta = (metaId, abonoId) => updateAndSave((d) => { const m = d.metas.find((x) => x.id === metaId); if (m) m.abonos = (m.abonos || []).filter((a) => a.id !== abonoId); return d; });
  const handleDeleteMeta = (id) => updateAndSave((d) => { d.metas = d.metas.filter((m) => m.id !== id); return d; });
  const handleUpdateLimit = (cat, val) => updateAndSave((d) => { d.limites[cat] = val; return d; });

  const handleAddDeuda = (deuda) => updateAndSave((d) => { d.deudas = [...(d.deudas || []), deuda]; return d; });
  const handleEditarDeuda = (id, cambios) => updateAndSave((d) => { d.deudas = (d.deudas || []).map((x) => x.id === id ? { ...x, ...cambios } : x); return d; });
  const handleEditarDeudaTC = (id, cambios) => updateAndSave((d) => { d.deudasTC = (d.deudasTC || []).map((x) => x.id === id ? { ...x, ...cambios } : x); return d; });
  const handleAbonarDeuda = (id, abono) => updateAndSave((d) => { d.deudas = (d.deudas || []).map((x) => { if (x.id !== id) return x; const abonos = [...(x.abonos || []), { id: uid(), fecha: todayISO(), valor: abono }]; return { ...x, abonos, saldoPendiente: Math.max(x.montoTotal - abonos.reduce((s, a) => s + a.valor, 0), 0) }; }); return d; });
  const handleEditarAbonoDeuda = (did, aid, val, fecha) => updateAndSave((d) => { d.deudas = (d.deudas || []).map((x) => { if (x.id !== did) return x; const abonos = (x.abonos || []).map((a) => a.id === aid ? { ...a, valor: val, fecha } : a); return { ...x, abonos, saldoPendiente: Math.max(x.montoTotal - abonos.reduce((s, a) => s + a.valor, 0), 0) }; }); return d; });
  const handleEliminarAbonoDeuda = (did, aid) => updateAndSave((d) => { d.deudas = (d.deudas || []).map((x) => { if (x.id !== did) return x; const abonos = (x.abonos || []).filter((a) => a.id !== aid); return { ...x, abonos, saldoPendiente: Math.max(x.montoTotal - abonos.reduce((s, a) => s + a.valor, 0), 0) }; }); return d; });
  const handleDeleteDeuda = (id) => updateAndSave((d) => { d.deudas = (d.deudas || []).filter((x) => x.id !== id); return d; });

  const handleAddDeudaTC = (tc) => updateAndSave((d) => { d.deudasTC = [...(d.deudasTC || []), tc]; return d; });
  const handleAbonarDeudaTC = (id, abono) => updateAndSave((d) => { d.deudasTC = (d.deudasTC || []).map((x) => { if (x.id !== id) return x; const abonos = [...(x.abonos || []), { id: uid(), fecha: todayISO(), valor: abono }]; return { ...x, abonos, saldoPendiente: Math.max(x.montoTotal - abonos.reduce((s, a) => s + a.valor, 0), 0) }; }); return d; });
  const handleEditarAbonoTC = (tid, aid, val, fecha) => updateAndSave((d) => { d.deudasTC = (d.deudasTC || []).map((x) => { if (x.id !== tid) return x; const abonos = (x.abonos || []).map((a) => a.id === aid ? { ...a, valor: val, fecha } : a); return { ...x, abonos, saldoPendiente: Math.max(x.montoTotal - abonos.reduce((s, a) => s + a.valor, 0), 0) }; }); return d; });
  const handleEliminarAbonoTC = (tid, aid) => updateAndSave((d) => { d.deudasTC = (d.deudasTC || []).map((x) => { if (x.id !== tid) return x; const abonos = (x.abonos || []).filter((a) => a.id !== aid); return { ...x, abonos, saldoPendiente: Math.max(x.montoTotal - abonos.reduce((s, a) => s + a.valor, 0), 0) }; }); return d; });
  const handleDeleteDeudaTC = (id) => updateAndSave((d) => { d.deudasTC = (d.deudasTC || []).filter((x) => x.id !== id); return d; });

  const handleToggleDark = () => updateAndSave((d) => { d.darkMode = !d.darkMode; return d; });

  const handleBackup = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `finanzas-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleRestore = (jsonText) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.ingresos || !parsed.gastos) { alert("El archivo no parece ser un respaldo válido."); return; }
      if (window.confirm("¿Segura que quieres restaurar este respaldo? Se reemplazarán todos tus datos actuales.")) setData(parsed);
    } catch (_) { alert("No se pudo leer el archivo."); }
  };

  const handleExport = () => {
    const rows = [["tipo", "fecha", "categoria", "valor", "detalle"]];
    data.ingresos.forEach((i) => rows.push(["ingreso", i.fecha, i.categoria, i.valor, i.fuente || ""]));
    data.gastos.forEach((g) => rows.push(["gasto", g.fecha, g.categoria, g.valor, g.descripcion || ""]));
    data.ahorros.forEach((a) => rows.push(["ahorro", a.fecha, "Ahorro", a.valor, a.observaciones || ""]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "finanzas.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "dashboard", icon: Home, label: "Inicio" },
    { id: "historial", icon: Calendar, label: "Historial" },
    { id: "analisis", icon: BarChart3, label: "Análisis" },
    { id: "metas", icon: Target, label: "Metas" },
    { id: "deudas", icon: PiggyBank, label: "Deudas" },
    { id: "ajustes", icon: Settings, label: "Ajustes" },
  ];

  return (
    <div style={cssVars} className="min-h-screen flex justify-center">
      <style>{`
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .font-display { font-family: 'Fredoka', 'Quicksand', sans-serif; font-weight: 600; letter-spacing: -0.01em; }
        .font-utility { font-family: 'Quicksand', system-ui, sans-serif; }
        .font-mono { font-family: 'Quicksand', system-ui, sans-serif; font-weight: 600; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; } }
        input:focus, select:focus, button:focus-visible { outline: 2px solid var(--lilac); outline-offset: 1px; }
      `}</style>

      <div className="w-full max-w-md min-h-screen flex flex-col" style={{ background: "var(--paper)" }}>
        <div className="flex-1 overflow-y-auto pb-24" style={{ animation: "fadeIn 0.2s ease-out" }}>
          {tab === "dashboard" && <Dashboard analytics={analytics} onNavigate={setTab} />}
          {tab === "historial" && <History data={data} onDelete={handleDelete} onEdit={handleEdit} />}
          {tab === "analisis" && <Analysis analytics={analytics} />}
          {tab === "metas" && (
            <MetasErrorBoundary>
              <GoalsAndLimits data={data} analytics={analytics}
                onAddMeta={handleAddMeta} onEditarMeta={handleEditarMeta} onAgregarAbono={handleAgregarAbonoMeta}
                onEditarAbono={handleEditarAbonoMeta} onEliminarAbono={handleEliminarAbonoMeta}
                onDeleteMeta={handleDeleteMeta} onUpdateLimit={handleUpdateLimit} />
            </MetasErrorBoundary>
          )}
          {tab === "deudas" && (
            <DeudasView data={data}
              onAddDeuda={handleAddDeuda} onAbonarDeuda={handleAbonarDeuda}
              onEditarAbonoDeuda={handleEditarAbonoDeuda} onEliminarAbonoDeuda={handleEliminarAbonoDeuda} onDeleteDeuda={handleDeleteDeuda} onEditarDeuda={handleEditarDeuda}
              onAddDeudaTC={handleAddDeudaTC} onAbonarDeudaTC={handleAbonarDeudaTC}
              onEditarAbonoTC={handleEditarAbonoTC} onEliminarAbonoTC={handleEliminarAbonoTC} onDeleteDeudaTC={handleDeleteDeudaTC} onEditarDeudaTC={handleEditarDeudaTC} />
          )}
          {tab === "ajustes" && <SettingsView data={data} onToggleDark={handleToggleDark} onExport={handleExport} onBackup={handleBackup} onRestore={handleRestore} error={error} />}
        </div>

        <div className="fixed bottom-0 w-full max-w-md flex items-center justify-around px-2 pt-2 pb-safe" style={{ background: "var(--paper)", borderTop: "1px solid var(--line)" }}>
          {navItems.map((item) => {
            const Icon = item.icon; const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className="flex flex-col items-center gap-0.5 py-1.5 px-2 flex-1">
                <Icon size={20} style={{ color: active ? "var(--lilac)" : "var(--ink)", opacity: active ? 1 : 0.45 }} />
                <span className="text-[10px] font-utility" style={{ color: active ? "var(--lilac)" : "var(--ink)", opacity: active ? 1 : 0.45 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="fixed" style={{ bottom: "76px", right: "calc(50% - 200px + 16px)" }}>
          {addMenuOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2 items-end">
              {[{ type: "ingreso", label: "Ingreso", color: "var(--emerald)" }, { type: "ahorro", label: "Ahorro", color: "var(--amber)" }, { type: "gasto", label: "Gasto", color: "var(--red)" }].map((opt) => (
                <button key={opt.type} onClick={() => { setAddSheet(opt.type); setAddMenuOpen(false); }} className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full shadow-lg" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                  <span className="text-sm font-utility font-medium" style={{ color: "var(--ink)" }}>{opt.label}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setAddMenuOpen((s) => !s)} className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform" style={{ background: "linear-gradient(135deg, var(--lilac), var(--pink))" }} aria-label="Agregar movimiento">
            <Plus size={26} style={{ color: "#FFFFFF", transform: addMenuOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      <AddMovementSheet open={!!addSheet} onClose={() => setAddSheet(null)} type={addSheet}
        metas={data?.metas || []} onAgregarAbonoMeta={handleAgregarAbonoMeta}
        onSave={handleAddMovement(addSheet)} />
    </div>
  );
}

