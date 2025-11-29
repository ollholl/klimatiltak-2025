# Klimatiltak i Norge – Kunnskapsgrunnlag 2025

Et interaktivt verktøy for å utforske Miljødirektoratets klimatiltaksdata og evaluere veien mot Norges 2035-mål.

## Om prosjektet

Dette dashboardet tar utgangspunkt i Miljødirektoratets rapport «Klimatiltak i Norge – Kunnskapsgrunnlag 2025» (M 2920) og viser:

- **77 klimatiltak** med potensial for utslippskutt og tiltakskostnader
- **Gap-analyse** mot Norges vedtatte 2035-mål (70-75% kutt fra 1990)
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

- [Miljødirektoratet: Klimatiltak i Norge – Kunnskapsgrunnlag 2025](https://www.miljodirektoratet.no/publikasjoner/2025/januar-2025/klimatiltak-i-norge-kunnskapsgrunnlag-2025/)
- [SSB: Utslipp til luft](https://www.ssb.no/natur-og-miljo/miljoregnskap/statistikk/utslipp-til-luft)
- [Regjeringen: Norges klimamål 2035](https://www.regjeringen.no/no/aktuelt/norge-har-meldt-inn-sitt-nye-klimamal-til-fn/id3112346/)

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
