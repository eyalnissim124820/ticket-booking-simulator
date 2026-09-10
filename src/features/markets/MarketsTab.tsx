import { useEffect, useMemo, useRef, useState } from 'react'
import {
  INSTRUMENTS,
  INSTRUMENT_BY_SYMBOL,
  RANGES,
  instrumentAbout,
  instrumentName,
  newsFor,
  sectorKey,
  seriesFor,
  type Range,
} from '../../data/stocks'
import { useStore, usePortfolio } from '../../state/store'
import { PriceChart, Sparkline } from './Chart'
import { OrderTicket } from './OrderTicket'
import { Empty, Select } from '../../components/ui'
import {
  IconArrowDown,
  IconArrowUp,
  IconChart,
  IconPause,
  IconPlay,
  IconStar,
} from '../../components/icons'
import { cx } from '../../lib/format'
import { useI18n } from '../../i18n'
import type { MessageKey } from '../../i18n/en'

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#14524a',
  Consumer: '#a03a63',
  Energy: '#bd8324',
  Healthcare: '#1f6f86',
  Financials: '#1d6b45',
  Industrials: '#ad3f2c',
  RealEstate: '#4a3b7a',
  Defence: '#2b4a80',
}

/** Adds a brief flash class whenever the value moves. */
function useFlash(value: number) {
  const previous = useRef(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  useEffect(() => {
    if (value > previous.current) setFlash('up')
    else if (value < previous.current) setFlash('down')
    previous.current = value
    const id = window.setTimeout(() => setFlash(null), 600)
    return () => window.clearTimeout(id)
  }, [value])
  return flash
}

function WatchRow({ symbol, active, onSelect }: { symbol: string; active: boolean; onSelect: () => void }) {
  const { locale, number, signedPercent } = useI18n()
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
        <div className="watch-name truncate">{instrumentName(instrument, locale)}</div>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <Sparkline
          series={quote.intraday.length > 2 ? quote.intraday : [quote.prevClose, quote.price]}
          positive={positive}
        />
        <div>
          <div className="watch-price">{number(quote.price)}</div>
          <div className={cx('watch-chg', positive ? 'up' : 'down')}>{signedPercent(quote.changePercent)}</div>
        </div>
      </div>
    </button>
  )
}

