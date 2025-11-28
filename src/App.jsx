import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

// --- Data --------------------------------------------------------------------
// NB: Inkluderer S09 i både "Sjøfart/fiske/havbruk" og "Annen transport" (som O01)
// Verdier i Mt CO2e. Kostnadsbøtter: '<500' | '500-1500' | '>1500' | 'Varierer'
const MEASURES = [
  // Veitransport
  { t: "T01 Nullvekstmål for personbiltransporten", c: "Veitransport", p: 0.76, bin: "500-1500" },
  { t: "T02 Overføring av gods fra vei til sjø og bane", c: "Veitransport", p: 0.48, bin: ">1500" },
  { t: "T03 Forbedret logistikk for varebiltransport", c: "Veitransport", p: 0.42, bin: "<500" },
  { t: "T04 Forbedret logistikk og økt effektivisering av lastebiler", c: "Veitransport", p: 1.19, bin: "<500" },
  { t: "T05 100% av nye personbiler er elektriske innen 2025", c: "Veitransport", p: 2.54, bin: "500-1500" },
  { t: "T06 100% av nye lette varebiler er elektriske innen 2025", c: "Veitransport", p: 0.69, bin: "500-1500" },
  { t: "T07 100% av nye tyngre varebiler er elektriske innen 2030", c: "Veitransport", p: 0.28, bin: "<500" },
  { t: "T08 50% av nye lastebiler er el-/hydrogen i 2030", c: "Veitransport", p: 1.13, bin: "500-1500" },
  { t: "T09 100% av nye bybusser er elektriske innen 2025", c: "Veitransport", p: 1.08, bin: "500-1500" },
  { t: "T10 75% av nye langdistansebusser er el-/hydrogen i 2030", c: "Veitransport", p: 0.17, bin: "500-1500" },
  { t: "T11 45% av nysalg av MC/moped er elektriske i 2030", c: "Veitransport", p: 0.04, bin: "<500" },
  { t: "T12 10% av nye trekkvogner går på biogass i 2030", c: "Veitransport", p: 0.47, bin: ">1500" },
  { t: "T13 Økt bruk av avansert flytende biodrivstoff i veitransport", c: "Veitransport", p: 2.55, bin: ">1500" },

  // Sjøfart, fiske og havbruk
  { t: "S01 Teknisk-operasjonelle tiltak (energieffektivisering)", c: "Sjøfart/fiske/havbruk", p: 0.13, bin: "Varierer" },
  { t: "S03 Avansert biodrivstoff til skipsfart", c: "Sjøfart/fiske/havbruk", p: 1.19, bin: ">1500" },
  { t: "S04 Landstrøm", c: "Sjøfart/fiske/havbruk", p: 0.83, bin: "500-1500" },
  { t: "S05 Tiltak på godsskip (Ammoniakk/LNG/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 0.19, bin: ">1500" },
  { t: "S06 Tiltak på offshorefartøy (Hydrogen/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 1.02, bin: ">1500" },
  { t: "S07 Tiltak på fiskefartøy (Plug-in)", c: "Sjøfart/fiske/havbruk", p: 0.18, bin: ">1500" },
  { t: "S08 Tiltak på bulkskip (Ammoniakk/LNG/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 0.09, bin: ">1500" },
  { t: "S09 Tiltak innen havbruk (ammoniakk/plug-in)", c: "Sjøfart/fiske/havbruk", p: 1.07, bin: ">1500" },
  { t: "S10 Tiltak på ferger (Hydrogen/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 1.36, bin: ">1500" },
  { t: "S11 Tiltak på hurtigbåter (Hydrogen/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 0.52, bin: ">1500" },
  { t: "S12 Tiltak på cruiseskip (Hydrogen/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 0.0, bin: ">1500" },
  { t: "S13 Tiltak på andre spesialfartøy (Hydrogen/Plug-in)", c: "Sjøfart/fiske/havbruk", p: 0.05, bin: ">1500" },

  // Annen transport (ikke-veigående m.m.)
  { t: "AT01 Effektivisering maskiner på bygg/anlegg", c: "Annen transport", p: 0.42, bin: "<500" },
  { t: "AT02 70% av nye ikke-veigående maskiner/kjøretøy er elektriske (2030)", c: "Annen transport", p: 1.75, bin: ">1500" },
  { t: "AT03 Nullutslippsløsninger for jernbane", c: "Annen transport", p: 0.23, bin: "<500" },
  { t: "AT04 Elektrifisering av fritidsbåter", c: "Annen transport", p: 0.03, bin: ">1500" },
  { t: "AT05 Avansert flytende biodrivstoff i avgiftsfri diesel", c: "Annen transport", p: 1.89, bin: ">1500" },
  { t: "S09 Tiltak innen havbruk (ammoniakk/plug-in)", c: "Annen transport", p: 0.85, bin: ">1500" },
  { t: "O01 Utfasing av mineralolje/gass til byggvarme på byggeplasser", c: "Annen transport", p: 0.76, bin: "<500" },

  // Jordbruk
  { t: "J01 Overgang fra rødt kjøtt til plantebasert kost og fisk", c: "Jordbruk", p: 2.89, bin: "<500" },
  { t: "J02 Redusert matsvinn", c: "Jordbruk", p: 1.53, bin: "<500" },
  { t: "J03 Husdyrgjødsel til biogass", c: "Jordbruk", p: 0.25, bin: ">1500" },
  { t: "J04 Diverse gjødseltiltak", c: "Jordbruk", p: 0.33, bin: ">1500" },
  { t: "J05 Stans i nydyrking av myr", c: "Jordbruk", p: 0.12, bin: "<500" },

  // Industri/bergverk
  { t: "I01 Energieffektivisering i annen industri og bergverk", c: "Industri/bergverk", p: 0.30, bin: "<500" },
  { t: "I02 Konvertering til elkraft i annen industri og bergverk", c: "Industri/bergverk", p: 0.61, bin: "500-1500" },
  { t: "I03 Konvertering til biobrensel i annen industri og bergverk", c: "Industri/bergverk", p: 0.15, bin: "500-1500" },
  { t: "I04 Konvertering til fjernvarme i annen industri og bergverk", c: "Industri/bergverk", p: 0.02, bin: "<500" },
  { t: "I05 Konvertering til hydrogen i annen industri og bergverk", c: "Industri/bergverk", p: 0.01, bin: ">1500" },
  { t: "I06 Fast biomasse i asfaltindustrien", c: "Industri/bergverk", p: 0.52, bin: "<500" },
  { t: "I07 Konvertering i metallurgisk industri", c: "Industri/bergverk", p: 0.11, bin: "500-1500" },
  { t: "I08 Konvertering i kjemisk industri", c: "Industri/bergverk", p: 0.08, bin: "500-1500" },
  { t: "I09 Økt andel trekull i silisiumkarbidindustrien", c: "Industri/bergverk", p: 0.04, bin: "<500" },
  { t: "I10 Reduserte lystgassutslipp fra kunstgjødselproduksjon", c: "Industri/bergverk", p: 0.83, bin: "<500" },

  // Petroleum (ikke-kvotepliktige)
  { t: "P01 Økt gjenvinning av metan/NMVOC ved råoljelasting offshore", c: "Petroleum", p: 0.28, bin: "500-1500" },
  { t: "P02 Reduksjon av metan/NMVOC fra kaldventilering offshore", c: "Petroleum", p: 1.16, bin: "500-1500" },
  { t: "P03 Reduksjon av metan/NMVOC fra petroleumsanlegg på land", c: "Petroleum", p: 0.23, bin: ">1500" },

  // CCS
  { t: "E01 CCS på Oslo Fortum Varme (Klemetsrud)", c: "CCS", p: 1.30, bin: "500-1500" },
  { t: "E02 CCS på BIR (Bergen)", c: "CCS", p: 0.26, bin: "500-1500" },
  { t: "E03 CCS på Heimdal (Trondheim)", c: "CCS", p: 0.26, bin: "500-1500" },

  // Andre tiltak
  { t: "E04 Erstatte olje/gass i fjernvarme med fornybar", c: "Andre tiltak", p: 0.02, bin: ">1500" },
  { t: "O01 Utfasing av mineralolje/gass til byggvarme (permanent)", c: "Andre tiltak", p: 0.14, bin: "<500" },
  { t: "O02 Erstatte gassbruk til permanent oppvarming av bygg", c: "Andre tiltak", p: 0.95, bin: ">1500" },
  { t: "O03 Forsert utskifting av vedovner", c: "Andre tiltak", p: 0.51, bin: "<500" },
  { t: "E05 Erstatte kullkraft med fornybar i Longyearbyen", c: "Andre tiltak", p: 0.43, bin: "<500" },
  { t: "F01 Økt innsamling/destruksjon av brukt HFK", c: "Andre tiltak", p: 0.65, bin: "<500" },
  { t: "E06 Økt utsortering av brukte tekstiler til materialgjenvinning", c: "Andre tiltak", p: 0.20, bin: "<500" },
  { t: "E07 Økt utsortering av plastavfall til materialgjenvinning", c: "Andre tiltak", p: 0.40, bin: ">1500" },
  { t: "A01 Økt uttak av metan fra avfallsdeponi", c: "Andre tiltak", p: 0.76, bin: "<500" },
];

const NULLTILTAK = { t: "Diverse nulltiltak", c: "Andre tiltak", p: 3.9, bin: "<500" };

const ALL_BINS = ["<500", "500-1500", ">1500", "Varierer"];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function nb(n, d = 2) {
  return n.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: d });
}

export default function KlimakurPrestigeDashboard() {
  // Antakelser for kr/tonn per kostnadsbøtte
  const [unitCosts, setUnitCosts] = useState({
    "<500": 500,
    "500-1500": 1500,
    ">1500": 2000,
    Varierer: 1500,
  });
  const [filterCat, setFilterCat] = useState("Alle");
  const [search, setSearch] = useState("");

  // --- Utvalg av tiltak (huke av/på) ----------------------------------------
  const [selected, setSelected] = useState(
    () => new Set([...MEASURES.map((m) => m.t), NULLTILTAK.t])
  );

  const categories = useMemo(() => {
    const set = new Set(MEASURES.map((m) => m.c));
    return ["Alle", ...Array.from(set)];
  }, []);

  const measures = useMemo(() => {
    const base = [...MEASURES, NULLTILTAK];
    return base
      .filter((m) => (filterCat === "Alle" ? true : m.c === filterCat))
      .filter((m) => (search.trim() ? m.t.toLowerCase().includes(search.toLowerCase()) : true));
  }, [filterCat, search]);

  // Kostnad per tiltak (mrd. kr)
  function itemCostMrd(m) {
    const unit = unitCosts[m.bin];
    return (m.p * unit) / 1000; // Mt * (kr/t) / 1000 = mrd kr
  }

  const rowsAll = useMemo(() => {
    const base = [...MEASURES, NULLTILTAK];
    return base.map((m) => ({
      tiltak: m.t,
      kategori: m.c,
      bin: m.bin,
      potensialMt: m.p,
      enhetskost: unitCosts[m.bin],
      sumMrd: itemCostMrd(m),
    }));
  }, [unitCosts]);

  const rowsSelected = useMemo(() => {
    return rowsAll.filter((r) => selected.has(r.tiltak));
  }, [rowsAll, selected]);

  const totals = useMemo(() => {
    const pot = rowsSelected.reduce((a, r) => a + r.potensialMt, 0);
    const cost = rowsSelected.reduce((a, r) => a + r.sumMrd, 0);
    return { pot, cost, avg: pot > 0 ? (cost * 1000) / pot : 0 };
  }, [rowsSelected]);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const r of rowsSelected) {
      const cur = map.get(r.kategori) ?? { pot: 0, cost: 0 };
      cur.pot += r.potensialMt;
      cur.cost += r.sumMrd;
      map.set(r.kategori, cur);
    }
    return Array.from(map, ([kategori, v]) => ({ kategori, pot: v.pot, cost: v.cost })).sort((a, b) =>
      a.kategori.localeCompare(b.kategori)
    );
  }, [rowsSelected]);

  const byBin = useMemo(() => {
    const map = new Map();
    for (const r of rowsSelected) {
      const cur = map.get(r.bin) ?? { pot: 0, cost: 0 };
      cur.pot += r.potensialMt;
      cur.cost += r.sumMrd;
      map.set(r.bin, cur);
    }
    // ensure all bins present
    for (const b of ALL_BINS) if (!map.has(b)) map.set(b, { pot: 0, cost: 0 });
    return ALL_BINS.map((bin) => ({ bin, pot: map.get(bin).pot, cost: map.get(bin).cost }));
  }, [rowsSelected]);

  function setCost(bin, val) {
    const v = Math.max(0, Math.round(val));
    setUnitCosts((prev) => ({ ...prev, [bin]: v }));
  }

  function resetDefaults() {
    setUnitCosts({ "<500": 500, "500-1500": 1500, ">1500": 2000, Varierer: 1500 });
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

  // --- Dev sanity tests (run in dev/preview) ---------------------------------
  useEffect(() => {
    const eps = 1e-6;
    const sumCatPot = byCategory.reduce((a, b) => a + b.pot, 0);
    const sumCatCost = byCategory.reduce((a, b) => a + b.cost, 0);
    const sumBinPot = byBin.reduce((a, b) => a + b.pot, 0);
    const sumBinCost = byBin.reduce((a, b) => a + b.cost, 0);

    console.assert(Math.abs(sumCatPot - totals.pot) < eps, "[TEST] Kategori-potensial summerer ikke til total");
    console.assert(Math.abs(sumCatCost - totals.cost) < eps, "[TEST] Kategori-kostnad summerer ikke til total");
    console.assert(Math.abs(sumBinPot - totals.pot) < eps, "[TEST] Bøtte-potensial summerer ikke til total");
    console.assert(Math.abs(sumBinCost - totals.cost) < eps, "[TEST] Bøtte-kostnad summerer ikke til total");
    console.assert(byBin.length === ALL_BINS.length, "[TEST] Ikke alle kostnadsbøtter er med i byBin");
    console.assert(rowsSelected.every((r) => r.enhetskost >= 0), "[TEST] Enhetskost må være >= 0 for alle tiltak");
    const selectedPot = rowsAll.filter((r) => selected.has(r.tiltak)).reduce((a, r) => a + r.potensialMt, 0);
    console.assert(Math.abs(selectedPot - totals.pot) < eps, "[TEST] Utvalg påvirker ikke total-poten riktig");
  }, [byCategory, byBin, totals, rowsAll, rowsSelected, selected]);

  // --- Prestige diploma layout ----------------------------------------------
  return (
    <div className="min-h-screen bg-[#F7F3E8] text-[#2a2a2a] font-serif">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Academic front page header */}
        <header className="relative pb-10 mb-8 border-b border-[#C9B27C]/60">
          {/* Crest / watermark */}
          <div className="pointer-events-none select-none absolute right-4 top-0 opacity-10 text-[5rem] leading-none text-[#2F5D3A]">
            KK
          </div>
          <p className="text-xs tracking-[0.25em] uppercase text-[#2F5D3A] mb-3">
            Bellona · Klimakur 2030 – Analytisk verktøy
          </p>
          <h1 className="text-4xl md:text-5xl text-[#2F5D3A] tracking-wide mb-3">
            Kostnader og potensial i Klimakur-tiltakene
          </h1>
          <h2 className="text-lg italic text-[#2F5D3A]/80 mb-6">
            En interaktiv oversikt over kostnader og potensial
          </h2>
          <div className="max-w-4xl text-base leading-relaxed">
            <p>
              <span className="text-5xl float-left leading-none pr-3 text-[#2F5D3A] font-semibold">
                D
              </span>
              ette dashbordet tar utgangspunkt i Klimakur 2030 og viser hvordan ulike tiltak og kostnadskategorier påvirker både samlede utslippsreduksjoner og anslåtte kostnader. Juster antakelser, filtrer på kategorier og utforsk hvordan porteføljen av tiltak ser ut.
            </p>
            <div className="mt-4 p-4 bg-[#F3EBD9] border border-[#C9B27C]/70 rounded-2xl text-sm leading-relaxed shadow-sm">
              <p className="font-semibold text-[#2F5D3A] mb-1">Hva betyr «tiltakskost»?</p>
              <p className="text-[#2A2A2A]">
                I Klimakur brukes tiltakskost som et samfunnsøkonomisk mål: summen av alle reelle kostnader ved et
                klimatiltak – som investeringer, drift og teknologikostnader – minus eventuelle samfunnsøkonomiske
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
          {/* First row: assumptions, filters, key figures */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm">
              <h2 className="text-lg text-[#2F5D3A] mb-2 tracking-wide">
                Antakelser om kostnad (kr/tonn)
              </h2>
              <div className="w-16 h-[2px] bg-[#C9B27C] mb-4" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {ALL_BINS.map((b) => (
                  <label key={b} className="flex flex-col gap-1">
                    <span className="opacity-80">{b}</span>
                    <input
                      type="number"
                      className="border border-[#C9B27C]/70 bg-[#F7F3E8] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D3A]"
                      value={unitCosts[b]}
                      onChange={(e) => setCost(b, Number(e.target.value))}
                      min={0}
                      step={50}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 items-center text-sm">
                <button
                  onClick={resetDefaults}
                  className="px-3 py-2 rounded-2xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Tilbakestill til standard
                </button>
              </div>
              <p className="text-[0.75rem] mt-3 italic opacity-70">
                Verdiene representerer øvre sjikt i hver kostnadsbøtte. Endringer gir
                direkte utslag i total kostnad.
              </p>
            </div>

            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm">
              <h2 className="text-lg text-[#2F5D3A] mb-2 tracking-wide">Filtre og utvalg</h2>
              <div className="w-16 h-[2px] bg-[#C9B27C] mb-4" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="opacity-80">Kategori</span>
                  <select
                    className="border border-[#C9B27C]/70 bg-[#F7F3E8] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D3A]"
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
                  <span className="opacity-80">Søk i tiltak</span>
                  <input
                    className="border border-[#C9B27C]/70 bg-[#F7F3E8] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D3A]"
                    placeholder="Søk…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 text-xs opacity-75 space-y-1">
                <div>Rader (filter): {measures.length}</div>
                <div>
                  Valgt: {rowsSelected.length} av {rowsAll.length}
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap text-sm">
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-2 rounded-2xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Velg alle (filter)
                </button>
                <button
                  onClick={deselectAllFiltered}
                  className="px-3 py-2 rounded-2xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Fjern alle (filter)
                </button>
              </div>
            </div>

            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm">
              <h2 className="text-lg text-[#2F5D3A] mb-2 tracking-wide">Nøkkeltall (valgte tiltak)</h2>
              <div className="w-16 h-[2px] bg-[#C9B27C] mb-4" />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                    Totalt potensial
                  </div>
                  <div className="text-xl text-[#2F5D3A] font-semibold">{nb(totals.pot, 2)} Mt</div>
                </div>
                <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                    Total kostnad
                  </div>
                  <div className="text-xl text-[#2F5D3A] font-semibold">{nb(totals.cost, 2)} mrd kr</div>
                </div>
                <div className="rounded-2xl border border-[#C9B27C]/70 bg-[#F7F3E8] p-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#2F5D3A] mb-1">
                    Snitt kostnad
                  </div>
                  <div className="text-xl text-[#2F5D3A] font-semibold">{nb(totals.avg, 0)} kr/t</div>
                </div>
              </div>
              <p className="text-[0.75rem] mt-3 italic opacity-70">
                Basert på gjeldende utvalg og antakelser om kr/tonn i hver bøtte.
              </p>
            </div>
          </section>

          {/* Charts row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm flex flex-col">
              <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">
                Kostnad per kostnadskategori
              </h3>
              <p className="text-xs italic opacity-75 mb-3">
                Figur 1. Fordeling av totale kostnader (mrd kr) mellom kostnadsbøtter.
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBin} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBBF9F" />
                    <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => nb(v, 2)}
                      contentStyle={{
                        backgroundColor: "#F7F3E8",
                        border: "1px solid rgba(201,178,124,0.8)",
                        borderRadius: "0.75rem",
                        fontFamily: "serif",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="cost" name="Kostnad (mrd)" fill="#2F5D3A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm flex flex-col">
              <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">
                Potensial per kostnadskategori
              </h3>
              <p className="text-xs italic opacity-75 mb-3">
                Figur 2. Fordeling av utslippsreduksjonspotensial (Mt) mellom kostnadsbøtter.
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBin} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBBF9F" />
                    <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => nb(v, 2)}
                      contentStyle={{
                        backgroundColor: "#F7F3E8",
                        border: "1px solid rgba(201,178,124,0.8)",
                        borderRadius: "0.75rem",
                        fontFamily: "serif",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pot" name="Potensial (Mt)" fill="#8B9D77" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Summary tables row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm overflow-auto">
              <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">Summer per kategori</h3>
              <p className="text-xs italic opacity-75 mb-3">
                Tabell 1. Utslippspotensial og kostnader fordelt på sektor-/tiltakskategori.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#C9B27C]/80 bg-[#EDE1C9]">
                    <th className="py-2 pr-2 text-left">Kategori</th>
                    <th className="py-2 pr-2 text-right">Potensial (Mt)</th>
                    <th className="py-2 pr-2 text-right">Kostnad (mrd kr)</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((r) => (
                    <tr key={r.kategori} className="border-b border-[#E0D2B6]">
                      <td className="py-1 pr-2">{r.kategori}</td>
                      <td className="py-1 pr-2 text-right">{nb(r.pot, 2)}</td>
                      <td className="py-1 pr-2 text-right">{nb(r.cost, 2)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80">Sum</td>
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">{nb(totals.pot, 2)}</td>
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">{nb(totals.cost, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm overflow-auto">
              <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">Summer per kostnadskategori</h3>
              <p className="text-xs italic opacity-75 mb-3">
                Tabell 2. Utslippspotensial og kostnader fordelt på kostnadsbøtter.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#C9B27C]/80 bg-[#EDE1C9]">
                    <th className="py-2 pr-2 text-left">Kostnadskategori</th>
                    <th className="py-2 pr-2 text-right">Enhetskost (kr/t)</th>
                    <th className="py-2 pr-2 text-right">Potensial (Mt)</th>
                    <th className="py-2 pr-2 text-right">Kostnad (mrd kr)</th>
                  </tr>
                </thead>
                <tbody>
                  {byBin.map((r) => (
                    <tr key={r.bin} className="border-b border-[#E0D2B6]">
                      <td className="py-1 pr-2">{r.bin}</td>
                      <td className="py-1 pr-2 text-right">{nb(unitCosts[r.bin], 0)}</td>
                      <td className="py-1 pr-2 text-right">{nb(r.pot, 2)}</td>
                      <td className="py-1 pr-2 text-right">{nb(r.cost, 2)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80">Sum</td>
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">—</td>
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">{nb(totals.pot, 2)}</td>
                    <td className="py-2 pr-2 border-t border-[#C9B27C]/80 text-right">{nb(totals.cost, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Detailed measures table */}
          <section className="bg-[#F3EBD9] border border-[#C9B27C]/80 rounded-3xl p-5 shadow-sm overflow-auto">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div>
                <h3 className="text-lg text-[#2F5D3A] mb-1 tracking-wide">Tiltak – detaljer</h3>
                <p className="text-xs italic opacity-75">
                  Tabell 3. Alle tiltak med kostnadsbøtte, potensial og kostnadsbidrag. Bruk avkrysningsboksene til å
                  inkludere/ekskludere tiltak fra beregningene.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap text-sm">
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-2 rounded-2xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Velg alle (filter)
                </button>
                <button
                  onClick={deselectAllFiltered}
                  className="px-3 py-2 rounded-2xl border border-[#2F5D3A] bg-[#2F5D3A] text-[#F7F3E8] hover:bg-[#244A2E] transition"
                >
                  Fjern alle (filter)
                </button>
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
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
                  <th className="py-2 pr-2 text-left">Tiltak</th>
                  <th className="py-2 pr-2 text-left">Kategori</th>
                  <th className="py-2 pr-2 text-left">Kostnadsbøtte</th>
                  <th className="py-2 pr-2 text-right">Potensial (Mt)</th>
                  <th className="py-2 pr-2 text-right">Enhetskost (kr/t)</th>
                  <th className="py-2 pr-2 text-right">Kostnad (mrd kr)</th>
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => {
                  const r = rowsAll.find((x) => x.tiltak === m.t);
                  const isChecked = selected.has(m.t);
                  if (!r) return null;
                  return (
                    <tr key={m.t} className="border-b border-[#E0D2B6]">
                      <td className="py-1 pr-2">
                        <input type="checkbox" className="h-4 w-4 accent-[#2F5D3A] border border-[#C9B27C] rounded-sm bg-[#F7F3E8] checked:bg-[#2F5D3A] checked:border-[#2F5D3A] shadow-inner"
                          checked={isChecked}
                          onChange={() => toggleOne(m.t)}
                        />
                      </td>
                      <td className="py-1 pr-2 align-top">{r.tiltak}</td>
                      <td className="py-1 pr-2 align-top whitespace-nowrap">{r.kategori}</td>
                      <td className="py-1 pr-2 align-top">{r.bin}</td>
                      <td className="py-1 pr-2 align-top text-right">{nb(r.potensialMt, 2)}</td>
                      <td className="py-1 pr-2 align-top text-right">{nb(r.enhetskost, 0)}</td>
                      <td className="py-1 pr-2 align-top text-right">{nb(r.sumMrd, 2)}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  <td className="py-2 pr-2" colSpan={4}>
                    Sum (valgte)
                  </td>
                  <td className="py-2 pr-2 text-right">{nb(totals.pot, 2)}</td>
                  <td></td>
                  <td className="py-2 pr-2 text-right">{nb(totals.cost, 2)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Academic-style footer note */}
          <footer className="pt-4 mt-4 border-t border-[#C9B27C]/60 text-[0.7rem] leading-relaxed text-[#2F5D3A]/90">
            <p>
              <span className="font-semibold">Kilde:</span> Klimakur 2030, Miljødirektoratet – tabell S2 (forenklet,
              antatt øvre sjikt pr. kostnadsbøtte). Inkluderer S09 i både "Sjøfart/fiske/havbruk" og "Annen transport".
            </p>
            <p className="mt-1 italic">
              Dette dashbordet er utviklet som et analytisk hjelpemiddel, ikke som en offisiell beregning. Tall kan
              avvike fra offisielle Klimakur-presentasjoner, og bør derfor leses som illustrasjoner av kostnadsstrukturer
              snarere enn endelige fasitverdier.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
