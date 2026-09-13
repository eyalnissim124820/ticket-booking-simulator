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

The app opens on a **Start simulation** gate: five numbered missions, and nothing else to
read. Pressing start begins the clock and resets the wallet to the opening balance, so
every run begins from the same slate and times and results are comparable between players.

The missions are worked in order, one at a time:

| # | Mission | Where |
| --- | --- | --- |
| 1 | Assemble a drawer | Away from the screen |
| 2 | Book a flight | Flights |
| 3 | Book a stay | Stays |
| 4 | Buy a stock | Markets |
| 5 | Sell a stock | Markets |

**Mission one happens in the real world.** The app does nothing for it but keep time: a
full-screen stopwatch runs while you build the drawer, and you press **I'm done** when you
come back. Every mission after it is cleared inside the app.

**The travel missions come with a brief.** Each run draws a trip — where to fly, which
weekend, how many people — and the handoff card shows it before the next mission's clock
starts. While the flight or the stay mission is live, the same brief sits in a strip under
the header: *Book a flight · Tel Aviv → Milan · Fri, Oct 9 → Sun, Oct 11 · 2 travellers*.
The stay mission inherits the same city, dates and party size, so one brief covers the
whole trip. Nothing is pre-filled into the search forms and nothing is checked against the
brief — it is the target to work to, not a rail.

Clearing a mission takes over the screen with a handoff card — a tick, the mission name,
the **time that mission took**, what it **cost or earned**, the **budget left** and the
checklist with the next mission highlighted. Nothing advances until you press **Next
mission**, so each step reads as finished before the following one starts. Bookings that
clear a mission close their own confirmation screen and let the handoff card stand in its
place.

Every booking and every trade moves the budget: the wallet in the header tints and hangs
the exact amount below it (−$561.00) for a couple of seconds after each movement, and the
handoff card carries the same number.

While a run is live a notch sits centred in the navigation bar — a dark island with
concave shoulders, a lens dot, the elapsed clock, the mission counter and the name of the
mission it is waiting on. The lens lights green when the run closes. Below 1200px, where
the header can no longer hold everything on one line, the notch takes the top row on its
own.

When the fifth mission clears the clock freezes and a **run summary** reports the total
time, every mission with its own duration and its own effect on the budget, then the
starting budget, **total spent**, **total earned**, **final net worth** and **net
result** — the numbers you would rank runs by.

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

Light, flat and editorial — cool paper (`#f4f7fb`), navy ink, the brand blue with a
map-pin orange accent, hairline rules instead of shadows, and a serif display face against
a grotesque UI face.

Every colour is pulled from the Eli Baba logo: the navy of the "Eli" wordmark (`#112852`)
is the ink, the blue of "Baba" (`#0174d4`) is the brand, and the pin (`#fe5a1d`) is the
accent. `--brand` is a mid-tone, so it carries white on a fill but is too light to be
small text on paper — `--brand-text` (`#0b4e8c`) is the same hue taken down for links,
pills and labels, while fills, borders and the large numerals keep the vivid blue.

- **No gradients anywhere.** Colour is applied as flat fills, rules and tint blocks. The
  page texture is a tiled SVG dot, and the chart's area fill is a flat tint.
- **No emoji.** Every glyph is a line icon from `src/components/icons.tsx`, drawn on a
  24×24 grid and inheriting `currentColor`.
- **Typography** is `Frank Ruhl Libre` (display) and `Assistant` (UI) — both carry Hebrew
  *and* Latin, so the two languages share one voice instead of clashing — with
  `IBM Plex Mono` for figures. All three degrade to system stacks if the CDN is unreachable.

### Welcome reveal
A cold open plays an intro before the start gate (`src/features/session/Splash.tsx`): the
mark lands with an overshoot, the route line draws itself around it, a plane rides the ring
round to where the pin drops, the wordmark rises out of its own clip in the logo's two
tones, and the navy panel lifts away to uncover the gate. The ring runs two full cycles
before it settles and the plane flies two laps behind it, which is what sets the roughly
five-second length; `HOLD_MS` and the CSS delays are kept in step with each other. It runs
once per page load — a reset returns to the gate without replaying it — and any key, a
click or the skip button ends it early. It does not play at all under
`prefers-reduced-motion`, or on a reload that lands mid-run.

### Ad breaks
A run is interrupted a few times by a full-screen ad (`src/features/session/AdBreak.tsx`,
creative in `src/data/ads.ts`), the way a free consumer site interrupts one. The first
lands 25–45s into the second mission and the rest follow 50–80s apart, so no two runs are
broken up alike. The close button counts down for four seconds and an ignored break gives
up on its own after fifteen, so a timed run can never be held hostage.

Breaks never open over mission one, which happens behind its own gate, nor over a handoff
or a finished run — and a break that is showing when one of those starts is closed and
rescheduled rather than left hanging. The creative is not translated: an advertiser's name
and copy arrive in the language they were written in, so it renders as an explicit
`dir="rtl"` island whichever way the app around it is running. Only the chrome around it —
the label, the close button, the disclaimer — goes through the message catalogue.

### Loading animations
A dot travelling the brand's route line, pulsing skeleton cards matched to the real card shapes (flight
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

Photographs are fetched as early as there is anything to fetch. Left alone a listing photo
waits on two things stacked in front of the download — the card rendering behind its
skeleton, then the card scrolling into view — so `prefetchStayPhotos` warms the browser
cache for every listing in the destination the moment the results exist, spending the
750ms skeleton window on the network instead of idling through it. The popular tiles are
warmed when the tab mounts, the first row of cards is marked eager rather than lazy, and
both photo hosts are `preconnect`ed from `index.html` so the first image does not pay for
a DNS lookup and TLS handshake. Warming every listing rather than only the filtered ones
means changing a filter costs nothing.

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
  state/       reducer store, session/missions, persistence, quote feed, portfolio maths
  features/    flights/ · stays/ · markets/ · session/
  components/  icons, airline logos, modal, autocomplete, date picker, loaders
  lib/         PRNG helpers and locale-independent formatting
  styles/      design tokens and layout
```

`public/` carries the favicon set, the web manifest and `brand/eli-baba-mark.png` — the
circular mark the header and start gate render. The approved masters it was exported from
(the full lockup and the isolated icon) live in `docs/brand/` and are not shipped.

Overlays are portalled to `<body>` and freeze the page behind them: `position: fixed` is
only viewport-relative when no ancestor establishes a containing block, and a stray
`transform` anywhere above would otherwise re-anchor a modal mid-page.

React 18 + TypeScript + Vite. No UI, icon or charting dependencies.
