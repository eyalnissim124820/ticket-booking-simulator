# Skyline Terminal

A single-page web app with three interactive desks — **flight booking**, **accommodation
booking** and **stock trading** — sharing one wallet.

Everything runs in the browser against generated mock data. There is no backend, no
database and no network call: fares, hotel inventory and price series are produced by a
seeded pseudo-random generator, so the same search always returns the same results.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production bundle), `npm run preview`,
`npm run typecheck`.

## The three tabs

### ✈️ Flights
- Airport autocomplete over 40 airports, one-way or round trip, 1–6 travellers, four cabins.
- Generated fares with real great-circle distances: connections are only routed through
  airports that lie roughly on the way, and multi-stop itineraries can't double back.
- Filter by stops, departure window, price cap and airline; sort by price, duration or
  departure/arrival time. Expandable per-leg detail with layover times.
- Four-step booking: review → seat map (live seat fees, extra-legroom rows) → traveller
  details with validation → extras and payment.
- **My trips** holds confirmed itineraries with references; cancelling refunds in full on a
  flexible fare, otherwise 80%.

### 🛏️ Stays
- 16 destinations, 18 generated properties each, with room types, amenities and reviews.
- Filter by nightly budget, guest rating, property type, required amenities and free
  cancellation; sort five ways, including a value-weighted "recommended".
- Property detail with a gallery, amenity list, per-room pricing for your dates and reviews.
- Three-step reservation with an optional breakfast add-on and a full price breakdown
  (subtotal, 12% tax, service fee). Reservations can be cancelled for a full refund.

### 📈 Markets
- 12 instruments with 400 days of generated daily history, plus a live price feed that
  ticks every 1.6s via a geometric random walk (pausable).
- Interactive SVG chart — no chart library — with 1D/1W/1M/6M/1Y ranges and a hover
  crosshair; sparklines in the symbol list, which flashes green/red on each tick.
- **Market orders** fill immediately. **Limit orders** rest and fill automatically the
  moment the simulated price crosses them.
- Positions table with average cost, market value, day change and unrealised P/L that
  recomputes on every tick; sector allocation bar; order book; and a full cash ledger.

## Shared wallet

All three tabs spend from one balance, opening at $25,000. Flights, stays and trades all
debit it, refunds and deposits credit it, and every movement is recorded in the ledger
under **Markets → Activity**. State persists to `localStorage`, so a reload keeps your
trips, reservations and positions; the wallet menu can top up or reset the session.

## Structure

```
src/
  data/        seeded generators — airports, flights, hotels, instruments & price walk
  state/       reducer store, localStorage persistence, live quote feed, portfolio maths
  features/    flights/ · stays/ · markets/
  components/  modal, autocomplete, stepper and other shared primitives
  lib/         PRNG helpers and formatting
  styles/      design tokens and layout
```

React 18 + TypeScript + Vite. No UI or charting dependencies.
