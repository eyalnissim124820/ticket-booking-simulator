import { useEffect, useState } from 'react'
import { StoreProvider, usePortfolio, useStore, STARTING_CASH } from './state/store'
import { I18nProvider, useI18n } from './i18n'
import { FlightsTab } from './features/flights/FlightsTab'
import { StaysTab } from './features/stays/StaysTab'
import { MarketsTab } from './features/markets/MarketsTab'
import { BrandMark, Modal, Ornament } from './components/ui'
import {
  IconAlert,
  IconBed,
  IconChart,
  IconCheck,
  IconGlobe,
  IconInfo,
  IconPlane,
} from './components/icons'
import { cx } from './lib/format'

type TabId = 'flights' | 'stays' | 'markets'

const TABS: { id: TabId; key: 'nav.flights' | 'nav.stays' | 'nav.markets'; Icon: typeof IconPlane }[] = [
  { id: 'flights', key: 'nav.flights', Icon: IconPlane },
  { id: 'stays', key: 'nav.stays', Icon: IconBed },
  { id: 'markets', key: 'nav.markets', Icon: IconChart },
]

const DEPOSITS = [1000, 5000, 25000]

function LanguageToggle() {
  const { t, locale, setLocale } = useI18n()
  return (
    // The visible label names the language you switch TO, and is the accessible
    // name as well — an aria-label here would hide it from screen readers.
    <button
      className="lang-toggle"
      lang={locale === 'he' ? 'en' : 'he'}
      onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
    >
      <IconGlobe size={15} />
      {t('nav.switchTo')}
    </button>
  )
}

function Wallet() {
  const { t, money, signedMoney } = useI18n()
  const { state, dispatch, notify } = useStore()
  const portfolio = usePortfolio()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="wallet" onClick={() => setOpen(true)} aria-label={t('wallet.open')}>
        <span className="wallet-item">
          <span>{t('wallet.cash')}</span>
          <strong>{money(state.cash)}</strong>
        </span>
        <span className="wallet-item">
          <span>{t('wallet.netWorth')}</span>
          <strong className={cx(portfolio.rows.length > 0 && (portfolio.totalPnl >= 0 ? 'up' : 'down'))}>
            {money(portfolio.netWorth)}
          </strong>
        </span>
      </button>

      <Modal
        open={open}
        size="narrow"
        title={t('wallet.title')}
        subtitle={t('wallet.subtitle')}
        onClose={() => setOpen(false)}
      >
        <div className="order-summary">
          <div className="row-between"><span className="muted">{t('wallet.cashAvailable')}</span><strong className="mono">{money(state.cash)}</strong></div>
          <div className="row-between"><span className="muted">{t('wallet.invested')}</span><span className="mono">{money(portfolio.marketValue)}</span></div>
          <div className="row-between">
            <span className="muted">{t('wallet.unrealised')}</span>
            <span className={cx('mono', portfolio.totalPnl >= 0 ? 'up' : 'down')}>{signedMoney(portfolio.totalPnl)}</span>
          </div>
          <hr className="divider" />
          <div className="row-between">
            <strong>{t('wallet.netWorth')}</strong>
            <strong className="mono" style={{ fontSize: 17 }}>{money(portfolio.netWorth)}</strong>
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <span className="panel-title">{t('wallet.addFunds')}</span>
          <div className="row" style={{ gap: 8 }}>
            {DEPOSITS.map((amount) => (
              <button
                key={amount}
                className="btn grow"
                onClick={() => {
                  dispatch({ type: 'deposit', amount })
                  notify({
                    tone: 'success',
                    title: t('wallet.added', { amount: money(amount) }),
                    body: t('wallet.addedBody'),
                  })
                }}
              >
                +{money(amount)}
              </button>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <span className="panel-title">{t('wallet.session')}</span>
          <p className="faint" style={{ fontSize: 12.5 }}>
            {t('wallet.sessionBody', { amount: money(STARTING_CASH) })}
          </p>
          <button
            className="btn btn-danger"
            onClick={() => {
              dispatch({ type: 'reset' })
              setOpen(false)
              notify({ tone: 'info', title: t('wallet.resetDone'), body: t('wallet.resetBody') })
            }}
          >
            {t('wallet.resetAll')}
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
            {toast.tone === 'success' ? <IconCheck size={16} /> : toast.tone === 'error' ? <IconAlert size={16} /> : <IconInfo size={16} />}
          </span>
          <div>
            <strong style={{ fontSize: 13.5 }}>{toast.title}</strong>
            {toast.body && <div className="muted" style={{ fontSize: 12.5 }}>{toast.body}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function Shell() {
  const { t } = useI18n()
  const { state } = useStore()
  const [tab, setTab] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '')
    return TABS.some((x) => x.id === hash) ? (hash as TabId) : 'flights'
  })

  useEffect(() => {
    window.location.hash = tab
  }, [tab])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (TABS.some((x) => x.id === hash)) setTab(hash as TabId)
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
          <BrandMark />
          <div>
            <span className="brand-name">{t('app.name')}</span>
            <span className="brand-sub">{t('app.tagline')}</span>
          </div>
        </div>

        <nav className="tabs" role="tablist" aria-label={t('app.name')}>
          {TABS.map(({ id, key, Icon }) => (
            <button key={id} className="tab" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              <Icon size={16} />
              {t(key)}
              {counts[id] > 0 && <span className="badge">{counts[id]}</span>}
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          <LanguageToggle />
          <Wallet />
        </div>
      </header>

      <main className="main" role="tabpanel">
        {tab === 'flights' && <FlightsTab />}
        {tab === 'stays' && <StaysTab />}
        {tab === 'markets' && <MarketsTab />}

        <footer style={{ marginTop: 48, display: 'grid', justifyItems: 'center', gap: 10 }}>
          <Ornament />
          <p className="faint" style={{ fontSize: 12.5, textAlign: 'center' }}>{t('app.disclaimer')}</p>
        </footer>
      </main>

      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </I18nProvider>
  )
}
