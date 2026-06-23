import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Home, PlusCircle, BarChart3, Target, Settings, X, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Sparkles, ChevronRight, Heart, PiggyBank,
  ArrowUpRight, ArrowDownRight, Trash2, Edit3, Filter, Moon, Sun, Download,
  Bell, Plus, ChevronLeft, Calendar, Tag
} from "lucide-react";

/* ----------------------------------------------------------------------
   TOKENS
   Pastel lilac diary aesthetic: soft lavender background, dusty-rose and
   mint accents, a rounded playful display face for numbers/headers, and
   a friendly emoji per category instead of plain text labels.
------------------------------------------------------------------------- */
const TOKENS = {
  paper: "#F6EFFB",
  paperDark: "#241B33",
  ink: "#4A3B5C",
  inkDark: "#EFE4FA",
  emerald: "#7FB99A",
  emeraldSoft: "#DFF3E8",
  amber: "#E8A85C",
  amberSoft: "#FCE9D2",
  red: "#E18AA0",
  redSoft: "#FBE1E9",
  line: "#E3D3F2",
  lineDark: "#3A2C4F",
  lilac: "#C9A8E8",
  lilacSoft: "#EDE0FA",
  pink: "#F4C9D9",
};

const CATEGORY_EMOJI = {
  "Servicios públicos": "💡",
  "Transporte": "🚌",
  "Higiene personal": "🧴",
  "Desayunos": "🥐",
  "Almuerzos": "🍱",
  "Fines de semana": "🌸",
  "Regalos": "🎁",
  "Otros gastos": "✨",
  "Salario": "💼",
  "Independiente": "🧵",
  "Regalo": "🎀",
  "Inversión": "🌱",
  "Otro": "💫",
};
const catEmoji = (cat) => CATEGORY_EMOJI[cat] || "🌷";

const CATS_GASTO = [
  "Servicios públicos", "Transporte", "Higiene personal", "Desayunos",
  "Almuerzos", "Fines de semana", "Regalos", "Otros gastos",
];
const CATS_INGRESO = ["Salario", "Independiente", "Regalo", "Inversión", "Otro"];
const METODOS = ["Efectivo", "Débito", "Crédito", "Transferencia"];

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso) => iso.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${names[parseInt(m,10)-1]} ${y}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);

const STORAGE_KEY = "finanzas-data-v1";

const seedData = () => {
  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const thisMonth = (day) => {
    const dt = new Date(now.getFullYear(), now.getMonth(), day);
    return iso(dt);
  };
  const lastMonth = (day) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - 1, day);
    return iso(dt);
  };
  return {
    ingresos: [
      { id: uid(), fecha: thisMonth(1), valor: 3200000, categoria: "Salario", fuente: "Empleo principal", notas: "" },
      { id: uid(), fecha: lastMonth(1), valor: 3200000, categoria: "Salario", fuente: "Empleo principal", notas: "" },
    ],
    gastos: [
      { id: uid(), fecha: thisMonth(3), valor: 180000, categoria: "Servicios públicos", descripcion: "Energía + agua", metodo: "Débito", impulsivo: false },
      { id: uid(), fecha: thisMonth(5), valor: 90000, categoria: "Transporte", descripcion: "Recargas mes", metodo: "Efectivo", impulsivo: false },
      { id: uid(), fecha: thisMonth(8), valor: 45000, categoria: "Fines de semana", descripcion: "Cine + comida", metodo: "Crédito", impulsivo: true },
      { id: uid(), fecha: thisMonth(10), valor: 120000, categoria: "Almuerzos", descripcion: "Semana 2", metodo: "Efectivo", impulsivo: false },
      { id: uid(), fecha: lastMonth(12), valor: 95000, categoria: "Fines de semana", descripcion: "Salida", metodo: "Crédito", impulsivo: true },
    ],
    ahorros: [
      { id: uid(), fecha: thisMonth(1), valor: 400000, meta: null, observaciones: "Ahorro mensual fijo" },
    ],
    metas: [
      { id: uid(), nombre: "Cuota inicial vivienda", monto: 20000000, fecha: "2027-12-31", ahorroAcumulado: 400000 },
    ],
    limites: {
      "Servicios públicos": 220000, "Transporte": 150000, "Higiene personal": 80000,
      "Desayunos": 150000, "Almuerzos": 200000, "Fines de semana": 150000,
      "Regalos": 60000, "Otros gastos": 100000,
    },
    darkMode: false,
  };
};

