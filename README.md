# Klimatiltak i Norge – Kunnskapsgrunnlag 2025

Et interaktivt verktøy for å utforske Miljødirektoratets klimatiltaksdata og evaluere veien mot Norges 2035-mål.

## Om prosjektet

Dette dashboardet tar utgangspunkt i Miljødirektoratets rapport «Klimatiltak i Norge – Kunnskapsgrunnlag 2025» (M 2920) og bruker **NB25-referansebanen** som grunnlag for gap-analyse.

### NB25-metodikken

Verktøyet implementerer Miljødirektoratets egen metodikk:

- **Referansebanen (NB25)**: Nasjonalbudsjettet 2025 angir forventet utslipp i 2035 til **31,7 Mt CO₂-ekv** med vedtatt politikk (38 % kutt fra 1990-nivået på 51 Mt)
- **Tilleggskutt**: Alle klimatiltak i verktøyet er beregnet som ekstra kutt *utover* NB25-banen, ikke som totale kutt fra dagens nivå
- **Gap til mål**: For å nå 70 % kutt (15,3 Mt) eller 75 % kutt (12,75 Mt) fra 1990, må vi kutte ytterligere fra NB25-nivået

Dette gjør verktøyet kompatibelt med offisielle norske klimaregnskaper og EU-metodikk.

### Funksjoner

- **77 klimatiltak** med potensial for utslippskutt og tiltakskostnader
- **Gap-analyse** mot Norges vedtatte 2035-mål (70-75% kutt fra 1990)
- **Visualisering** av utslippsbane: 1990 → NB25 2035 → NB25 + tiltak
- **Interaktiv utforskning** – filtrer, sorter, og juster kostnadsantakelser
- **Delbare konfigurasjoner** via URL

### Nøkkelfunksjoner

- 📊 Visualisering av utslippskutt per sektor og kostnadsnivå
- 🎯 Sammenligning med klimamål (70% / 75% kutt)
- 💰 Justerbare kostnadsantakelser for tiltak uten vurdert kostnad
- 🔗 Lenker til Miljødirektoratets tiltaksark for hvert tiltak
- 📋 Del-funksjon med URL-state
- 💾 Automatisk lagring av valg (localStorage)
- 📱 Responsivt design
- 🖨️ Print-vennlig

## Datakilder

- [Miljødirektoratet: Klimatiltak i Norge – Kunnskapsgrunnlag 2025 (M 2920)](https://www.miljodirektoratet.no/publikasjoner/2025/januar-2025/klimatiltak-i-norge-kunnskapsgrunnlag-2025/)
  - Presiserer at alle tiltak potensialberegnes som tillegg til NB25-referansebanen
- [Nasjonalbudsjettet 2025 / Klimastatus og -plan](https://www.regjeringen.no/no/dokumenter/meld.-st.-1-20242025/id3066044/)
  - Angir utslipp i 2035 med vedtatt politikk til 31,7 Mt CO₂-ekv
  - Angir 1990-baseline som 51 Mt CO₂-ekv
- [SSB: Utslipp til luft](https://www.ssb.no/natur-og-miljo/miljoregnskap/statistikk/utslipp-til-luft)
  - Bekrefter 1990-nivået og brukes for konsistens i baselinene

## Teknologi

- React 19
- Vite 7
- Tailwind CSS v4
- Recharts

## Utvikling

```bash
# Installer avhengigheter
npm install

# Start utviklingsserver
npm run dev

# Bygg for produksjon
npm run build

# Forhåndsvis produksjonsbygget
npm run preview
```

## Deploy

Prosjektet er konfigurert for enkel deploy til Vercel:

1. Push til GitHub
2. Koble til Vercel
3. Velg "Vite" som framework preset
4. Deploy!

## Lisens

MIT
