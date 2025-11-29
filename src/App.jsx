import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// --- Referansedata for klimamål ------------------------------------------------
// Kilder:
// - SSB: https://www.ssb.no/natur-og-miljo/miljoregnskap/statistikk/utslipp-til-luft
// - Regjeringen: https://www.regjeringen.no/no/aktuelt/norge-har-meldt-inn-sitt-nye-klimamal-til-fn/id3112346/
// - Miljødirektoratet: https://www.miljodirektoratet.no/
const CLIMATE_CONTEXT = {
  baseline1990: 52.0,  // Mt CO2e - Norges utslipp i 1990 (referanseår)
  current2023: 48.0,   // Mt CO2e - Siste tilgjengelige tall (2023)
  targets: {
    "70% kutt": { year: 2035, reduction: 0.70, level: 52 * (1 - 0.70) },   // 15.6 Mt
    "75% kutt": { year: 2035, reduction: 0.75, level: 52 * (1 - 0.75) },   // 13.0 Mt
  },
  sources: {
    ssb: "https://www.ssb.no/natur-og-miljo/miljoregnskap/statistikk/utslipp-til-luft",
    regjeringen: "https://www.regjeringen.no/no/aktuelt/norge-har-meldt-inn-sitt-nye-klimamal-til-fn/id3112346/",
    mdir: "https://www.miljodirektoratet.no/publikasjoner/2025/januar-2025/klimatiltak-i-norge-kunnskapsgrunnlag-2025/",
  }
};

// --- Hjelpefunksjon for å generere URL til Miljødirektoratets tiltaksark -----
const CATEGORY_URL_MAP = {
  "Landtransport": "landtransport-maskiner-og-luftfart",
  "Sjøfart": "sjofart-fiske-og-havbruk",
  "Industri": "industri-og-energiforsyning",
  "Petroleum": "olje-og-gassutvinning",
  "Jordbruk": "jordbruk",
  "Andre": "andre-utslipp",
  "Skog og arealbruk": "skog-og-arealbruk",
};

function getMdirUrl(measure) {
  // Ekstraher ID (f.eks. "T01", "S01", "I01") fra tittelen
  const match = measure.t.match(/^([A-Z]\d+(-\d+)?)/);
  if (!match) return null;
  const id = match[1].toLowerCase();
  
  // Lag slug fra tittelen (fjern ID-prefix, lowercase, erstatt mellomrom med bindestrek)
  const titleWithoutId = measure.t.replace(/^[A-Z]\d+(-\d+)?\s+/, '');
  const slug = titleWithoutId
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const categoryPath = CATEGORY_URL_MAP[measure.c] || 'andre-utslipp';
  return `https://www.miljodirektoratet.no/tjenester/klimatiltak/tiltaksark-2025/${categoryPath}/${id}-${slug}/`;
}