/* ----------------------------------------------------------------------
   STORAGE
   Uses localStorage directly — this version is built to run as a
   standalone deployed site (Vercel/Netlify), not inside a Claude artifact.
------------------------------------------------------------------------- */
function useStorage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        const seed = seedData();
        setData(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (e) {
      const seed = seedData();
      setData(seed);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((next) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setError(null);
    } catch (e) {
      setError("No se pudo guardar. Tus cambios están en pantalla pero podrían perderse.");
    }
  }, []);

  return { data, setData: persist, loading, error };
}

/* ----------------------------------------------------------------------
   ANALYTICS ENGINE
------------------------------------------------------------------------- */
function useAnalytics(data) {
  return useMemo(() => {
    if (!data) return null;
    const { ingresos, gastos, ahorros, limites, metas } = data;
    const months = Array.from(
      new Set([...ingresos, ...gastos, ...ahorros].map((x) => monthKey(x.fecha)))
    ).sort();
    const curMonth = monthKey(todayISO());
    const prevMonths = months.filter((m) => m !== curMonth);
    const lastIdx = months.indexOf(curMonth);
    const prevMonth = lastIdx > 0 ? months[lastIdx - 1] : (prevMonths[prevMonths.length - 1] || null);

    const sumIn = (arr) => arr.reduce((s, x) => s + x.valor, 0);
    const byMonth = (arr, m) => arr.filter((x) => monthKey(x.fecha) === m);

    const monthly = months.map((m) => {
      const ing = sumIn(byMonth(ingresos, m));
      const gas = sumIn(byMonth(gastos, m));
      const aho = sumIn(byMonth(ahorros, m));
      return { month: m, ingresos: ing, gastos: gas, ahorro: aho, libre: ing - gas - aho };
    });

    const curM = monthly.find((m) => m.month === curMonth) || { ingresos: 0, gastos: 0, ahorro: 0, libre: 0 };
    const prevM = monthly.find((m) => m.month === prevMonth) || { ingresos: 0, gastos: 0, ahorro: 0, libre: 0 };

    const curGastosByCat = {};
    byMonth(gastos, curMonth).forEach((g) => {
      curGastosByCat[g.categoria] = (curGastosByCat[g.categoria] || 0) + g.valor;
    });
    const prevGastosByCat = {};
    byMonth(gastos, prevMonth || "").forEach((g) => {
      prevGastosByCat[g.categoria] = (prevGastosByCat[g.categoria] || 0) + g.valor;
    });

    const catRanking = Object.entries(curGastosByCat).sort((a, b) => b[1] - a[1]);
    const topCat = catRanking[0] || null;

    const last3 = monthly.slice(-4, -1); // up to 3 months before current
    const avgAhorro3 = last3.length ? last3.reduce((s, m) => s + m.ahorro, 0) / last3.length : 0;

    const impulsivos = byMonth(gastos, curMonth).filter((g) => g.impulsivo);
    const impulsivoTotal = sumIn(impulsivos);
    const impulsivoPct = curM.gastos > 0 ? (impulsivoTotal / curM.gastos) * 100 : 0;

    // small frequent expenses ("gastos hormiga"): many entries under a threshold
    const small = byMonth(gastos, curMonth).filter((g) => g.valor > 0 && g.valor <= 25000);
    const smallTotal = sumIn(small);

    const limiteStatus = Object.entries(limites || {}).map(([cat, limite]) => {
      const gastado = curGastosByCat[cat] || 0;
      const pct = limite > 0 ? (gastado / limite) * 100 : 0;
      return { categoria: cat, limite, gastado, pct };
    });

    const tasaAhorro = curM.ingresos > 0 ? (curM.ahorro / curM.ingresos) * 100 : 0;
    const pctGastoSobreIngreso = curM.ingresos > 0 ? (curM.gastos / curM.ingresos) * 100 : 0;

    const metasConProyeccion = (metas || []).map((meta) => {
      const restante = Math.max(meta.monto - (meta.ahorroAcumulado || 0), 0);
      const ritmo = avgAhorro3 > 0 ? avgAhorro3 : (curM.ahorro || 1);
      const mesesEstimados = ritmo > 0 ? Math.ceil(restante / ritmo) : null;
      const pct = meta.monto > 0 ? Math.min(((meta.ahorroAcumulado || 0) / meta.monto) * 100, 100) : 0;
      return { ...meta, restante, mesesEstimados, pct };
    });

    // recommendations engine
    const librePct = curM.ingresos > 0 ? (curM.libre / curM.ingresos) * 100 : 0;
    const recs = [];
    limiteStatus.forEach((l) => {
      if (l.pct >= 100) {
        recs.push({ tipo: "critico", texto: `Superaste el límite de ${l.categoria} este mes (${fmt(l.gastado)} de ${fmt(l.limite)}).` });
      } else if (l.pct >= 80) {
        recs.push({ tipo: "alerta", texto: `Estás cerca del límite en ${l.categoria}: ya usaste ${Math.round(l.pct)}%.` });
      }
    });
    if (prevMonth) {
      Object.entries(curGastosByCat).forEach(([cat, val]) => {
        const prev = prevGastosByCat[cat] || 0;
        if (prev > 0 && val > prev * 1.2) {
          const pctUp = Math.round(((val - prev) / prev) * 100);
          recs.push({ tipo: "info", texto: `Tus gastos en ${cat.toLowerCase()} subieron ${pctUp}% frente al mes anterior.` });
        }
      });
    }
    if (avgAhorro3 > 0 && curM.ahorro < avgAhorro3) {
      recs.push({ tipo: "alerta", texto: `Este mes ahorraste menos que el promedio de los últimos meses (${fmt(curM.ahorro)} vs ${fmt(avgAhorro3)}).` });
    }
    if (impulsivoPct > 25) {
      recs.push({ tipo: "alerta", texto: `Tus gastos impulsivos representan ${Math.round(impulsivoPct)}% de lo gastado este mes.` });
    }
    if (small.length >= 4) {
      recs.push({ tipo: "info", texto: `Detectamos ${small.length} gastos pequeños frecuentes ("gastos hormiga") que suman ${fmt(smallTotal)}.` });
    }
    if (curM.ingresos > 0 && librePct < 10) {
      recs.push({ tipo: "critico", texto: `Tu margen libre este mes es bajo (${Math.round(librePct)}%). Vale la pena ajustar gastos variables.` });
    }
    metasConProyeccion.forEach((m) => {
      if (m.pct >= 100) {
        recs.push({ tipo: "exito", texto: `¡Cumpliste la meta "${m.nombre}"! Considera definir una nueva meta.` });
      } else if (m.mesesEstimados) {
        recs.push({ tipo: "info", texto: `A tu ritmo actual, alcanzarás "${m.nombre}" en aproximadamente ${m.mesesEstimados} meses.` });
      }
    });
    if (topCat && curM.ingresos > 0) {
      const pctOfIncome = (topCat[1] / curM.ingresos) * 100;
      if (pctOfIncome > 15) {
        recs.push({ tipo: "info", texto: `${topCat[0]} es tu categoría con mayor gasto: ${Math.round(pctOfIncome)}% de tu ingreso.` });
      }
    }

    // semáforo: green / amber / red based on libre% and limit breaches
    const anyOver100 = limiteStatus.some((l) => l.pct >= 100);
    const anyOver80 = limiteStatus.some((l) => l.pct >= 80);
    let semaforo = "verde";
    if (anyOver100 || librePct < 5) semaforo = "rojo";
    else if (anyOver80 || librePct < 15) semaforo = "amarillo";

    return {
      months, monthly, curMonth, prevMonth, curM, prevM,
      curGastosByCat, prevGastosByCat, catRanking, topCat,
      avgAhorro3, impulsivoTotal, impulsivoPct, smallTotal, smallCount: small.length,
      limiteStatus, tasaAhorro, pctGastoSobreIngreso, libre: curM.libre, librePct,
      metasConProyeccion, recs, semaforo,
    };
  }, [data]);
}