export function MarketsTab() {
  const { t, locale, money, number, signedMoney, signedPercent, timeAgo } = useI18n()
  const { state, dispatch, quotes, paused, setPaused, notify } = useStore()
  const portfolio = usePortfolio()

  // The Hebrew edition leads with the Tel Aviv board, the English one with the
  // global board — and follows the language when the reader switches.
  const [board, setBoard] = useState<'all' | 'tase' | 'global'>(locale === 'he' ? 'tase' : 'global')
  const [symbol, setSymbol] = useState(() => (locale === 'he' ? 'ELBT' : 'NVAX'))
  const [boardTouched, setBoardTouched] = useState(false)

  useEffect(() => {
    if (boardTouched) return
    const next = locale === 'he' ? 'tase' : 'global'
    setBoard(next)
    setSymbol((current) =>
      INSTRUMENT_BY_SYMBOL.get(current)?.exchange === next
        ? current
        : INSTRUMENTS.find((i) => i.exchange === next)!.symbol,
    )
  }, [locale, boardTouched])
  const [range, setRange] = useState<Range>('1M')
  const [listMode, setListMode] = useState<'board' | 'watchlist' | 'holdings'>('board')
  const [panel, setPanel] = useState<'positions' | 'orders' | 'activity'>('positions')

  const instrument = INSTRUMENT_BY_SYMBOL.get(symbol)!
  const quote = quotes[symbol]
  const positive = (quote?.change ?? 0) >= 0
  const news = useMemo(() => newsFor(symbol, locale), [symbol, locale])
  const series = useMemo(
    () => (quote ? seriesFor(symbol, range, quote.price, quote.intraday) : []),
    [symbol, range, quote],
  )

  const listedSymbols = useMemo(() => {
    if (listMode === 'watchlist') return state.watchlist
    if (listMode === 'holdings') return state.positions.map((p) => p.symbol)
    return INSTRUMENTS.filter((i) => board === 'all' || i.exchange === board).map((i) => i.symbol)
  }, [listMode, board, state.watchlist, state.positions])

  const openOrders = state.orders.filter((o) => o.status === 'open')
  const historicOrders = state.orders.filter((o) => o.status !== 'open')
  const watched = state.watchlist.includes(symbol)
  const position = state.positions.find((p) => p.symbol === symbol)
  const portfolioFlash = useFlash(Math.round(portfolio.marketValue * 100))

  const allocation = useMemo(() => {
    const bySector = new Map<string, number>()
    for (const row of portfolio.rows) {
      const sector = INSTRUMENT_BY_SYMBOL.get(row.symbol)?.sector ?? 'Technology'
      bySector.set(sector, (bySector.get(sector) ?? 0) + row.value)
    }
    const total = [...bySector.values()].reduce((a, b) => a + b, 0)
    return [...bySector.entries()]
      .map(([sector, value]) => ({ sector, value, share: total > 0 ? value / total : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [portfolio.rows])

  if (!quote) return null

  return (
    <div className="markets-layout page-enter">
      {/* ------------------------------------------------------------- list -- */}
      <aside className="card" style={{ overflow: 'hidden' }}>
        <div className="stack" style={{ padding: 12, gap: 8, borderBottom: '1px solid var(--rule)' }}>
          <div className="row" style={{ gap: 6 }}>
            {(['board', 'watchlist', 'holdings'] as const).map((mode) => (
              <button
                key={mode}
                className="chip"
                aria-pressed={listMode === mode}
                onClick={() => setListMode(mode)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {mode === 'board' ? t('common.any') : mode === 'watchlist' ? t('markets.watchlist') : t('markets.holdings')}
              </button>
            ))}
          </div>
          {listMode === 'board' && (
            <Select
              value={board}
              onChange={(v) => {
                setBoardTouched(true)
                setBoard(v as typeof board)
              }}
              ariaLabel={t('markets.exchangeGlobal')}
            >
              <option value="tase">{t('markets.exchangeTase')}</option>
              <option value="global">{t('markets.exchangeGlobal')}</option>
              <option value="all">{t('markets.all')}</option>
            </Select>
          )}
        </div>
        <div className="watch-list">
          {listedSymbols.length === 0 ? (
            <Empty
              icon={listMode === 'holdings' ? <IconChart size={30} /> : <IconStar size={30} />}
              title={listMode === 'holdings' ? t('markets.noPositions') : t('markets.emptyWatchlist')}
              body={t('markets.emptyWatchlistBody')}
            />
          ) : (
            listedSymbols.map((s) => (
              <WatchRow key={s} symbol={s} active={s === symbol} onSelect={() => setSymbol(s)} />
            ))
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------ quote -- */}
      <div className="stack" style={{ gap: 18 }}>
        <section className="card">
          <div className="card-pad stack" style={{ gap: 16 }}>
            <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 21 }}>{instrumentName(instrument, locale)}</h2>
                  <span className="pill mono">{instrument.symbol}</span>
                  <span className="pill" style={{ color: SECTOR_COLORS[instrument.sector] }}>
                    {t(sectorKey(instrument.sector))}
                  </span>
                  {instrument.exchange === 'tase' && (
                    <span className="pill pill-accent">{t('markets.telAviv')}</span>
                  )}
                </div>
                <div className="quote-head" style={{ marginTop: 12 }}>
                  <span className={cx('quote-price', positive ? 'up' : 'down')}>{number(quote.price)}</span>
                  <span className={cx('mono row', positive ? 'up' : 'down')} style={{ fontSize: 15, gap: 4 }}>
                    {positive ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />}
                    {signedMoney(quote.change)} ({signedPercent(quote.changePercent)})
                  </span>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {paused ? t('markets.feedPaused') : t('markets.updatedAgo', { ago: timeAgo(quote.updatedAt) })}
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
                      title: t(watched ? 'markets.removedFromWatch' : 'markets.addedToWatch', { symbol }),
                    })
                  }}
                >
                  <IconStar size={14} filled={watched} />
                  {watched ? t('markets.watching') : t('markets.watch')}
                </button>
                <button className="btn btn-sm" onClick={() => setPaused(!paused)}>
                  {paused ? <IconPlay size={13} /> : <IconPause size={13} />}
                  {paused ? t('markets.resumeFeed') : t('markets.pauseFeed')}
                </button>
              </div>
            </div>

            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {RANGES.map((r) => (
                <button key={r} className="chip" aria-pressed={range === r} onClick={() => setRange(r)}>
                  {r}
                </button>
              ))}
              <span className="faint grow" style={{ textAlign: 'end', fontSize: 12.5 }}>
                {t('markets.pointsHover', { count: series.length })}
              </span>
            </div>

            <PriceChart series={series} positive={positive} label={`${symbol}-${range}`} />
          </div>

          <div className="stat-grid">
            <div className="stat"><span>{t('markets.prevClose')}</span><strong>{number(quote.prevClose)}</strong></div>
            <div className="stat"><span>{t('markets.dayHigh')}</span><strong className="up">{number(quote.dayHigh)}</strong></div>
            <div className="stat"><span>{t('markets.dayLow')}</span><strong className="down">{number(quote.dayLow)}</strong></div>
            <div className="stat"><span>{t('markets.volume')}</span><strong>{(quote.volume / 1e6).toFixed(1)}M</strong></div>
            <div className="stat"><span>{t('markets.marketCap')}</span><strong>{money(instrument.marketCapB)}B</strong></div>
            <div className="stat"><span>{t('markets.pe')}</span><strong>{instrument.peRatio.toFixed(1)}</strong></div>
            <div className="stat"><span>{t('markets.divYield')}</span><strong>{instrument.dividendYield.toFixed(1)}%</strong></div>
            <div className="stat"><span>{t('markets.volatility')}</span><strong>{(instrument.volatility * 100).toFixed(0)}%</strong></div>
          </div>

          <div className="card-pad stack" style={{ gap: 14 }}>
            <p className="muted" style={{ fontSize: 13.5 }}>{instrumentAbout(instrument, locale)}</p>
            {position && (
              <div className="order-summary">
                <div className="row-between">
                  <span className="muted">{t('markets.yourPosition')}</span>
                  <strong className="mono">{number(position.quantity, 0)}</strong>
                </div>
                <div className="row-between">
                  <span className="muted">{t('markets.averageCost')}</span>
                  <span className="mono">{money(position.avgCost)}</span>
                </div>
                <div className="row-between">
                  <span className="muted">{t('markets.unrealised')}</span>
                  <strong className={cx('mono', quote.price >= position.avgCost ? 'up' : 'down')}>
                    {signedMoney((quote.price - position.avgCost) * position.quantity)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------- portfolio -- */}
        <section className="card">
          <div className="row" style={{ padding: 12, gap: 6, borderBottom: '1px solid var(--rule)', flexWrap: 'wrap' }}>
            {([
              ['positions', t('markets.positions', { count: state.positions.length })],
              ['orders', t('markets.ordersWorking', { count: openOrders.length })],
              ['activity', t('markets.activity')],
            ] as const).map(([id, label]) => (
              <button key={id} className="chip" aria-pressed={panel === id} onClick={() => setPanel(id)}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {panel === 'positions' &&
              (portfolio.rows.length === 0 ? (
                <Empty icon={<IconChart size={30} />} title={t('markets.noPositions')} body={t('markets.noPositionsBody')} />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('markets.symbol')}</th>
                      <th>{t('markets.qty')}</th>
                      <th>{t('markets.averageCost')}</th>
                      <th>{t('markets.last')}</th>
                      <th>{t('markets.marketValue')}</th>
                      <th>{t('markets.day')}</th>
                      <th>{t('markets.totalPnl')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.rows.map((row) => (
                      <tr key={row.symbol} style={{ cursor: 'pointer' }} onClick={() => setSymbol(row.symbol)}>
                        <td>
                          <strong className="mono">{row.symbol}</strong>
                          <div className="faint truncate" style={{ fontSize: 11.5, maxWidth: 150 }}>
                            {instrumentName(INSTRUMENT_BY_SYMBOL.get(row.symbol)!, locale)}
                          </div>
                        </td>
                        <td className="mono">{number(row.quantity, 0)}</td>
                        <td className="mono">{number(row.avgCost)}</td>
                        <td className="mono">{number(row.price)}</td>
                        <td className="mono">{money(row.value)}</td>
                        <td className={cx('mono', row.dayChange >= 0 ? 'up' : 'down')}>{signedMoney(row.dayChange)}</td>
                        <td className={cx('mono', row.pnl >= 0 ? 'up' : 'down')}>
                          {signedMoney(row.pnl)}
                          <div style={{ fontSize: 11.5 }}>{signedPercent(row.pnlPercent)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}

            {panel === 'orders' &&
              (state.orders.length === 0 ? (
                <Empty icon={<IconChart size={30} />} title={t('markets.noOrders')} body={t('markets.noOrdersBody')} />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('markets.symbol')}</th>
                      <th>{t('markets.side')}</th>
                      <th>{t('markets.type')}</th>
                      <th>{t('markets.qty')}</th>
                      <th>{t('markets.price')}</th>
                      <th>{t('markets.status')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...openOrders, ...historicOrders].map((order) => (
                      <tr key={order.id}>
                        <td><strong className="mono">{order.symbol}</strong></td>
                        <td className={order.side === 'buy' ? 'up' : 'down'}>{t(`side.${order.side}` as MessageKey)}</td>
                        <td className="muted">{t(`type.${order.type}` as MessageKey)}</td>
                        <td className="mono">{order.quantity}</td>
                        <td className="mono">
                          {order.fillPrice != null
                            ? number(order.fillPrice)
                            : order.limitPrice != null
                              ? `≤ ${number(order.limitPrice)}`
                              : '—'}
                        </td>
                        <td>
                          <span
                            className={cx(
                              'pill',
                              order.status === 'filled' && 'pill-up',
                              order.status === 'open' && 'pill-accent',
                              (order.status === 'cancelled' || order.status === 'rejected') && 'pill-down',
                            )}
                            title={order.note}
                          >
                            {t(`status.${order.status}` as MessageKey)}
                          </span>
                        </td>
                        <td>
                          {order.status === 'open' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                dispatch({ type: 'cancel-order', id: order.id })
                                notify({ tone: 'info', title: t('markets.orderCancelled') })
                              }}
                            >
                              {t('common.cancel')}
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
                <Empty icon={<IconChart size={30} />} title={t('markets.noActivity')} body={t('markets.noActivityBody')} />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('markets.when')}</th>
                      <th>{t('markets.activityCol')}</th>
                      <th>{t('markets.amount')}</th>
                      <th>{t('markets.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.ledger.map((entry) => (
                      <tr key={entry.id}>
                        <td className="faint">{timeAgo(entry.at)}</td>
                        <td>{t(entry.labelKey, entry.labelParams)}</td>
                        <td className={cx('mono', entry.amount >= 0 ? 'up' : 'down')}>{signedMoney(entry.amount)}</td>
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
      <div className="stack markets-side" style={{ gap: 18 }}>
        <OrderTicket instrument={instrument} quote={quote} />

        <div className="card card-pad stack" style={{ gap: 14 }}>
          <span className="panel-title">{t('markets.portfolio')}</span>
          <div className={cx(portfolioFlash === 'up' && 'flash-up', portfolioFlash === 'down' && 'flash-down')}>
            <div className="faint" style={{ fontSize: 11.5 }}>{t('wallet.netWorth')}</div>
            <div className="mono" style={{ fontSize: 26 }}>{money(portfolio.netWorth)}</div>
          </div>
          <div className="order-summary">
            <div className="row-between"><span className="muted">{t('wallet.cash')}</span><span className="mono">{money(state.cash)}</span></div>
            <div className="row-between"><span className="muted">{t('wallet.invested')}</span><span className="mono">{money(portfolio.marketValue)}</span></div>
            <div className="row-between">
              <span className="muted">{t('markets.unrealised')}</span>
              <span className={cx('mono', portfolio.totalPnl >= 0 ? 'up' : 'down')}>
                {signedMoney(portfolio.totalPnl)} ({signedPercent(portfolio.totalPnlPercent)})
              </span>
            </div>
            <div className="row-between">
              <span className="muted">{t('markets.day')}</span>
              <span className={cx('mono', portfolio.dayChange >= 0 ? 'up' : 'down')}>{signedMoney(portfolio.dayChange)}</span>
            </div>
          </div>

          {allocation.length > 0 && (
            <div className="stack" style={{ gap: 9 }}>
              <span className="panel-title">{t('markets.allocation')}</span>
              <div className="alloc-bar">
                {allocation.map((a) => (
                  <div
                    key={a.sector}
                    style={{ width: `${a.share * 100}%`, background: SECTOR_COLORS[a.sector] }}
                    title={`${t(sectorKey(a.sector as never))} · ${(a.share * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              {allocation.map((a) => (
                <div className="row-between" key={a.sector} style={{ fontSize: 13 }}>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="swatch" style={{ background: SECTOR_COLORS[a.sector] }} />
                    <span className="muted">{t(sectorKey(a.sector as never))}</span>
                  </span>
                  <span className="mono">{(a.share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad stack" style={{ gap: 12 }}>
          <span className="panel-title">{t('markets.news', { symbol })}</span>
          {news.map((item) => (
            <div key={item.id} className="stack" style={{ gap: 3 }}>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <span
                  className="swatch"
                  style={{
                    marginTop: 6,
                    background:
                      item.sentiment > 0 ? 'var(--up)' : item.sentiment < 0 ? 'var(--down)' : 'var(--rule-strong)',
                  }}
                />
                <span style={{ fontSize: 13.5 }}>{item.headline}</span>
              </div>
              <span className="faint" style={{ fontSize: 11.5, paddingInlineStart: 17 }}>
                {item.source} · {timeAgo(Date.now() - item.minutesAgo * 60_000)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