// --- Data --------------------------------------------------------------------
// Kilde: Miljødirektoratet, Klimatiltak i Norge – Kunnskapsgrunnlag 2025 (M 2920), s. 13-16
// p = Potensial for utslippskutt 2035 i 1000 tonn CO2-ekv (kt)
// cost = Tiltakskostnad i kr/tonn (null = ikke vurdert, 0 = lav/negativ)
const MEASURES = [
  // ============================================================================
  // LANDTRANSPORT, MASKINER OG LUFTFART (T01-T27)
  // ============================================================================
  { t: "T01 Transporteffektiv arealplanlegging", c: "Landtransport", p: 35, cost: 0 },
  { t: "T02 Økt bruk av hjemmekontor", c: "Landtransport", p: 10, cost: 0 },
  { t: "T03 Økt bruk av digitale møter", c: "Landtransport", p: 103, cost: 0 },
  { t: "T04 Transportmiddelskifte fra bil til gange og sykkel", c: "Landtransport", p: 16, cost: 0 },
  { t: "T05 Transportmiddelskifte fra bil til kollektivtransport på korte reiser", c: "Landtransport", p: 51, cost: 0 },
  { t: "T06 Transportmiddelskifte fra bil til kollektivtransport på lange reiser", c: "Landtransport", p: 21, cost: 0 },
  { t: "T07 Økt samkjøring og bildeling", c: "Landtransport", p: 10, cost: 0 },
  { t: "T08 Transportmiddelskifte fra fly til jernbane", c: "Landtransport", p: 61, cost: null },
  { t: "T09 Redusert fartsgrense på motorveier", c: "Landtransport", p: 8, cost: 36000 },
  { t: "T10 Alle nye personbiler er elektriske i 2025", c: "Landtransport", p: 19, cost: 1500 },
  { t: "T11 Elektrifisering av bybusser", c: "Landtransport", p: 55, cost: 500 },
  { t: "T12 Elektrifisering av langdistansebusser", c: "Landtransport", p: 55, cost: 2000 },
  { t: "T13 Elektrifisering av motorsykler, mopeder og snøscootere", c: "Landtransport", p: 46, cost: null },
  { t: "T14 Nullutslippsløsninger for jernbane", c: "Landtransport", p: 40, cost: 1500 },
  { t: "T15 Hybride eller elektriske fly på kortbanenettet", c: "Landtransport", p: 40, cost: null },
  { t: "T16 Avansert biodrivstoff og syntetisk drivstoff i luftfart", c: "Landtransport", p: 137, cost: 5500 },
  { t: "T17 Logistikkoptimalisering av varetransport", c: "Landtransport", p: 149, cost: 0 },
  { t: "T18 Økte godsandeler på bane", c: "Landtransport", p: 18, cost: null },
  { t: "T19 Økte godsandeler på sjø", c: "Landtransport", p: 26, cost: null },
  { t: "T20 Tyngre og lengre vogntog", c: "Landtransport", p: 24, cost: null },
  { t: "T21 Økokjøring for lastebiler", c: "Landtransport", p: 48, cost: 0 },
  { t: "T22 Alle nye varebiler er elektriske i 2027", c: "Landtransport", p: 118, cost: 1250 },
  { t: "T23 100 % av nye lastebiler bruker nullutslippsteknologi eller biogass i 2030", c: "Landtransport", p: 1405, cost: 1500 },
  { t: "T24 Bedre logistikk og effektivisering i bygge- og anleggsprosjekter", c: "Landtransport", p: 50, cost: 0 },
  { t: "T25 Alle nye maskiner til bygge- og anleggsplasser er nullutslipp i 2030", c: "Landtransport", p: 357, cost: 1750 },
  { t: "T26 Overgang til nullutslippsmaskiner i jordbruket", c: "Landtransport", p: 41, cost: null },
  { t: "T27 Innfasing av nullutslippsmaskiner i andre næringer", c: "Landtransport", p: 315, cost: 1750 },

  // ============================================================================
  // SJØFART, FISKE OG HAVBRUK (S01-S04)
  // ============================================================================
  { t: "S01 Nullutslippsløsninger i offentlig passasjertransport på sjø", c: "Sjøfart", p: 317, cost: 2000 },
  { t: "S02 Landstrøm og batterielektrifisering", c: "Sjøfart", p: 188, cost: 2750 },
  { t: "S03 Overgang til hydrogenbaserte drivstoff i sjøfarten", c: "Sjøfart", p: 493, cost: 2500 },
  { t: "S04 Overgang til biogass i sjøfarten", c: "Sjøfart", p: 141, cost: 6000 },

  // ============================================================================
  // INDUSTRI OG ENERGIFORSYNING (I01-I09)
  // ============================================================================
  { t: "I01 Karbonfangst og -lagring (CCS) på avfallsforbrenningsanlegg", c: "Industri", p: 797, cost: 1750 },
  { t: "I02 Karbonfangst og -lagring (CCS) på industrianlegg", c: "Industri", p: 3463, cost: 1250 },
  { t: "I03 Karbonfangst og lagring av CO2 fra omgivelsesluft", c: "Industri", p: 806, cost: 4000 },
  { t: "I04 Økt bruk av biomasse i industriprosesser", c: "Industri", p: 1642, cost: 750 },
  { t: "I05 Overgang til bruk av grønt hydrogen i industriprosesser", c: "Industri", p: 620, cost: 6500 },
  { t: "I06 Direkte og indirekte elektrifisering av industriprosesser", c: "Industri", p: 259, cost: null },
  { t: "I07 Konvertering fra fossil fyring i industrien", c: "Industri", p: 533, cost: 3750 },
  { t: "I08 Reduksjon av andre klimagasser fra eksisterende industriprosesser", c: "Industri", p: 137, cost: 250 },
  { t: "I09 Energiomstilling i Longyearbyen", c: "Industri", p: 40, cost: null },

  // ============================================================================
  // PETROLEUM (P01-P05)
  // ============================================================================
  { t: "P01 Elektrifisering i petroleumssektoren", c: "Petroleum", p: 2139, cost: 2100 },
  { t: "P02 Kraft fra flytende gasskraftverk med CCS", c: "Petroleum", p: 0, cost: null },
  { t: "P03 Økt gjenvinning av metan og NMVOC ved råoljelasting offshore", c: "Petroleum", p: 24, cost: null },
  { t: "P04 Reduksjon av utslipp av metan og NMVOC fra kaldventilering offshore", c: "Petroleum", p: 0, cost: null },
  { t: "P05 Reduksjon av metan og NMVOC fra petroleumsanlegg på land", c: "Petroleum", p: 29, cost: null },

  // ============================================================================
  // JORDBRUK (J01-J13)
  // ============================================================================
  { t: "J01 Forbruk i tråd med nasjonale kostråd", c: "Jordbruk", p: 2254, cost: 250 },
  { t: "J02 Redusert matsvinn", c: "Jordbruk", p: 102, cost: 250 },
  { t: "J03 Husdyrgjødsel til biogass", c: "Jordbruk", p: 27, cost: 250 },
  { t: "J04-1 Dekke på gjødsellager svin", c: "Jordbruk", p: 3, cost: 1000 },
  { t: "J04-2 Miljøvennlig spredning", c: "Jordbruk", p: 12, cost: 5000 },
  { t: "J04-3 Bedre spredetidspunkt og lagerkapasitet", c: "Jordbruk", p: 1, cost: 3000 },
  { t: "J05 Stans i nydyrking av myr", c: "Jordbruk", p: 103, cost: 250 },
  { t: "J06 Fangvekster", c: "Jordbruk", p: 79, cost: 1200 },
  { t: "J07 Biokull", c: "Jordbruk", p: 82, cost: 250 },
  { t: "J09 Metanhemmere i fôr til melkeku", c: "Jordbruk", p: 70, cost: null },
  { t: "J10 Redusere omdisponering fra skog til jordbruksformål", c: "Jordbruk", p: 670, cost: null },
  { t: "J11 Kantvegetasjon mellom vassdrag og jordbruksareal", c: "Jordbruk", p: 13, cost: null },
  { t: "J12 Restaurering av organisk jordbruksjord", c: "Jordbruk", p: 72, cost: 250 },
  { t: "J13 Økt beiting for storfe", c: "Jordbruk", p: 8, cost: null },

  // ============================================================================
  // ANDRE KLIMATILTAK (A01, E01, O01-O03, F01)
  // ============================================================================
  { t: "A01 Økt uttak av metan fra avfallsdeponi", c: "Andre", p: 73, cost: null },
  { t: "E01 Økt utsortering av brukte tekstiler til materialgjenvinning", c: "Andre", p: 0, cost: null },
  { t: "O01 Utfasing av bruk av gass til byggvarme", c: "Andre", p: 24, cost: 1500 },
  { t: "O02 Forsert utskifting av vedovner", c: "Andre", p: 108, cost: 750 },
  { t: "O03 Utfasing av gass til permanent oppvarming av bygg", c: "Andre", p: 167, cost: 1500 },
  { t: "F01 Økt innsamling og destruksjon av brukt HFK", c: "Andre", p: 0, cost: 250 },

  // ============================================================================
  // SKOG- OG AREALBRUK (L01-L11)
  // ============================================================================
  { t: "L01 Redusert nedbygging", c: "Skog og arealbruk", p: 1700, cost: null },
  { t: "L02 Skogplanteforedling", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L03-1 Treslagsvalg etter hogst", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L03-2 Tilfredsstillende foryngelse", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L04 Økt plantetetthet", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L05 Ungskogpleie", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L06 Nitrogengjødsling av skog", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L07 Hogsttidspunkt", c: "Skog og arealbruk", p: 0, cost: null },
  { t: "L08 Råtebekjempelse", c: "Skog og arealbruk", p: 0, cost: 250 },
  { t: "L09 Planting av skog på nye arealer", c: "Skog og arealbruk", p: 0, cost: null },
  { t: "L10 Utfasing av uttak av torv", c: "Skog og arealbruk", p: 40, cost: null },
  { t: "L11 Myrrestaurering", c: "Skog og arealbruk", p: 0, cost: null },
];