/* ----------------------------------------------------------------------
   SHARED UI ATOMS
------------------------------------------------------------------------- */
function Ring({ pct, size = 64, stroke = 7, color, trackColor, dark }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(pct, 100));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
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
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: "var(--ink)" }} aria-label="Cerrar">
            <X size={20} />
          </button>
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

function TextInput(props) {
  return <input {...props} className={inputClass} style={{ background: "var(--input-bg)", borderColor: "var(--line)", color: "var(--ink)" }} />;
}
function SelectInput({ children, ...props }) {
  return <select {...props} className={inputClass} style={{ background: "var(--input-bg)", borderColor: "var(--line)", color: "var(--ink)" }}>{children}</select>;
}

/* ----------------------------------------------------------------------
   ADD MOVEMENT SHEET
------------------------------------------------------------------------- */
function AddMovementSheet({ open, onClose, type, onSave, customCats, onAddCustomCat }) {
  const [fecha, setFecha] = useState(todayISO());
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState(type === "gasto" ? CATS_GASTO[0] : type === "ingreso" ? CATS_INGRESO[0] : "");
  const [customCatName, setCustomCatName] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [metodo, setMetodo] = useState(METODOS[0]);
  const [impulsivo, setImpulsivo] = useState(false);
  const [metaId, setMetaId] = useState("");

  useEffect(() => {
    if (open) {
      setFecha(todayISO());
      setValor("");
      setCategoria(type === "gasto" ? CATS_GASTO[0] : type === "ingreso" ? CATS_INGRESO[0] : "");
      setCustomCatName("");
      setDescripcion("");
      setMetodo(METODOS[0]);
      setImpulsivo(false);
      setMetaId("");
    }
  }, [open, type]);

  if (!open) return null;

  const handleSubmit = () => {
    const num = parseFloat(valor);
    if (!num || num <= 0) return;
    const finalCat = categoria === "Otros gastos" && customCatName.trim() ? customCatName.trim() : categoria;
    if (type === "gasto") {
      onSave({ id: uid(), fecha, valor: num, categoria: finalCat, descripcion, metodo, impulsivo });
    } else if (type === "ingreso") {
      onSave({ id: uid(), fecha, valor: num, categoria, fuente: descripcion, notas: "" });
    } else {
      onSave({ id: uid(), fecha, valor: num, meta: metaId || null, observaciones: descripcion });
    }
    onClose();
  };

  const title = type === "gasto" ? "Nuevo gasto" : type === "ingreso" ? "Nuevo ingreso" : "Nuevo ahorro";

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <Field label="Fecha">
        <TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Field>
      <Field label="Valor (COP)">
        <TextInput type="number" inputMode="decimal" placeholder="0" value={valor} onChange={(e) => setValor(e.target.value)} />
      </Field>
      {type === "gasto" && (
        <>
          <Field label="Categoría">
            <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATS_GASTO.map((c) => <option key={c} value={c}>{catEmoji(c)} {c}</option>)}
            </SelectInput>
          </Field>
          {categoria === "Otros gastos" && (
            <Field label="Nombre del gasto">
              <TextInput value={customCatName} onChange={(e) => setCustomCatName(e.target.value)} placeholder="Ej: Mascota" />
            </Field>
          )}
          <Field label="Descripción">
            <TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
          </Field>
          <Field label="Método de pago">
            <SelectInput value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectInput>
          </Field>
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
          <Field label="Fuente / notas">
            <TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
          </Field>
        </>
      )}
      {type === "ahorro" && (
        <Field label="Observaciones">
          <TextInput value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
        </Field>
      )}
      <button
        onClick={handleSubmit}
        className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px] active:scale-[0.98] transition-transform"
        style={{ background: "var(--lilac)", color: "#FFFFFF" }}
      >
        Guardar movimiento
      </button>
    </Sheet>
  );
}

