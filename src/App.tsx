import { useEffect, useState } from 'react'
import { StoreProvider, usePortfolio, useStore, STARTING_CASH } from './state/store'
import { FlightsTab } from './features/flights/FlightsTab'
import { StaysTab } from './features/stays/StaysTab'
import { MarketsTab } from './features/markets/MarketsTab'
import { Modal } from './components/ui'
import { cx, money, signedMoney } from './lib/format'

type TabId = 'flights' | 'stays' | 'markets'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'flights', label: 'Flights', icon: '✈️' },
  { id: 'stays', label: 'Stays', icon: '🛏️' },
  { id: 'markets', label: 'Markets', icon: '📈' },
]

const DEPOSITS = [1000, 5000, 25000]

function Wallet() {
  const { state, dispatch, notify } = useStore()
  const portfolio = usePortfolio()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="wallet"
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', textAlign: 'left' }}
        aria-label="Open wallet"
      >
        <div className="wallet-item">
          <span>Cash</span>
          <strong>{money(state.cash)}</strong>
        </div>
        <div className="wallet-item">
          <span>Net worth</span>
          <strong className={cx(portfolio.rows.length > 0 && (portfolio.totalPnl >= 0 ? 'up' : 'down'))}>
            {money(portfolio.netWorth)}
          </strong>
        </div>
      </button>

      <Modal open={open} title="Wallet" subtitle="One balance across all three desks" onClose={() => setOpen(false)} size="narrow">
        <div className="order-summary">
          <div className="row-between"><span className="muted">Cash available</span><strong className="mono">{money(state.cash)}</strong></div>
          <div className="row-between"><span className="muted">Invested</span><span className="mono">{money(portfolio.marketValue)}</span></div>
          <div className="row-between">
            <span className="muted">Unrealised P/L</span>
            <span className={cx('mono', portfolio.totalPnl >= 0 ? 'up' : 'down')}>
              {signedMoney(portfolio.totalPnl)}
            </span>
          </div>
          <hr className="divider" />
          <div className="row-between">
            <strong>Net worth</strong>
            <strong className="mono" style={{ fontSize: 17 }}>{money(portfolio.netWorth)}</strong>
          </div>
        </div>

        <div className="stack" style={{ gap: 9 }}>
          <span className="panel-title">Add simulated funds</span>
          <div className="row" style={{ gap: 8 }}>
            {DEPOSITS.map((amount) => (
              <button
                key={amount}
                className="btn grow"
                onClick={() => {
                  dispatch({ type: 'deposit', amount })
                  notify({ tone: 'success', title: `${money(amount)} added`, body: 'Play money — this is a simulator.' })
                }}
              >
                +{money(amount)}
              </button>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 9 }}>
          <span className="panel-title">Session</span>
          <p className="faint" style={{ fontSize: 12.5 }}>
            Everything you book, trade and save lives in this browser only. Resetting clears your
            trips, reservations, positions and ledger, and restores the opening balance of{' '}
            {money(STARTING_CASH)}.
          </p>
          <button
            className="btn btn-danger"
            onClick={() => {
              dispatch({ type: 'reset' })
              setOpen(false)
              notify({ tone: 'info', title: 'Session reset', body: 'Back to a clean slate.' })
            }}
          >
            Reset everything
          </button>
        </div>
      </Modal>
    </>
  )
}

function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className={cx('toast', toast.tone)} onClick={() => dismissToast(toast.id)} role="status">
          <span className="toast-icon">
            {toast.tone === 'success' ? '✅' : toast.tone === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <div>
            <strong style={{ fontSize: 13 }}>{toast.title}</strong>
            {toast.body && <div className="muted" style={{ fontSize: 12.5 }}>{toast.body}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function Shell() {
  const { state } = useStore()
  const [tab, setTab] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '')
    return TABS.some((t) => t.id === hash) ? (hash as TabId) : 'flights'
  })

  useEffect(() => {
    window.location.hash = tab
  }, [tab])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (TABS.some((t) => t.id === hash)) setTab(hash as TabId)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const counts: Record<TabId, number> = {
    flights: state.flightBookings.filter((b) => b.status === 'confirmed').length,
    stays: state.stayBookings.filter((b) => b.status === 'confirmed').length,
    markets: state.positions.length,
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <div>
            Skyline Terminal
            <small>Simulator</small>
          </div>
        </div>

        <nav className="tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="tab"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
              {counts[t.id] > 0 && <span className="badge">{counts[t.id]}</span>}
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          <Wallet />
        </div>
      </header>

      <main className="main" role="tabpanel">
        {tab === 'flights' && <FlightsTab />}
        {tab === 'stays' && <StaysTab />}
        {tab === 'markets' && <MarketsTab />}
      </main>

      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