const ALL_BINS = ["<0", "0-500", "500-1500", ">1500"];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function nb(n, d = 2) {
  return n.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: d });
}

// Custom tooltip for cost range chart
function CostRangeTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#F7F3E8] border border-[#C9B27C]/80 rounded-xl p-3 shadow-lg font-serif text-sm">
      <p className="font-semibold text-[#2F5D3A] mb-1">{label}</p>
      <p>Potensial: <span className="font-semibold">{nb(data.potMt, 2)} Mt</span></p>
      <p>Antall tiltak: <span className="font-semibold">{data.count}</span></p>
      <p className="text-xs text-[#2A2A2A]/70 mt-1">
        {data.count > 0 ? `Snitt: ${nb(data.potMt / data.count, 3)} Mt per tiltak` : ''}
      </p>
    </div>
  );
}

// Custom tooltip for sector chart
function SectorTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#F7F3E8] border border-[#C9B27C]/80 rounded-xl p-3 shadow-lg font-serif text-sm">
      <p className="font-semibold text-[#2F5D3A] mb-1">{data.kategori}</p>
      <p>Potensial: <span className="font-semibold">{nb(data.potMt, 2)} Mt</span></p>
      <p>Kostnad: <span className="font-semibold">{nb(data.cost, 1)} mrd kr</span></p>
      <p>Antall tiltak: <span className="font-semibold">{data.count}</span></p>
      <p className="text-xs text-[#2A2A2A]/70 mt-1">
        Snitt tiltakskost: {data.potKt > 0 ? nb((data.cost * 1e6) / data.potKt, 0) + ' kr/t' : '—'}
      </p>
    </div>
  );
}

// --- URL & localStorage State Helpers ----------------------------------------
const STORAGE_KEY = 'klimakur-prestige-state';

