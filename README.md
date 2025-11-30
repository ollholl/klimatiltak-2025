# Klimatiltak i Norge – Kunnskapsgrunnlag 2025

Et interaktivt verktøy for å utforske Miljødirektoratets klimatiltaksdata og evaluere veien mot Norges 2035-mål.

## Om prosjektet

Dette dashboardet tar utgangspunkt i Miljødirektoratets rapport «Klimatiltak i Norge – Kunnskapsgrunnlag 2025» (M 2920) og bruker NB25-referansebanen som grunnlag for gap-analyse.

### NB25-metodikken

Verktøyet implementerer Miljødirektoratets egen metodikk:

- **Referansebanen (NB25)**: Nasjonalbudsjettet 2025 angir forventet utslipp i 2035 til 31,7 Mt CO2-ekv med vedtatt politikk (38% kutt fra 1990-nivået på 51 Mt)
- **Tilleggskutt**: Alle klimatiltak i verktøyet er beregnet som ekstra kutt utover NB25-banen, ikke som totale kutt fra dagens nivå
- **Gap til mål**: For å nå 70% kutt (15,3 Mt) eller 75% kutt (12,75 Mt) fra 1990, må vi kutte ytterligere fra NB25-nivået

Dette gjør verktøyet kompatibelt med offisielle norske klimaregnskaper og EU-metodikk.

### Funksjoner

- 77 klimatiltak med potensial for utslippskutt og tiltakskostnader
- Gap-analyse mot Norges vedtatte 2035-mål (70-75% kutt fra 1990)
- Visualisering av utslippsbane: 1990 til NB25 2035 til NB25 + tiltak
- Interaktiv utforskning med filtrering, sortering og justerbare kostnadsantakelser
- Advarsler for overlappende tiltak som ikke kan summeres fullt ut
- Delbare konfigurasjoner via URL
- Automatisk lagring av valg (localStorage)
- Lenker til Miljødirektoratets tiltaksark for hvert tiltak
- Responsivt design
- Print-vennlig

## Datakilde

Miljødirektoratet: Klimatiltak i Norge – Kunnskapsgrunnlag 2025 (M 2920)
https://www.miljodirektoratet.no/publikasjoner/2025/januar-2025/klimatiltak-i-norge-kunnskapsgrunnlag-2025/

Rapporten baserer seg på NB25-referansebanen (31,7 Mt i 2035) og SSB-statistikk (51 Mt i 1990).

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
4. Deploy

## Lisens

MIT
