# Eli-baba · אלי-בעבע

A bilingual (English / Hebrew) single-page web app with three interactive desks —
**flight booking**, **accommodation booking** and **stock trading** — sharing one wallet.

Everything runs in the browser against generated mock data. No backend, no database and no
image or chart libraries: fares, hotel inventory, listing artwork, carrier logos and price
series are all produced locally from a seeded pseudo-random generator, so the same search
always returns the same results.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production bundle), `npm run preview`,
`npm run typecheck`.

## Bilingual & RTL

A toggle in the header switches between English and **עברית**. Switching flips
`dir` to `rtl`, swaps the typography stack, re-formats every date and number for `he-IL`,
switches the currency to shekels (at a fixed mock rate), and re-renders the transaction
ledger — entries are stored as message keys plus values, not baked strings, so past
activity reads in whichever language you're currently in. The choice persists across
reloads.

Layout mirrors automatically: the CSS uses logical properties (`inset-inline`,
`padding-inline`, `border-inline-start`) throughout rather than left/right, so there is no
separate RTL stylesheet. Directional details are handled explicitly where they matter —
route arrows flip, calendar chevrons swap, and price charts stay left-to-right because
financial series read that way in both languages.

Hebrew is not a machine gloss. Copy was written in the terms Israeli travel and trading
products actually use (`תיירים` for economy, `לימיט` for limit orders, `צ׳ק-אין`,
`כוח קנייה`), and counted nouns use the proper singular / dual / plural forms
(`לילה אחד` · `שני לילות` · `5 לילות`). English is the typed source of truth for the
message catalogue, so a missing Hebrew key fails the build rather than the page.

## The timed simulation

The app opens on a **Start simulation** gate. Pressing it starts the clock and resets the
wallet to the opening balance, so every run begins from the same slate and times and
results are comparable between players.

A run clears when you have completed one task on each desk:

| Objective | Desk |
| --- | --- |
| Book a flight | Flights |
| Book a stay | Stays |
| Buy a stock | Markets |
| Sell a stock | Markets |

While a run is live a notch sits centred in the navigation bar — a dark island with
concave shoulders, a lens dot, the elapsed clock and the objective counter — and each
objective raises a toast as it clears. The lens lights green when the run closes. Below
1200px, where the header can no longer hold everything on one line, the notch takes the
top row on its own. When the last one clears the clock freezes and a result card reports the **time
taken**, **total spent**, **total earned**, **final net worth** and **net result** — the
numbers you would rank runs by.

Spending, earnings and time stop recording at completion, so continuing to use the app
afterwards cannot change a recorded result. **Run it again** resets to a fresh slate and a
new clock.

## The three tabs

### Flights
- Autocomplete over **198 airports**, searchable in either language, one-way or round trip,
  1–6 travellers, four cabins.
- Fares generated from real great-circle distances: connections only route through airports
  roughly on the way, and multi-stop itineraries can't double back.
- Filter by stops, departure window, price cap and airline; sort four ways. Expandable
  per-leg detail with layover times.
- Four-step booking: review → seat map (live seat fees, extra-legroom rows) → traveller
  details with validation → extras and payment.
- **My trips** holds confirmed itineraries; cancelling refunds in full on a flexible fare,
  otherwise 80%.

### Stays
- **831 destinations across 113 countries**, each with 18 generated properties — room
  types, amenities and reviews.
- Filter by nightly budget, guest rating, property type, required amenities and free
  cancellation; sort five ways including a value-weighted "recommended".
- Property detail with a five-image gallery, amenity list, per-room pricing for your dates
  and reviews.
- Three-step reservation with an optional breakfast add-on and a full price breakdown.

### Markets
- **24 instruments across two boards** — a global board and the Tel Aviv board (mock
  issuers shaped like the real TA-35 sectors: pharma, the big banks, defence electronics,
  chemicals, enterprise software, real estate). The Hebrew edition leads with Tel Aviv, the
  English one with global, and the board follows the language toggle.
- 400 days of generated daily history plus a live feed that ticks every 1.6s via a
  geometric random walk (pausable).
