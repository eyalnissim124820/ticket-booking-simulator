import { useEffect, useMemo, useRef, useState } from 'react'
import {
  INSTRUMENTS,
  INSTRUMENT_BY_SYMBOL,
  RANGES,
  newsFor,
  seriesFor,
  type Range,
} from '../../data/stocks'
import { useStore, usePortfolio } from '../../state/store'
import { PriceChart, Sparkline } from './Chart'
import { OrderTicket } from './OrderTicket'
import { Empty } from '../../components/ui'
import { cx, money, number, signedMoney, signedPercent, timeAgo } from '../../lib/format'

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#5eead4',
  Consumer: '#a78bfa',
  Energy: '#fbbf24',
  Healthcare: '#38bdf8',
  Financials: '#34d399',
  Industrials: '#fb7185',
}

/** Adds a brief flash class whenever the value moves. */
function useFlash(value: number) {
  const previous = useRef(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  useEffect(() => {
    if (value > previous.current) setFlash('up')
    else if (value < previous.current) setFlash('down')
    previous.current = value
    const id = window.setTimeout(() => setFlash(null), 550)
    return () => window.clearTimeout(id)
  }, [value])
  return flash
}

function WatchRow({
  symbol,
  active,
  onSelect,
}: {
  symbol: string
  active: boolean
  onSelect: () => void
}) {
  const { quotes } = useStore()
  const quote = quotes[symbol]
  const instrument = INSTRUMENT_BY_SYMBOL.get(symbol)
  const flash = useFlash(quote?.price ?? 0)
  if (!quote || !instrument) return null
  const positive = quote.change >= 0
  return (
    <button
      className={cx('watch-row', active && 'active', flash === 'up' && 'flash-up', flash === 'down' && 'flash-down')}
      onClick={onSelect}
    >
      <div style={{ minWidth: 0 }}>
        <div className="watch-sym">{symbol}</div>
        <div className="watch-name truncate">{instrument.name}</div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <Sparkline series={quote.intraday.length > 2 ? quote.intraday : [quote.prevClose, quote.price]} positive={positive} />
        <div>
          <div className="watch-price">{quote.price.toFixed(2)}</div>
          <div className={cx('watch-chg', positive ? 'up' : 'down')}>
            {signedPercent(quote.changePercent)}
          </div>
        </div>
      </div>
    </button>
  )
}

export function MarketsTab() {
  const { state, dispatch, quotes, paused, setPaused, notify } = useStore()
  const portfolio = usePortfolio()
  const [symbol, setSymbol] = useState('NVAX')
  const [range, setRange] = useState<Range>('1M')
  const [listMode, setListMode] = useState<'all' | 'watchlist' | 'holdings'>('all')
  const [panel, setPanel] = useState<'positions' | 'orders' | 'activity'>('positions')

  const instrument = INSTRUMENT_BY_SYMBOL.get(symbol)!
  const quote = quotes[symbol]
  const positive = (quote?.change ?? 0) >= 0
  const news = useMemo(() => newsFor(symbol), [symbol])
  const series = useMemo(
    () => (quote ? seriesFor(symbol, range, quote.price, quote.intraday) : []),
    [symbol, range, quote],
  )

  const listedSymbols = useMemo(() => {
    if (listMode === 'watchlist') return state.watchlist
    if (listMode === 'holdings') return state.positions.map((p) => p.symbol)
    return INSTRUMENTS.map((i) => i.symbol)
  }, [listMode, state.watchlist, state.positions])

  const openOrders = state.orders.filter((o) => o.status === 'open')
  const historicOrders = state.orders.filter((o) => o.status !== 'open')
  const watched = state.watchlist.includes(symbol)
  const position = state.positions.find((p) => p.symbol === symbol)
  const portfolioFlash = useFlash(Math.round(portfolio.marketValue * 100))

  const allocation = useMemo(() => {
    const bySector = new Map<string, number>()
    for (const row of portfolio.rows) {
      const sector = INSTRUMENT_BY_SYMBOL.get(row.symbol)?.sector ?? 'Other'
      bySector.set(sector, (bySector.get(sector) ?? 0) + row.value)
    }
    const total = [...bySector.values()].reduce((a, b) => a + b, 0)
    return [...bySector.entries()]
      .map(([sector, value]) => ({ sector, value, share: total > 0 ? value / total : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [portfolio.rows])

  if (!quote) return null

  return (
    <div className="markets-layout">
      {/* ------------------------------------------------------------- list -- */}
      <aside className="card" style={{ overflow: 'hidden' }}>
        <div className="row" style={{ padding: 10, gap: 4, borderBottom: '1px solid var(--line-soft)' }}>
          {(['all', 'watchlist', 'holdings'] as const).map((mode) => (
            <button
              key={mode}
              className="chip"
              aria-pressed={listMode === mode}
              onClick={() => setListMode(mode)}
              style={{ flex: 1, textAlign: 'center' }}
            >
              {mode === 'all' ? 'All' : mode === 'watchlist' ? 'Watchlist' : 'Holdings'}
            </button>
          ))}
        </div>
        <div className="watch-list">
          {listedSymbols.length === 0 ? (
            <Empty
              icon={listMode === 'holdings' ? '📈' : '⭐'}
              title={listMode === 'holdings' ? 'No positions yet' : 'Watchlist is empty'}
              body="Add symbols with the star on any quote."
            />
          ) : (
            listedSymbols.map((s) => (
              <WatchRow key={s} symbol={s} active={s === symbol} onSelect={() => setSymbol(s)} />
            ))
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------ quote -- */}
      <div className="stack" style={{ gap: 16 }}>
        <section className="card card-pad stack" style={{ gap: 16 }}>
          <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div className="row" style={{ gap: 9 }}>
                <h2 style={{ fontSize: 19 }}>{instrument.name}</h2>
                <span className="pill mono">{instrument.symbol}</span>
                <span
                  className="pill"
                  style={{ color: SECTOR_COLORS[instrument.sector], borderColor: 'var(--line)' }}
                >
                  {instrument.sector}
                </span>
              </div>
              <div className="quote-head" style={{ marginTop: 10 }}>
                <span className={cx('quote-price', positive ? 'up' : 'down')}>
                  {quote.price.toFixed(2)}
                </span>
                <span className={cx('mono', positive ? 'up' : 'down')} style={{ fontSize: 15 }}>
                  {signedMoney(quote.change)} ({signedPercent(quote.changePercent)})
                </span>
                <span className="faint" style={{ fontSize: 12 }}>
                  {paused ? 'feed paused' : `updated ${timeAgo(quote.updatedAt)}`}
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn btn-sm"
                onClick={() => {
                  dispatch({ type: 'toggle-watch', symbol })
                  notify({
                    tone: 'info',
                    title: watched ? `${symbol} removed from watchlist` : `${symbol} added to watchlist`,
                  })
                }}
              >
                {watched ? '★ Watching' : '☆ Watch'}
              </button>
              <button className="btn btn-sm" onClick={() => setPaused(!paused)}>
                {paused ? '▶ Resume feed' : '⏸ Pause feed'}
              </button>
            </div>
          </div>

          <div className="row" style={{ gap: 6 }}>
            {RANGES.map((r) => (
              <button key={r} className="chip" aria-pressed={range === r} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
            <span className="faint grow" style={{ textAlign: 'right', fontSize: 12 }}>
              {series.length} points · hover for detail
            </span>
          </div>

          <PriceChart series={series} positive={positive} label={instrument.name} />

          <div className="stat-grid">
            <div className="stat"><span>Prev close</span><strong>{quote.prevClose.toFixed(2)}</strong></div>
            <div className="stat"><span>Day high</span><strong className="up">{quote.dayHigh.toFixed(2)}</strong></div>
            <div className="stat"><span>Day low</span><strong className="down">{quote.dayLow.toFixed(2)}</strong></div>
            <div className="stat"><span>Volume</span><strong>{(quote.volume / 1e6).toFixed(1)}M</strong></div>
            <div className="stat"><span>Mkt cap</span><strong>${instrument.marketCapB}B</strong></div>
            <div className="stat"><span>P/E</span><strong>{instrument.peRatio.toFixed(1)}</strong></div>
            <div className="stat"><span>Div yield</span><strong>{instrument.dividendYield.toFixed(1)}%</strong></div>
            <div className="stat"><span>Volatility</span><strong>{(instrument.volatility * 100).toFixed(0)}%</strong></div>
          </div>

          <p className="muted" style={{ fontSize: 13 }}>{instrument.about}</p>

          {position && (
            <div className="order-summary">
              <div className="row-between">
                <span className="muted">Your position</span>
                <strong className="mono">{number(position.quantity, 0)} shares</strong>
              </div>
              <div className="row-between">
                <span className="muted">Average cost</span>
                <span className="mono">{money(position.avgCost)}</span>
              </div>
              <div className="row-between">
                <span className="muted">Unrealised P/L</span>
                <strong className={cx('mono', quote.price >= position.avgCost ? 'up' : 'down')}>
                  {signedMoney((quote.price - position.avgCost) * position.quantity)}
                </strong>
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- portfolio -- */}
        <section className="card">
          <div className="row" style={{ padding: 12, gap: 4, borderBottom: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
            {([
              ['positions', `Positions (${state.positions.length})`],
              ['orders', `Orders (${openOrders.length} working)`],
              ['activity', 'Activity'],
            ] as const).map(([id, label]) => (
              <button key={id} className="chip" aria-pressed={panel === id} onClick={() => setPanel(id)}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: 4, overflowX: 'auto' }}>
            {panel === 'positions' &&
              (portfolio.rows.length === 0 ? (
                <Empty icon="📊" title="No open positions" body="Buy something from the order ticket to start a portfolio." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Avg cost</th>
                      <th>Last</th>
                      <th>Market value</th>
                      <th>Day</th>
                      <th>Total P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.rows.map((row) => (
                      <tr key={row.symbol} style={{ cursor: 'pointer' }} onClick={() => setSymbol(row.symbol)}>
                        <td>
                          <strong className="mono">{row.symbol}</strong>
                          <div className="faint" style={{ fontSize: 11 }}>
                            {INSTRUMENT_BY_SYMBOL.get(row.symbol)?.name}
                          </div>
                        </td>
                        <td className="mono">{number(row.quantity, 0)}</td>
                        <td className="mono">{row.avgCost.toFixed(2)}</td>
                        <td className="mono">{row.price.toFixed(2)}</td>
                        <td className="mono">{money(row.value)}</td>
                        <td className={cx('mono', row.dayChange >= 0 ? 'up' : 'down')}>
                          {signedMoney(row.dayChange)}
                        </td>
                        <td className={cx('mono', row.pnl >= 0 ? 'up' : 'down')}>
                          {signedMoney(row.pnl)}
                          <div style={{ fontSize: 11 }}>{signedPercent(row.pnlPercent)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}

            {panel === 'orders' &&
              (state.orders.length === 0 ? (
                <Empty icon="🧾" title="No orders yet" body="Market orders fill instantly; limit orders rest until the price crosses." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...openOrders, ...historicOrders].map((order) => (
                      <tr key={order.id}>
                        <td><strong className="mono">{order.symbol}</strong></td>
                        <td className={order.side === 'buy' ? 'up' : 'down'}>
                          {order.side === 'buy' ? 'Buy' : 'Sell'}
                        </td>
                        <td className="muted">{order.type}</td>
                        <td className="mono">{order.quantity}</td>
                        <td className="mono">
                          {order.fillPrice != null
                            ? order.fillPrice.toFixed(2)
                            : order.limitPrice != null
                              ? `≤ ${order.limitPrice.toFixed(2)}`
                              : '—'}
                        </td>
                        <td>
                          <span
                            className={cx(
                              'pill',
                              order.status === 'filled' && 'pill-up',
                              order.status === 'open' && 'pill-amber',
                              (order.status === 'cancelled' || order.status === 'rejected') && 'pill-down',
                            )}
                            title={order.note}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {order.status === 'open' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                dispatch({ type: 'cancel-order', id: order.id })
                                notify({ tone: 'info', title: 'Order cancelled' })
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}

            {panel === 'activity' &&
              (state.ledger.length === 0 ? (
                <Empty icon="🧭" title="Nothing has happened yet" body="Bookings, trades and refunds all land in this ledger." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Activity</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ledger.map((entry) => (
                      <tr key={entry.id}>
                        <td className="faint">{timeAgo(entry.at)}</td>
                        <td>{entry.label}</td>
                        <td className={cx('mono', entry.amount >= 0 ? 'up' : 'down')}>
                          {signedMoney(entry.amount)}
                        </td>
                        <td className="mono muted">{money(entry.balanceAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------- side -- */}
      <div className="stack markets-side" style={{ gap: 16 }}>
        <OrderTicket instrument={instrument} quote={quote} />

        <div className="card card-pad stack" style={{ gap: 12 }}>
          <span className="panel-title">Portfolio</span>
          <div className={cx(portfolioFlash === 'up' && 'flash-up', portfolioFlash === 'down' && 'flash-down')} style={{ borderRadius: 8 }}>
            <div className="faint" style={{ fontSize: 11.5 }}>Net worth</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{money(portfolio.netWorth)}</div>
          </div>
          <div className="order-summary">
            <div className="row-between"><span className="muted">Cash</span><span className="mono">{money(state.cash)}</span></div>
            <div className="row-between"><span className="muted">Positions</span><span className="mono">{money(portfolio.marketValue)}</span></div>
            <div className="row-between">
              <span className="muted">Unrealised P/L</span>
              <span className={cx('mono', portfolio.totalPnl >= 0 ? 'up' : 'down')}>
                {signedMoney(portfolio.totalPnl)} ({signedPercent(portfolio.totalPnlPercent)})
              </span>
            </div>
            <div className="row-between">
              <span className="muted">Today</span>
              <span className={cx('mono', portfolio.dayChange >= 0 ? 'up' : 'down')}>
                {signedMoney(portfolio.dayChange)}
              </span>
            </div>
          </div>

          {allocation.length > 0 && (
            <div className="stack" style={{ gap: 8 }}>
              <span className="panel-title">Allocation</span>
              <div className="alloc-bar">
                {allocation.map((a) => (
                  <div
                    key={a.sector}
                    style={{ width: `${a.share * 100}%`, background: SECTOR_COLORS[a.sector] ?? 'var(--surface-3)' }}
                    title={`${a.sector} · ${(a.share * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              {allocation.map((a) => (
                <div className="row-between" key={a.sector} style={{ fontSize: 12.5 }}>
                  <span className="row" style={{ gap: 7 }}>
                    <span
                      className="airline-dot"
                      style={{ background: SECTOR_COLORS[a.sector] ?? 'var(--surface-3)' }}
                    />
                    <span className="muted">{a.sector}</span>
                  </span>
                  <span className="mono">{(a.share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad stack" style={{ gap: 10 }}>
          <span className="panel-title">{symbol} news</span>
          {news.map((item) => (
            <div key={item.id} className="stack" style={{ gap: 3 }}>
              <div className="row" style={{ gap: 7, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12 }}>
                  {item.sentiment > 0 ? '🟢' : item.sentiment < 0 ? '🔴' : '⚪'}
                </span>
                <span style={{ fontSize: 13 }}>{item.headline}</span>
              </div>
              <span className="faint" style={{ fontSize: 11, paddingLeft: 20 }}>
                {item.source} ·{' '}
                {item.minutesAgo < 60
                  ? `${item.minutesAgo}m ago`
                  : `${Math.round(item.minutesAgo / 60)}h ago`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