/* ----------------------------------------------------------------------
   DASHBOARD
------------------------------------------------------------------------- */
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

function Dashboard({ analytics, onNavigate }) {
  if (!analytics) return null;
  const { curM, tasaAhorro, libre, semaforo, recs, metasConProyeccion } = analytics;
  const topRecs = recs.slice(0, 3);

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-utility uppercase tracking-wide opacity-60" style={{ color: "var(--ink)" }}>
            {monthLabel(analytics.curMonth)}
          </p>
          <h1 className="font-display text-[28px] leading-tight" style={{ color: "var(--ink)" }}>Tu mes en bonito ✨</h1>
        </div>
        <SemaforoBadge semaforo={semaforo} />
      </div>

      {/* Hero: saldo libre with ring */}
      <div className="rounded-[24px] p-5 flex items-center gap-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="relative flex-shrink-0">
          <Ring pct={Math.max(analytics.librePct, 0)} size={84} stroke={8}
            color={semaforo === "rojo" ? "var(--red)" : semaforo === "amarillo" ? "var(--amber)" : "var(--emerald)"}
            trackColor="var(--line)" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={26} style={{ color: "var(--ink)", opacity: 0.5 }} fill="var(--pink)" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-utility opacity-60" style={{ color: "var(--ink)" }}>Saldo libre del mes</p>
          <p className="font-mono text-2xl font-semibold tabular-nums" style={{ color: "var(--ink)" }}>${fmt(libre)}</p>
          <p className="text-xs font-utility opacity-60 mt-0.5" style={{ color: "var(--ink)" }}>
            {Math.round(analytics.librePct)}% de tu ingreso queda disponible
          </p>
        </div>
      </div>

      {/* Three stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard icon={<ArrowUpRight size={16} />} label="Ingresos" value={curM.ingresos} color="var(--emerald)" />
        <StatCard icon={<ArrowDownRight size={16} />} label="Gastos" value={curM.gastos} color="var(--red)" />
        <StatCard icon={<PiggyBank size={16} />} label="Ahorro" value={curM.ahorro} color="var(--amber)" />
      </div>

      {/* Savings rate */}
      <div className="rounded-[20px] p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-utility uppercase tracking-wide opacity-60" style={{ color: "var(--ink)" }}>Tasa de ahorro</span>
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--emerald)" }}>{Math.round(tasaAhorro)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(tasaAhorro, 100)}%`, background: "var(--emerald)" }} />
        </div>
      </div>

      {/* Recommendations preview */}
      {topRecs.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[17px]" style={{ color: "var(--ink)" }}>Consejos para ti</h3>
            <button onClick={() => onNavigate("analisis")} className="text-xs font-utility flex items-center gap-0.5" style={{ color: "var(--emerald)" }}>
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          {topRecs.map((r, i) => <RecCard key={i} rec={r} />)}
        </div>
      )}

      {/* Goals preview */}
      {metasConProyeccion.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-display text-[17px]" style={{ color: "var(--ink)" }}>Metas de ahorro</h3>
          {metasConProyeccion.slice(0, 2).map((m) => <MetaPreview key={m.id} meta={m} />)}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-[18px] p-3.5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="mb-2" style={{ color }}>{icon}</div>
      <p className="text-[10px] font-utility uppercase tracking-wide opacity-60 mb-0.5" style={{ color: "var(--ink)" }}>{label}</p>
      <p className="font-mono text-[15px] font-semibold tabular-nums leading-tight" style={{ color: "var(--ink)" }}>${fmt(value)}</p>
    </div>
  );
}

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
        <div className="h-full rounded-full" style={{ width: `${meta.pct}%`, background: "var(--emerald)" }} />
      </div>
      <div className="flex items-center justify-between text-xs font-utility opacity-70" style={{ color: "var(--ink)" }}>
        <span>${fmt(meta.ahorroAcumulado || 0)} de ${fmt(meta.monto)}</span>
        {meta.mesesEstimados != null && <span>~{meta.mesesEstimados} meses</span>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   HISTORY
------------------------------------------------------------------------- */
function History({ data, onDelete }) {
  const [filterType, setFilterType] = useState("todos");
  const [filterCat, setFilterCat] = useState("todas");
  const [showFilters, setShowFilters] = useState(false);

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
            <option value="todos">Todos los tipos</option>
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
        <div className="text-center py-16">
          <p className="font-utility text-sm opacity-50" style={{ color: "var(--ink)" }}>Nada que mostrar todavía.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((x) => {
            const cfg = typeConfig[x.tipo];
            return (
              <div key={x.id} className="rounded-[16px] p-3.5 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--card-alt)", color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-utility text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                    {x.categoria ? `${catEmoji(x.categoria)} ${x.categoria}` : (x.fuente || x.observaciones || "Movimiento")}
                  </p>
                  <p className="text-xs font-utility opacity-55" style={{ color: "var(--ink)" }}>
                    {x.fecha} {x.metodo ? `· ${x.metodo}` : ""} {x.impulsivo ? "· Impulsivo" : ""}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold flex-shrink-0" style={{ color: cfg.color }}>
                  {cfg.sign}${fmt(x.valor)}
                </span>
                <button onClick={() => onDelete(x.tipo, x.id)} className="flex-shrink-0 opacity-40" aria-label="Eliminar">
                  <Trash2 size={15} style={{ color: "var(--ink)" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   ANALYSIS
------------------------------------------------------------------------- */
function Analysis({ analytics }) {
  if (!analytics) return null;
  const { monthly, catRanking, curM, limiteStatus, recs, impulsivoPct, smallTotal, smallCount } = analytics;
  const maxVal = Math.max(...monthly.map((m) => Math.max(m.ingresos, m.gastos)), 1);

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Análisis</h1>

      {/* Income vs expense bars */}
      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Ingresos vs. gastos por mes</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {monthly.slice(-6).map((m) => (
            <div key={m.month}>
              <div className="flex justify-between text-xs font-utility mb-1 opacity-70" style={{ color: "var(--ink)" }}>
                <span>{monthLabel(m.month)}</span>
                <span className="font-mono">${fmt(m.libre)} libre</span>
              </div>
              <div className="flex gap-1 h-2.5">
                <div className="rounded-full" style={{ width: `${(m.ingresos / maxVal) * 100}%`, background: "var(--emerald)" }} />
              </div>
              <div className="flex gap-1 h-2.5 mt-1">
                <div className="rounded-full" style={{ width: `${(m.gastos / maxVal) * 100}%`, background: "var(--red)" }} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-utility opacity-70" style={{ color: "var(--ink)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--emerald)" }} /> Ingresos
            </span>
            <span className="flex items-center gap-1.5 text-xs font-utility opacity-70" style={{ color: "var(--ink)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--red)" }} /> Gastos
            </span>
          </div>
        </div>
      </section>

      {/* Category breakdown */}
      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Gasto por categoría este mes</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {catRanking.length === 0 && <p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Sin gastos registrados este mes.</p>}
          {catRanking.map(([cat, val]) => {
            const pctOfIncome = curM.ingresos > 0 ? (val / curM.ingresos) * 100 : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs font-utility mb-1" style={{ color: "var(--ink)" }}>
                  <span className="opacity-80">{catEmoji(cat)} {cat}</span>
                  <span className="font-mono opacity-70">${fmt(val)} · {Math.round(pctOfIncome)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pctOfIncome * 2, 100)}%`, background: "var(--amber)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Budget vs limits */}
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

      {/* Behavior signals */}
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
        </div>
      </section>

      {/* All recommendations */}
      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Todos los consejos</h3>
        <div className="space-y-2.5">
          {recs.length === 0 ? (
            <p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Sin recomendaciones por ahora. Sigue registrando tus movimientos.</p>
          ) : recs.map((r, i) => <RecCard key={i} rec={r} />)}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------------
   GOALS & LIMITS
------------------------------------------------------------------------- */
function GoalsAndLimits({ data, analytics, onAddMeta, onUpdateMeta, onDeleteMeta, onUpdateLimit }) {
  const [showAddMeta, setShowAddMeta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaMeta, setFechaMeta] = useState("");

  const handleAddMeta = () => {
    const m = parseFloat(monto);
    if (!nombre.trim() || !m || m <= 0) return;
    onAddMeta({ id: uid(), nombre: nombre.trim(), monto: m, fecha: fechaMeta || null, ahorroAcumulado: 0 });
    setNombre(""); setMonto(""); setFechaMeta("");
    setShowAddMeta(false);
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-6">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Metas y límites</h1>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[16px]" style={{ color: "var(--ink)" }}>Metas de ahorro</h3>
          <button onClick={() => setShowAddMeta(true)} className="flex items-center gap-1 text-xs font-utility font-medium" style={{ color: "var(--emerald)" }}>
            <Plus size={14} /> Nueva
          </button>
        </div>
        <div className="space-y-3">
          {(analytics?.metasConProyeccion || []).map((m) => (
            <div key={m.id} className="rounded-[18px] p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-utility font-medium text-sm" style={{ color: "var(--ink)" }}>{m.nombre}</span>
                <button onClick={() => onDeleteMeta(m.id)} className="opacity-40"><Trash2 size={14} style={{ color: "var(--ink)" }} /></button>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2 mt-2" style={{ background: "var(--line)" }}>
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: "var(--emerald)" }} />
              </div>
              <div className="flex items-center justify-between text-xs font-utility opacity-70 mb-3" style={{ color: "var(--ink)" }}>
                <span>${fmt(m.ahorroAcumulado || 0)} de ${fmt(m.monto)}</span>
                {m.mesesEstimados != null && <span>~{m.mesesEstimados} meses</span>}
              </div>
              <div className="flex gap-2">
                <TextInput
                  type="number" placeholder="Añadir abono"
                  className="flex-1 !py-2 !text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseFloat(e.target.value);
                      if (val > 0) { onUpdateMeta(m.id, (m.ahorroAcumulado || 0) + val); e.target.value = ""; }
                    }
                  }}
                />
              </div>
            </div>
          ))}
          {(!analytics?.metasConProyeccion || analytics.metasConProyeccion.length === 0) && (
            <p className="text-sm font-utility opacity-50" style={{ color: "var(--ink)" }}>Aún no tienes metas. Crea la primera.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-display text-[16px] mb-3" style={{ color: "var(--ink)" }}>Límites mensuales por categoría</h3>
        <div className="rounded-[20px] p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          {CATS_GASTO.map((cat) => (
            <div key={cat} className="flex items-center justify-between gap-3">
              <span className="text-sm font-utility flex-1" style={{ color: "var(--ink)" }}>{catEmoji(cat)} {cat}</span>
              <TextInput
                type="number" defaultValue={data.limites[cat] || ""} placeholder="Sin límite"
                className="w-28 !py-2 !text-sm text-right"
                onBlur={(e) => onUpdateLimit(cat, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </section>

      <Sheet open={showAddMeta} onClose={() => setShowAddMeta(false)} title="Nueva meta de ahorro">
        <Field label="Nombre">
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cuota inicial vivienda" />
        </Field>
        <Field label="Monto objetivo">
          <TextInput type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Fecha meta (opcional)">
          <TextInput type="date" value={fechaMeta} onChange={(e) => setFechaMeta(e.target.value)} />
        </Field>
        <button onClick={handleAddMeta} className="w-full mt-2 rounded-xl py-3.5 font-utility font-semibold text-[15px]" style={{ background: "var(--lilac)", color: "#FFFFFF" }}>
          Crear meta
        </button>
      </Sheet>
    </div>
  );
}

/* ----------------------------------------------------------------------
   SETTINGS
------------------------------------------------------------------------- */
function SettingsView({ data, onToggleDark, onExport, error }) {
  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <h1 className="font-display text-[26px]" style={{ color: "var(--ink)" }}>Ajustes</h1>

      {error && (
        <div className="rounded-[16px] p-3.5 flex items-start gap-2.5" style={{ background: "var(--red-soft)" }}>
          <AlertTriangle size={16} style={{ color: "var(--red)", marginTop: 1 }} />
          <p className="text-[13px] font-utility leading-snug" style={{ color: "var(--ink)" }}>{error}</p>
        </div>
      )}

      <button
        onClick={onToggleDark}
        className="w-full rounded-[18px] p-4 flex items-center justify-between"
        style={{ background: "var(--card)", border: "1px solid var(--line)" }}
      >
        <span className="flex items-center gap-3 font-utility text-sm" style={{ color: "var(--ink)" }}>
          {data.darkMode ? <Moon size={17} /> : <Sun size={17} />}
          Modo oscuro
        </span>
        <div className="w-11 h-6 rounded-full p-0.5 transition-colors" style={{ background: data.darkMode ? "var(--emerald)" : "var(--line)" }}>
          <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: data.darkMode ? "translateX(20px)" : "translateX(0)" }} />
        </div>
      </button>

      <button
        onClick={onExport}
        className="w-full rounded-[18px] p-4 flex items-center justify-between"
        style={{ background: "var(--card)", border: "1px solid var(--line)" }}
      >
        <span className="flex items-center gap-3 font-utility text-sm" style={{ color: "var(--ink)" }}>
          <Download size={17} /> Exportar a CSV
        </span>
        <ChevronRight size={16} style={{ color: "var(--ink)", opacity: 0.4 }} />
      </button>

      <div className="rounded-[18px] p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <p className="text-xs font-utility opacity-60 leading-relaxed" style={{ color: "var(--ink)" }}>
          💌 Tus datos se guardan solitos, sin que hagas nada. Todo queda aquí en tu dispositivo, nadie más los ve.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   ROOT APP
------------------------------------------------------------------------- */
export default function App() {
  const { data, setData, loading, error } = useStorage();
  const analytics = useAnalytics(data);
  const [tab, setTab] = useState("dashboard");
  const [addSheet, setAddSheet] = useState(null); // 'gasto' | 'ingreso' | 'ahorro' | null
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

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: TOKENS.paper }}>
        <p className="font-utility text-sm" style={{ color: TOKENS.ink, opacity: 0.5 }}>Cargando tus datos…</p>
      </div>
    );
  }

  const updateAndSave = (mutator) => {
    const next = mutator(JSON.parse(JSON.stringify(data)));
    setData(next);
  };

  const handleAddMovement = (type) => (item) => {
    updateAndSave((d) => {
      if (type === "gasto") d.gastos.push(item);
      else if (type === "ingreso") d.ingresos.push(item);
      else if (type === "ahorro") {
        d.ahorros.push(item);
        if (item.meta) {
          const meta = d.metas.find((m) => m.id === item.meta);
          if (meta) meta.ahorroAcumulado = (meta.ahorroAcumulado || 0) + item.valor;
        }
      }
      return d;
    });
  };

  const handleDelete = (tipo, id) => {
    updateAndSave((d) => {
      if (tipo === "gasto") d.gastos = d.gastos.filter((x) => x.id !== id);
      else if (tipo === "ingreso") d.ingresos = d.ingresos.filter((x) => x.id !== id);
      else if (tipo === "ahorro") d.ahorros = d.ahorros.filter((x) => x.id !== id);
      return d;
    });
  };

  const handleAddMeta = (meta) => updateAndSave((d) => { d.metas.push(meta); return d; });
  const handleUpdateMeta = (id, ahorroAcumulado) => updateAndSave((d) => {
    const m = d.metas.find((x) => x.id === id);
    if (m) m.ahorroAcumulado = ahorroAcumulado;
    return d;
  });
  const handleDeleteMeta = (id) => updateAndSave((d) => { d.metas = d.metas.filter((m) => m.id !== id); return d; });
  const handleUpdateLimit = (cat, val) => updateAndSave((d) => { d.limites[cat] = val; return d; });
  const handleToggleDark = () => updateAndSave((d) => { d.darkMode = !d.darkMode; return d; });

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
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "dashboard", icon: Home, label: "Inicio" },
    { id: "historial", icon: Calendar, label: "Historial" },
    { id: "analisis", icon: BarChart3, label: "Análisis" },
    { id: "metas", icon: Target, label: "Metas" },
    { id: "ajustes", icon: Settings, label: "Ajustes" },
  ];

  return (
    <div style={cssVars} className="min-h-screen flex justify-center" >
      <style>{`
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .font-display { font-family: 'Fredoka', 'Quicksand', sans-serif; font-weight: 600; letter-spacing: -0.01em; }
        .font-utility { font-family: 'Quicksand', system-ui, sans-serif; }
        .font-mono { font-family: 'Quicksand', system-ui, sans-serif; font-weight: 600; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
        input:focus, select:focus, button:focus-visible {
          outline: 2px solid var(--emerald);
          outline-offset: 1px;
        }
      `}</style>
      
      <div className="w-full max-w-md min-h-screen flex flex-col" style={{ background: "var(--paper)" }}>
        <div className="flex-1 overflow-y-auto pb-24" style={{ animation: "fadeIn 0.2s ease-out" }}>
          {tab === "dashboard" && <Dashboard analytics={analytics} onNavigate={setTab} />}
          {tab === "historial" && <History data={data} onDelete={handleDelete} />}
          {tab === "analisis" && <Analysis analytics={analytics} />}
          {tab === "metas" && (
            <GoalsAndLimits
              data={data} analytics={analytics}
              onAddMeta={handleAddMeta} onUpdateMeta={handleUpdateMeta}
              onDeleteMeta={handleDeleteMeta} onUpdateLimit={handleUpdateLimit}
            />
          )}
          {tab === "ajustes" && (
            <SettingsView data={data} onToggleDark={handleToggleDark} onExport={handleExport} error={error} />
          )}
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 w-full max-w-md flex items-center justify-around px-2 pt-2 pb-safe"
          style={{ background: "var(--paper)", borderTop: "1px solid var(--line)" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 flex-1"
              >
                <Icon size={20} style={{ color: active ? "var(--emerald)" : "var(--ink)", opacity: active ? 1 : 0.45 }} />
                <span className="text-[10px] font-utility" style={{ color: active ? "var(--emerald)" : "var(--ink)", opacity: active ? 1 : 0.45 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floating add button */}
        <div className="fixed" style={{ bottom: "76px", right: "calc(50% - 200px + 16px)" }}>
          {addMenuOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2 items-end">
              {[
                { type: "ingreso", label: "Ingreso", color: "var(--emerald)" },
                { type: "ahorro", label: "Ahorro", color: "var(--amber)" },
                { type: "gasto", label: "Gasto", color: "var(--red)" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => { setAddSheet(opt.type); setAddMenuOpen(false); }}
                  className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full shadow-lg"
                  style={{ background: "var(--card)", border: "1px solid var(--line)" }}
                >
                  <span className="text-sm font-utility font-medium" style={{ color: "var(--ink)" }}>{opt.label}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setAddMenuOpen((s) => !s)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, var(--lilac), var(--pink))" }}
            aria-label="Agregar movimiento"
          >
            <Plus size={26} style={{ color: "#FFFFFF", transform: addMenuOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      <AddMovementSheet
        open={!!addSheet} onClose={() => setAddSheet(null)} type={addSheet}
        onSave={handleAddMovement(addSheet)}
      />
    </div>
  );
}