- Interactive SVG chart with 1D/1W/1M/6M/1Y ranges, a hover crosshair and an animated line
  draw; sparklines in the symbol list, which flashes on each tick.
- **Market orders** fill immediately. **Limit orders** rest and fill automatically the
  moment the simulated price crosses them.
- Positions table with average cost, market value, day change and unrealised P/L
  recomputed on every tick; sector allocation; order book; full cash ledger.

## Shared wallet

All three tabs spend from one balance, opening at $25,000 (₪92,000). Flights, stays and
trades debit it, refunds and deposits credit it, and every movement is recorded in the
ledger under **Markets → Activity**. State persists to `localStorage`; the wallet menu can
top up or reset the session.

## Design

Light, flat and editorial — warm paper (`#f6f1e7`), ink text, a deep-teal brand with an
ochre accent, hairline rules instead of shadows, and a serif display face against a
grotesque UI face.

- **No gradients anywhere.** Colour is applied as flat fills, rules and tint blocks. The
  page texture is a tiled SVG dot, and the chart's area fill is a flat tint.
- **No emoji.** Every glyph is a line icon from `src/components/icons.tsx`, drawn on a
  24×24 grid and inheriting `currentColor`.
- **Typography** is `Frank Ruhl Libre` (display) and `Assistant` (UI) — both carry Hebrew
  *and* Latin, so the two languages share one voice instead of clashing — with
  `IBM Plex Mono` for figures. All three degrade to system stacks if the CDN is unreachable.

### Loading animations
A branded rotating star, pulsing skeleton cards matched to the real card shapes (flight
rows and stay tiles), an inline spinner in the results toolbar, staggered entrance on
result lists, a page-level fade-up between tabs, an animated stroke-draw on the price
chart, and flat colour flashes on ticking quotes. All of it collapses under
`prefers-reduced-motion`.

### Listing photography
Stay listings use real photographs, resolved through an ordered list of sources in
`src/data/stayPhotos.ts`. Neither default source needs an API key **or a per-photo id** —
the URL itself asks for a photo, so there is nothing that can go stale or 404:

1. **LoremFlickr** — Flickr photos tagged `hotel,room,interior`, pinned per listing with
   `lock` so a property always shows the same room.
2. **Lorem Picsum** — Unsplash photography, seeded per listing. The safety net.

To pin specific Unsplash photographs instead, paste their ids into `UNSPLASH_IDS` and they
are tried first. Verify anything you add:

```bash
npm run check:photos   # reports which sources actually respond
```

Every image degrades rather than breaking: the seeded illustration renders underneath as
the loading state, a photograph fades over it once decoded, and each failure moves to the
next source — the illustration simply stays if none succeed. Card and gallery dimensions
are identical either way.

### Generated artwork
Both fallback sets are inline SVG — nothing is fetched:

- **Listing artwork** (`src/features/stays/PropertyArt.tsx`) draws a flat vector
  architectural scene per property — one of five compositions (coastal, townhouse, tower,
  courtyard, alpine) in one of six palettes, with lit windows placed from the property's
  seed. Each listing gets five variants for its gallery.
- **Carrier logos** (`src/components/AirlineLogo.tsx`) are seven distinct geometric marks
  (chevron, arc, star, delta, wave, sun, crown), one per airline.

`docs/IMAGE_PROMPTS.md` has ready-to-paste batch prompts if you would rather generate
bitmap artwork for either set instead.

## Structure

```
src/
  i18n/        typed message catalogue (en is the source of truth), plurals, RTL, currency
  data/        seeded generators — airports, flights, 831 destinations, hotels, instruments
  state/       reducer store, session/objectives, persistence, quote feed, portfolio maths
  features/    flights/ · stays/ · markets/ · session/
  components/  icons, airline logos, modal, autocomplete, date picker, loaders
  lib/         PRNG helpers and locale-independent formatting
  styles/      design tokens and layout
```

Overlays are portalled to `<body>` and freeze the page behind them: `position: fixed` is
only viewport-relative when no ancestor establishes a containing block, and a stray
`transform` anywhere above would otherwise re-anchor a modal mid-page.

React 18 + TypeScript + Vite. No UI, icon or charting dependencies.