function parseUrlState() {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    return JSON.parse(decodeURIComponent(hash));
  } catch {
    return null;
  }
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    if (Object.keys(state).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function encodeUrlState(state) {
  return '#' + encodeURIComponent(JSON.stringify(state));
}

export default function KlimakurPrestigeDashboard() {
  // Parse initial state from URL (priority) or localStorage (fallback)
  const initialUrlState = useMemo(() => parseUrlState() || loadFromStorage(), []);
  
  // Overstyring av kostnad per tiltak (tiltaksnavn -> kr/tonn)
  const [costOverrides, setCostOverrides] = useState(
    () => initialUrlState?.o || {}
  );
  
  // Standardkostnad for tiltak uten vurdert kostnad (null → bruk denne)
  const [defaultUnknownCost, setDefaultUnknownCost] = useState(
    () => initialUrlState?.d ?? 1500
  );
  
  // Valgt klimamål for sammenligning (Norges vedtatte 2035-mål: 70-75% kutt fra 1990)
  const [selectedTarget, setSelectedTarget] = useState(
    () => initialUrlState?.t || "70% kutt"
  );
  const [filterCat, setFilterCat] = useState("Alle");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState(null); // null | "potensialKt" | "tiltak" | "kategori" | "kostnad"
  const [sortDirection, setSortDirection] = useState("desc"); // "asc" | "desc"

  // --- Utvalg av tiltak (huke av/på) ----------------------------------------
  const [selected, setSelected] = useState(() => {
    // Hvis URL har liste over deselected (x), start med alle og fjern disse
    if (initialUrlState?.x) {
      const allSet = new Set(MEASURES.map((m) => m.t));
      initialUrlState.x.forEach((idx) => {
        if (MEASURES[idx]) allSet.delete(MEASURES[idx].t);
      });
      return allSet;
    }
    return new Set(MEASURES.map((m) => m.t));
  });
  
  // Kopier-lenke state
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Oppdater URL og localStorage når state endres
  useEffect(() => {
    const deselectedIndices = MEASURES
      .map((m, i) => selected.has(m.t) ? null : i)
      .filter((i) => i !== null);
    
    const state = {};
    if (deselectedIndices.length > 0) state.x = deselectedIndices;
    if (Object.keys(costOverrides).length > 0) state.o = costOverrides;
    if (defaultUnknownCost !== 1500) state.d = defaultUnknownCost;
    if (selectedTarget !== "70% kutt") state.t = selectedTarget;
    
    // Lagre til localStorage
    saveToStorage(state);
    
    // Oppdater URL hash
    const newHash = Object.keys(state).length > 0 ? encodeUrlState(state) : '';
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash || window.location.pathname);
    }
  }, [selected, costOverrides, defaultUnknownCost, selectedTarget]);
  
  // Kopier delbar lenke til utklippstavle
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Kunne ikke kopiere lenke:', err);
    }
  };

  const categories = useMemo(() => {
    const set = new Set(MEASURES.map((m) => m.c));
    return ["Alle", ...Array.from(set)];
  }, []);

  // Hent enhetskost for tiltak (bruker override hvis satt, ellers original, ellers default for ukjente)
  function getUnitCost(m) {
    if (costOverrides[m.t] !== undefined) {
      return costOverrides[m.t];
    }
    if (m.cost === null) {
      return defaultUnknownCost; // Bruk standardantakelse for ukjente
    }
    return m.cost;
  }
  
  // Sjekk om tiltak har ukjent kostnad (bruker standardantakelse)
  function hasUnknownCost(m) {
    return m.cost === null && costOverrides[m.t] === undefined;
  }

  // Kostnad per tiltak (mrd. kr)
  // Potensial er i 1000 tonn (kt), enhetskost i kr/tonn
  // kt * 1000 t/kt * kr/t = kr, delt på 1e9 = mrd kr
  function itemCostMrd(m) {
    const unit = getUnitCost(m);
    return (m.p * unit) / 1e6; // kt * kr/t / 1e6 = mrd kr
  }

  // Potensial i Mt (millioner tonn)
  function potensialMt(m) {
    return m.p / 1000;
  }

  const rowsAll = useMemo(() => {
    const base = MEASURES;
    return base.map((m) => ({
      tiltak: m.t,
      kategori: m.c,
      potensialKt: m.p,
      potensialMt: m.p / 1000,
      enhetskost: getUnitCost(m),
      originalCost: m.cost,
      hasOverride: costOverrides[m.t] !== undefined,
      hasUnknownCost: hasUnknownCost(m),
      sumMrd: itemCostMrd(m),
    }));
  }, [costOverrides, defaultUnknownCost]);

  // Map for rask oppslag av rows
  const rowsMap = useMemo(() => {
    return new Map(rowsAll.map((r) => [r.tiltak, r]));
  }, [rowsAll]);

  // Original rekkefølge basert på indeks
  const originalOrder = useMemo(() => {
    const base = MEASURES;
    return new Map(base.map((m, idx) => [m.t, idx]));
  }, []);

  const measures = useMemo(() => {
    const base = MEASURES;
    let filtered = base
      .filter((m) => (filterCat === "Alle" ? true : m.c === filterCat))
      .filter((m) => (search.trim() ? m.t.toLowerCase().includes(search.toLowerCase()) : true));
    
    // Sortering
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal, bVal;
        
        if (sortColumn === "potensialKt") {
          aVal = a.p;
          bVal = b.p;
        } else if (sortColumn === "tiltak") {
          aVal = a.t;
          bVal = b.t;
        } else if (sortColumn === "kategori") {
          aVal = a.c;
          bVal = b.c;
        } else if (sortColumn === "kostnad") {
          const aRow = rowsMap.get(a.t);
          const bRow = rowsMap.get(b.t);
          if (!aRow || !bRow) return 0;
          aVal = aRow.sumMrd;
          bVal = bRow.sumMrd;
        } else {
          return 0;
        }
        
        // Sortering: desc = høyest først, asc = lavest først
        if (typeof aVal === "string") {
          const comparison = aVal.localeCompare(bVal);
          return sortDirection === "desc" ? -comparison : comparison;
        } else {
          // For numeriske verdier: desc = b - a (høyest først), asc = a - b (lavest først)
          return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
        }
      });
    } else {
      // Ingen sortering - bruk original rekkefølge
      filtered = [...filtered].sort((a, b) => {
        const aIdx = originalOrder.get(a.t) ?? 999;
        const bIdx = originalOrder.get(b.t) ?? 999;
        return aIdx - bIdx;
      });
    }
    
    return filtered;
  }, [filterCat, search, sortColumn, sortDirection, rowsMap, originalOrder]);

  const rowsSelected = useMemo(() => {
    return rowsAll.filter((r) => selected.has(r.tiltak));
  }, [rowsAll, selected]);

  const totals = useMemo(() => {
    const potKt = rowsSelected.reduce((a, r) => a + r.potensialKt, 0);
    const potMt = potKt / 1000;
    const cost = rowsSelected.reduce((a, r) => a + (r.sumMrd ?? 0), 0);
    // avg i kr/t: mrd kr * 1e9 / (kt * 1e3) = mrd * 1e6 / kt
    return { potKt, potMt, cost, avg: potKt > 0 ? (cost * 1e6) / potKt : 0 };
  }, [rowsSelected]);

  // Beregn gap til klimamål
  const targetAnalysis = useMemo(() => {
    const target = CLIMATE_CONTEXT.targets[selectedTarget];
    const current = CLIMATE_CONTEXT.current2023;
    const baseline = CLIMATE_CONTEXT.baseline1990;
    const targetLevel = target.level;
    
    // Nødvendig kutt fra dagens nivå
    const requiredReduction = current - targetLevel;
    
    // Hvor mye dekker valgte tiltak?
    const covered = totals.potMt;
    
    // Gap (hva mangler?)
    const gap = Math.max(0, requiredReduction - covered);
    
    // Prosent av nødvendig kutt
    const coveragePercent = requiredReduction > 0 ? (covered / requiredReduction) * 100 : 0;
    
    // Resulterende utslippsnivå hvis alle valgte tiltak gjennomføres
    const resultingLevel = current - covered;
    
    return {
      target,
      current,
      baseline,
      targetLevel,
      requiredReduction,
      covered,
      gap,
      coveragePercent,
      resultingLevel,
      reachesTarget: resultingLevel <= targetLevel,
    };
  }, [selectedTarget, totals.potMt]);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const r of rowsSelected) {
      const cur = map.get(r.kategori) ?? { potKt: 0, potMt: 0, cost: 0, count: 0 };
      cur.potKt += r.potensialKt;
      cur.potMt += r.potensialMt;
      cur.cost += r.sumMrd ?? 0;
      cur.count += 1;
      map.set(r.kategori, cur);
    }
    return Array.from(map, ([kategori, v]) => ({ 
      kategori, 
      potKt: v.potKt, 
      potMt: v.potMt, 
      cost: v.cost,
      count: v.count 
    })).sort((a, b) => a.kategori.localeCompare(b.kategori));
  }, [rowsSelected]);

  // Gruppér etter kostnadsnivå (for graf)
  const byCostRange = useMemo(() => {
    const ranges = [
      { label: "Antatt", min: "antatt", max: null },
      { label: "<500", min: -Infinity, max: 500 },
      { label: "500–1500", min: 500, max: 1500 },
      { label: "1500–3000", min: 1500, max: 3000 },
      { label: ">3000", min: 3000, max: Infinity },
    ];
    return ranges.map(({ label, min, max }) => {
      const items = rowsSelected.filter((r) => {
        if (min === "antatt") return r.hasUnknownCost;
        if (r.hasUnknownCost) return false;
        return r.enhetskost >= min && r.enhetskost < max;
      });
      return {
        label,
        potMt: items.reduce((a, r) => a + r.potensialMt, 0),
        cost: items.reduce((a, r) => a + (r.sumMrd ?? 0), 0),
        count: items.length,
      };
    });
  }, [rowsSelected]);

  function resetOverrides() {
    setCostOverrides({});
  }
  
  function resetAll() {
    setCostOverrides({});
    setDefaultUnknownCost(1500);
    setSelectedTarget("70% kutt");
    setSelected(new Set(MEASURES.map((m) => m.t)));
    setFilterCat("Alle");
    setSearch("");
    setSortColumn(null);
    // Fjern lagret state
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    // Fjern URL hash
    window.history.replaceState(null, '', window.location.pathname);
  }

  // --- Select helpers --------------------------------------------------------
  const filteredIds = useMemo(() => measures.map((m) => m.t), [measures]);
  const allFilteredSelected = filteredIds.every((id) => selected.has(id)) && filteredIds.length > 0;
  const noneFilteredSelected = filteredIds.every((id) => !selected.has(id));

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) next.add(id);
      return next;
    });
  }
  function deselectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) next.delete(id);
      return next;
    });
  }

  // --- Sortering -------------------------------------------------------------
  function handleSort(column) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  function resetSort() {
    setSortColumn(null);
    setSortDirection("desc");
  }

  function SortIcon({ column }) {
    if (sortColumn !== column) {
      return <span className="opacity-30">↕</span>;
    }
    return sortDirection === "asc" ? <span>↑</span> : <span>↓</span>;
  }

  // --- Prestige diploma layout ----------------------------------------------
  return (
    <div className="min-h-screen bg-[#F7F3E8] text-[#2a2a2a] font-serif">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Academic front page header */}
        <header className="relative pb-10 mb-8 border-b border-[#C9B27C]/60">
          {/* Crest / watermark */}
          <div className="pointer-events-none select-none absolute right-4 top-0 opacity-10 text-[5rem] leading-none text-[#2F5D3A]">
            KiN
          </div>
          <p className="text-xs tracking-[0.25em] uppercase text-[#2F5D3A] mb-3">
            Bellona · Klimatiltak i Norge 2025 – Analytisk verktøy
          </p>
          <h1 className="text-4xl md:text-5xl text-[#2F5D3A] tracking-wide mb-3">
            Klimatiltak mot 2035
          </h1>
          <h2 className="text-lg italic text-[#2F5D3A]/80 mb-6">
            Potensial for utslippskutt og kostnader basert på Kunnskapsgrunnlag 2025
          </h2>
          <div className="text-base leading-relaxed">
            <p>
              <span className="text-4xl sm:text-5xl float-left leading-none pr-2 sm:pr-3 text-[#2F5D3A] font-semibold">
                D
              </span>
              ette dashbordet tar utgangspunkt i Miljødirektoratets «Klimatiltak i Norge – Kunnskapsgrunnlag 2025» og viser hvordan ulike tiltak og kostnadskategorier påvirker både samlede utslippsreduksjoner og anslåtte kostnader. Juster antakelser, filtrer på kategorier og utforsk hvordan porteføljen av tiltak ser ut.
            </p>
            <div className="mt-4 p-4 bg-[#F3EBD9] border border-[#C9B27C]/70 rounded-2xl text-sm leading-relaxed shadow-sm">
              <p className="font-semibold text-[#2F5D3A] mb-1">Hva betyr «tiltakskost»?</p>
              <p className="text-[#2A2A2A]">
                Tiltakskost er et samfunnsøkonomisk mål som brukes av Miljødirektoratet: summen av alle reelle kostnader 
                ved et klimatiltak – som investeringer, drift og teknologikostnader – minus eventuelle samfunnsøkonomiske
                gevinster. Resultatet fordeles på tonn CO₂‑ekvivalent redusert for å uttrykke hvor mye ressursbruk hvert
                kutt krever. Skatter, avgifter og subsidier inngår ikke, fordi de kun flytter penger mellom aktører og ikke
                påvirker den faktiske ressursbruken i samfunnet.
                <br /><br />
                Tiltakskost kan derfor brukes som et omtrentlig øvre nivå for hvor høy budsjettsubsidie per tonn det er
                samfunnsøkonomisk fornuftig å gi for å utløse et tiltak. Dersom offentlige støtteordninger ligger høyere
                enn tiltakskost, betyr det i utgangspunktet at staten betaler mer enn den reelle ressurskostnaden for samme
                utslippsreduksjon – med mindre formålet også omfatter teknologiutvikling, næringsbygging eller andre
                hensyn som ligger utenfor selve klimakuttet.
              </p>
            </div>
          </div>
          <div className="mt-6 h-[3px] w-24 bg-[#C9B27C]" />
        </header>

        {/* Dashboard body */}
        <main className="space-y-8">
          {/* Klimamål-kontekst */}
          <section className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div>
                <h2 className="text-lg text-[#2F5D3A] tracking-wide">Veien til klimamålet 2035</h2>
                <p className="text-xs italic opacity-70">
                  Norge har vedtatt 70–75 % kutt fra 1990-nivå innen 2035
              </p>
            </div>
                  <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="border border-[#C9B27C] bg-[#F7F3E8] text-[#2F5D3A] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D3A]/30"
              >
                {Object.keys(CLIMATE_CONTEXT.targets).map((t) => (
                  <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
            </div>

            {/* Forklaring av beregning */}
            <div className="text-sm text-[#2A2A2A]/80 mb-4 leading-relaxed">
              <strong className="text-[#2F5D3A]">Beregning:</strong> Utslipp i 1990 × (1 − {selectedTarget.replace(" kutt", "")}) = maksimalt tillatt utslipp i 2035. 
              Differansen mellom dagens utslipp (2023) og dette målet er hvor mye som må kuttes.
            </div>

            {/* Nøkkeltall-rad */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-[#2F5D3A]/70 mb-1">Utslipp 1990</div>
                <div className="text-xl text-[#2F5D3A] font-semibold">{nb(CLIMATE_CONTEXT.baseline1990, 1)} Mt</div>
                <div className="text-[10px] text-[#2A2A2A]/50">referanseår</div>
              </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-[#2F5D3A]/70 mb-1">Utslipp 2023</div>
                <div className="text-xl text-[#2F5D3A] font-semibold">{nb(targetAnalysis.current, 1)} Mt</div>
                <div className="text-[10px] text-[#2A2A2A]/50">dagens nivå</div>
              </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-[#2F5D3A]/70 mb-1">Mål 2035</div>
                <div className="text-xl text-[#2F5D3A] font-semibold">{nb(targetAnalysis.targetLevel, 1)} Mt</div>
                <div className="text-[10px] text-[#2A2A2A]/50">maks tillatt</div>
              </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-[#2F5D3A]/70 mb-1">Må kuttes</div>
                <div className="text-xl text-[#8B4513] font-semibold">{nb(targetAnalysis.requiredReduction, 1)} Mt</div>
                <div className="text-[10px] text-[#2A2A2A]/50">2023 → 2035</div>
              </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-[#2F5D3A]/70 mb-1">Valgte tiltak</div>
                <div className="text-xl text-[#2F5D3A] font-semibold">{nb(targetAnalysis.covered, 1)} Mt</div>
                <div className="text-[10px] text-[#2A2A2A]/50">potensial</div>
              </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-[#2F5D3A]/70 mb-1">Gap</div>
                <div className={`text-xl font-semibold ${targetAnalysis.gap > 0 ? 'text-[#8B4513]' : 'text-[#2F5D3A]'}`}>
                  {targetAnalysis.gap > 0 ? nb(targetAnalysis.gap, 1) + " Mt" : "✓"}
                </div>
                <div className="text-[10px] text-[#2A2A2A]/50">{targetAnalysis.gap > 0 ? "gjenstår" : "dekket"}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#2F5D3A]/70 mb-1">
                <span>Dekningsgrad</span>
                <span className="font-semibold text-[#2F5D3A]">{nb(targetAnalysis.coveragePercent, 0)}%</span>
              </div>
              <div className="relative h-4 bg-[#E8DCC8] rounded-full overflow-hidden border border-[#C9B27C]/50">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-[#2F5D3A]"
                  style={{ width: `${Math.min(100, targetAnalysis.coveragePercent)}%` }}
                />
              </div>
                </div>

            {/* Status-melding */}
            {!targetAnalysis.reachesTarget ? (
              <div className="text-sm text-[#2A2A2A] bg-[#F7F3E8] border border-[#C9B27C]/50 rounded-xl p-3">
                <span className="font-semibold text-[#2F5D3A]">Status:</span> Valgte tiltak kutter {nb(targetAnalysis.covered, 1)} Mt og gir utslipp på {nb(targetAnalysis.resultingLevel, 1)} Mt i 2035. 
                Målet er {nb(targetAnalysis.targetLevel, 1)} Mt – det gjenstår {nb(targetAnalysis.gap, 1)} Mt i kutt.
              </div>
            ) : (
              <div className="text-sm text-[#2A2A2A] bg-[#F7F3E8] border border-[#2F5D3A]/30 rounded-xl p-3">
                <span className="font-semibold text-[#2F5D3A]">✓ Målet nås:</span> Valgte tiltak kutter {nb(targetAnalysis.covered, 1)} Mt og gir utslipp på {nb(targetAnalysis.resultingLevel, 1)} Mt – 
                under målet på {nb(targetAnalysis.targetLevel, 1)} Mt.
              </div>
            )}

            <div className="mt-4 text-xs text-[#2A2A2A]/60">
              Kilder: <a href={CLIMATE_CONTEXT.sources.ssb} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2F5D3A]">SSB</a> · 
              <a href={CLIMATE_CONTEXT.sources.regjeringen} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2F5D3A] ml-1">Regjeringen</a> · 
              <a href={CLIMATE_CONTEXT.sources.mdir} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2F5D3A] ml-1">Miljødirektoratet</a>
            </div>
          </section>

          {/* Nøkkeltall */}
          <section className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div>
                <h2 className="text-lg text-[#2F5D3A] tracking-wide">Nøkkeltall (valgte tiltak)</h2>
                <p className="text-xs italic opacity-70">
                  {rowsSelected.length} av {rowsAll.length} tiltak valgt
                  {Object.keys(costOverrides).length > 0 && (
                    <span className="ml-2 text-[#2F5D3A] font-semibold not-italic">
                      · {Object.keys(costOverrides).length} med overstyrt kostnad
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(costOverrides).length > 0 && (
                <button
                    onClick={resetOverrides}
                    className="px-3 py-1.5 rounded-xl text-sm border border-[#C9B27C] bg-[#F7F3E8] text-[#2F5D3A] hover:bg-[#EDE1C9] transition"
                >
                    Nullstill overstyringer
                </button>
                )}
                <button
                  onClick={copyShareLink}
                  className="px-3 py-1.5 rounded-xl text-sm border border-[#C9B27C] bg-[#F7F3E8] text-[#2F5D3A] hover:bg-[#EDE1C9] transition flex items-center gap-1"
                >
                  {linkCopied ? (
                    <>✓ Kopiert!</>
                  ) : (
                    <>📋 Del utvalg</>
                  )}
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-xl text-sm border border-[#8B4513]/50 bg-[#F7F3E8] text-[#8B4513] hover:bg-[#EDE1C9] transition"
                  title="Nullstill alle valg, overstyringer og innstillinger"
                >
                  ↺ Nullstill alt
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-4">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                  Utslippskutt
                  </div>
                <div className="text-2xl text-[#2F5D3A] font-semibold">{nb(totals.potMt, 2)} Mt</div>
                <div className="text-xs opacity-60">CO₂-ekv i 2035</div>
                </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-4">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                    Total kostnad
                  </div>
                <div className="text-2xl text-[#2F5D3A] font-semibold">{nb(totals.cost, 1)} mrd</div>
                <div className="text-xs opacity-60">kroner</div>
                </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-4">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                  Snitt tiltakskost
                  </div>
                <div className="text-2xl text-[#2F5D3A] font-semibold">{nb(totals.avg, 0)}</div>
                <div className="text-xs opacity-60">kr/tonn CO₂e</div>
                </div>
              <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-4">
                <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                  Antatt kostnad
              </div>
                <div className="text-2xl text-[#2F5D3A] font-semibold">
                  {rowsSelected.filter(r => r.hasUnknownCost).length}
                </div>
                <div className="text-xs opacity-60">
                  tiltak · {nb(rowsSelected.filter(r => r.hasUnknownCost).reduce((a, r) => a + r.potensialMt, 0), 1)} Mt
                </div>
              </div>
            </div>

            {/* Innstilling for standardkostnad */}
            <div className="mt-4 p-4 bg-[#F7F3E8] border border-[#C9B27C]/50 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#2F5D3A]">Antakelse for ukjente kostnader</div>
                  <div className="text-xs text-[#2A2A2A]/70">
                    {rowsSelected.filter(r => r.hasUnknownCost).length} tiltak mangler vurdert kostnad i rapporten. 
                    Disse bruker standardantakelsen nedenfor.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={defaultUnknownCost}
                    onChange={(e) => setDefaultUnknownCost(Number(e.target.value) || 0)}
                    className="w-24 border border-[#C9B27C] bg-white rounded-lg px-3 py-1.5 text-right text-[#2F5D3A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F5D3A]/30"
                  />
                  <span className="text-sm text-[#2A2A2A]/70">kr/tonn</span>
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {[500, 1000, 1500, 2000, 3000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setDefaultUnknownCost(val)}
                    className={`px-3 py-1 rounded-lg text-xs transition ${
                      defaultUnknownCost === val
                        ? 'bg-[#2F5D3A] text-white'
                        : 'bg-white border border-[#C9B27C] text-[#2F5D3A] hover:bg-[#EDE1C9]'
                    }`}
                  >
                    {val.toLocaleString('nb-NO')} kr/t
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Charts row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col">
              <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">
                Potensial per kostnadsnivå
              </h3>
              <p className="text-xs italic opacity-75 mb-3">
                Utslippskutt (Mt CO₂e) fordelt på tiltakskostnad
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCostRange} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBBF9F" strokeOpacity={0.4} horizontal={true} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CostRangeTooltip />} />
                    <Bar dataKey="potMt" name="Potensial (Mt)" fill="#8B9D77" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col">
              <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">
                Potensial per sektor
              </h3>
              <p className="text-xs italic opacity-75 mb-3">
                Utslippskutt (Mt CO₂e) fordelt på sektor
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBBF9F" strokeOpacity={0.4} horizontal={false} vertical={true} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="kategori" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip content={<SectorTooltip />} />
                    <Bar dataKey="potMt" name="Potensial (Mt)" fill="#2F5D3A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Summary table */}
          <section className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-4 sm:p-5 shadow-sm overflow-auto">
            <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">Oppsummering per sektor</h3>
              <p className="text-xs italic opacity-75 mb-3">
              Potensial for utslippskutt (Mt CO₂e) og kostnader (mrd kr) fordelt på sektor
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#C9B27C]/80 bg-[#EDE1C9]">
                  <th className="py-2 pr-2 text-left">Sektor</th>
                    <th className="py-2 pr-2 text-right">Potensial (Mt)</th>
                    <th className="py-2 pr-2 text-right">Kostnad (mrd kr)</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((r) => (
                    <tr key={r.kategori} className="border-b border-[#E0D2B6]">
                      <td className="py-1 pr-2">{r.kategori}</td>
                    <td className="py-1 pr-2 text-right">{nb(r.potMt, 2)}</td>
                      <td className="py-1 pr-2 text-right">{nb(r.cost, 2)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80">Sum</td>
                  <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">{nb(totals.potMt, 2)}</td>
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">{nb(totals.cost, 2)}</td>
                  </tr>
                </tbody>
              </table>
          </section>

          {/* Detailed measures table */}
          <section className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-3 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div>
                <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">Tiltak – detaljer</h3>
                <p className="text-xs italic opacity-75">
                  Alle tiltak med potensial, tiltakskost og kostnadsbidrag.
                  {sortColumn && (
                    <span className="ml-2 font-semibold text-[#2F5D3A]">
                      (Sortert: {sortColumn === "potensialKt" ? "Potensial" : sortColumn === "kostnad" ? "Kostnad" : sortColumn === "tiltak" ? "Tiltak" : "Kategori"} {sortDirection === "desc" ? "↓" : "↑"})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-end gap-3 flex-wrap text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs opacity-70">Kategori</span>
                  <select
                    className="border border-[#C9B27C]/70 bg-[#F7F3E8] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D3A]"
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs opacity-70">Søk</span>
                  <input
                    className="border border-[#C9B27C]/70 bg-[#F7F3E8] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D3A] w-32"
                    placeholder="Søk…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-1.5 rounded-xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Velg alle
                </button>
                <button
                  onClick={deselectAllFiltered}
                  className="px-3 py-1.5 rounded-xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Fjern alle
                </button>
                {sortColumn && (
                  <button
                    onClick={resetSort}
                    className="px-3 py-1.5 rounded-xl border border-[#C9B27C] bg-[#F7F3E8] text-[#2F5D3A] hover:bg-[#EDE1C9] transition"
                  >
                    Nullstill sortering
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#C9B27C]/80 bg-[#EDE1C9]">
                  <th className="py-2 pr-2 w-10 text-left">
                    <input type="checkbox" className="h-4 w-4 accent-[#2F5D3A] border border-[#C9B27C] rounded-sm bg-[#F7F3E8] checked:bg-[#2F5D3A] checked:border-[#2F5D3A] shadow-inner"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (!el) return;
                        el.indeterminate = !allFilteredSelected && !noneFilteredSelected;
                      }}
                      onChange={(e) => (e.target.checked ? selectAllFiltered() : deselectAllFiltered())}
                    />
                  </th>
                  <th 
                    className="py-2 pr-2 text-left cursor-pointer hover:bg-[#E0D2B6] transition select-none"
                    onClick={() => handleSort("tiltak")}
                  >
                    <div className="flex items-center gap-1">
                      Tiltak
                      <SortIcon column="tiltak" />
                    </div>
                  </th>
                  <th 
                    className="py-2 pr-2 text-left cursor-pointer hover:bg-[#E0D2B6] transition select-none whitespace-nowrap"
                    onClick={() => handleSort("kategori")}
                  >
                    <div className="flex items-center gap-1">
                      Kategori
                      <SortIcon column="kategori" />
                    </div>
                  </th>
                  <th 
                    className="py-2 pr-2 text-right cursor-pointer hover:bg-[#E0D2B6] transition select-none"
                    onClick={() => handleSort("potensialKt")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Potensial (Mt)
                      <SortIcon column="potensialKt" />
                    </div>
                  </th>
                  <th className="py-2 pr-2 text-right">Enhetskost (kr/t)</th>
                  <th 
                    className="py-2 pr-2 text-right cursor-pointer hover:bg-[#E0D2B6] transition select-none"
                    onClick={() => handleSort("kostnad")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Kostnad (mrd kr)
                      <SortIcon column="kostnad" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {measures.map((m, idx) => {
                  const r = rowsMap.get(m.t);
                  const isChecked = selected.has(m.t);
                  if (!r) return null;
                  const hasOverride = costOverrides[m.t] !== undefined;
                  // Bruk unik key basert på navn, kategori og indeks for å håndtere duplikater
                  return (
                    <tr key={`${m.t}-${m.c}-${idx}`} className="border-b border-[#E0D2B6]">
                      <td className="py-1 pr-2">
                        <input type="checkbox" className="h-4 w-4 accent-[#2F5D3A] border border-[#C9B27C] rounded-sm bg-[#F7F3E8] checked:bg-[#2F5D3A] checked:border-[#2F5D3A] shadow-inner"
                          checked={isChecked}
                          onChange={() => toggleOne(m.t)}
                        />
                      </td>
                      <td className="py-1 pr-2 align-top">
                        <a 
                          href={getMdirUrl(m)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-[#2F5D3A] hover:underline"
                          title="Åpne tiltaksark hos Miljødirektoratet"
                        >
                          {r.tiltak}
                          <span className="ml-1 text-[10px] text-[#2F5D3A]/50">↗</span>
                        </a>
                      </td>
                      <td className="py-1 pr-2 align-top whitespace-nowrap">{r.kategori}</td>
                      <td className="py-1 pr-2 align-top text-right">{nb(r.potensialMt, 3)}</td>
                      <td className="py-1 pr-2 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.hasUnknownCost && (
                            <span className="text-[10px] text-[#8B4513]" title="Kostnad ikke vurdert i rapporten – bruker standardantakelse">
                              antatt
                            </span>
                          )}
                          <input
                            type="number"
                            className={classNames(
                              "w-20 border rounded-lg px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D3A]",
                              hasOverride 
                                ? "border-[#2F5D3A] bg-[#E8F0E8]" 
                                : r.hasUnknownCost
                                  ? "border-[#C9A227]/70 bg-[#FDF6E3]"
                                  : "border-[#C9B27C]/50 bg-[#F7F3E8]"
                            )}
                            value={r.enhetskost}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCostOverrides((prev) => ({ ...prev, [m.t]: val }));
                            }}
                            step={100}
                          />
                          {hasOverride && (
                            <button
                              onClick={() => {
                                setCostOverrides((prev) => {
                                  const next = { ...prev };
                                  delete next[m.t];
                                  return next;
                                });
                              }}
                              className="text-[#2F5D3A] hover:text-[#1a3a20] text-xs"
                              title={r.originalCost === null ? "Tilbakestill til standardantakelse" : "Tilbakestill til original"}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-1 pr-2 align-top text-right">{nb(r.sumMrd, 2)}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  <td className="py-2 pr-2" colSpan={3}>
                    Sum (valgte)
                  </td>
                    <td className="py-2 pr-2 text-right">{nb(totals.potMt, 2)}</td>
                  <td></td>
                  <td className="py-2 pr-2 text-right">{nb(totals.cost, 2)}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </section>

          {/* Academic-style footer note */}
          <footer className="pt-4 mt-4 border-t border-[#C9B27C]/60 text-[0.7rem] leading-relaxed text-[#2F5D3A]/90">
            <p>
              <span className="font-semibold">Kilde:</span> Miljødirektoratet, «Klimatiltak i Norge – Kunnskapsgrunnlag 2025» (M 2920).
              Potensial for utslippskutt viser årlige reduksjoner i 2035 (ikke kumulative).
              {" "}
              <a 
                href="https://www.miljodirektoratet.no/publikasjoner/2025/januar-2025/klimatiltak-i-norge-kunnskapsgrunnlag-2025/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-[#2F5D3A]"
              >
                Les rapporten hos Miljødirektoratet →
              </a>
            </p>
            <p className="mt-2">
              <span className="font-semibold">Om verktøyet:</span> Et interaktivt verktøy som gjør tallene fra Klimatiltak i Norge lettere å utforske. 
              Formålet er å presentere et klart og tilgjengelig grunnlag der brukeren kan undersøke tallene, justere antakelser 
              og se hvordan ulike valg påvirker kostnader og utslippskutt.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
