import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OBJECTIVE_KEYS, type SessionObjectives } from '../../state/types'
import { STARTING_CASH, usePortfolio, useStore } from '../../state/store'
import { BrandMark, Modal, Ornament } from '../../components/ui'
import {
  IconArrowUp,
  IconBed,
  IconChart,
  IconCheck,
  IconClock,
  IconPlane,
} from '../../components/icons'
import { cx } from '../../lib/format'
import { useI18n } from '../../i18n'
import type { MessageKey } from '../../i18n/en'

const OBJECTIVE_META: Record<
  keyof SessionObjectives,
  { label: MessageKey; hint: MessageKey; Icon: typeof IconPlane }
> = {
  flight: { label: 'session.objFlight', hint: 'session.objFlightHint', Icon: IconPlane },
  stay: { label: 'session.objStay', hint: 'session.objStayHint', Icon: IconBed },
  buy: { label: 'session.objBuy', hint: 'session.objBuyHint', Icon: IconChart },
  sell: { label: 'session.objSell', hint: 'session.objSellHint', Icon: IconArrowUp },
}

/** mm:ss, growing to h:mm:ss once a run passes the hour. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Elapsed run time: ticks while running, frozen once the run completes. */
export function useElapsed(): number {
  const { state } = useStore()
  const { session } = state
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (session.status !== 'running') return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [session.status])

  if (!session.startedAt) return 0
  const end = session.status === 'complete' && session.completedAt ? session.completedAt : now
  return end - session.startedAt
}

function ObjectiveList({
  objectives,
  withHints = false,
}: {
  objectives: SessionObjectives
  withHints?: boolean
}) {
  const { t } = useI18n()
  return (
    <ul className="objective-list">
      {OBJECTIVE_KEYS.map((key) => {
        const { label, hint, Icon } = OBJECTIVE_META[key]
        const done = objectives[key]
        return (
          <li key={key} className={cx('objective', done && 'done')}>
            <span className="objective-mark">{done ? <IconCheck size={13} /> : <Icon size={14} />}</span>
            <span className="grow">
              <strong>{t(label)}</strong>
              {withHints && <span className="faint" style={{ fontSize: 12.5 }}> · {t(hint)}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Non-dismissible gate shown before a run begins. */
export function StartGate({ languageToggle }: { languageToggle: ReactNode }) {
  const { t, money } = useI18n()
  const { state, dispatch } = useStore()
  const idle = state.session.status === 'idle'

  useEffect(() => {
    if (!idle) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [idle])

  if (!idle) return null

  return createPortal(
    <div className="gate" role="dialog" aria-modal="true">
      <div className="gate-panel">
        <div className="gate-lang">{languageToggle}</div>
        <BrandMark size={40} />
        <span className="panel-title">{t('session.eyebrow')}</span>
        <h1 className="gate-title">{t('session.gateTitle')}</h1>
        <p className="muted" style={{ maxWidth: 460 }}>
          {t('session.gateBody', { amount: money(STARTING_CASH) })}
        </p>

        <div className="gate-objectives">
          <span className="panel-title">{t('session.objectives')}</span>
          <ObjectiveList objectives={{ flight: false, stay: false, buy: false, sell: false }} withHints />
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ minWidth: 250 }}
          onClick={() => dispatch({ type: 'start-session' })}
        >
          {t('session.start')}
        </button>

        <Ornament />
        <p className="faint" style={{ fontSize: 12.5, maxWidth: 430 }}>{t('session.gateFooter')}</p>
      </div>
    </div>,
    document.body,
  )
}

/** Live clock and objective counter, sitting beside the wallet. */
export function SessionClock() {
  const { t } = useI18n()
  const { state } = useStore()
  const { session } = state
  const elapsed = useElapsed()

  if (session.status === 'idle') return null
  const done = OBJECTIVE_KEYS.filter((key) => session.objectives[key]).length

  return (
    <div className={cx('session-clock', session.status === 'complete' && 'finished')}>
      <span className="session-clock-item">
        <span>{t('session.elapsedLabel')}</span>
        <strong className="mono row" style={{ gap: 5 }}>
          <IconClock size={13} />
          {formatElapsed(elapsed)}
        </strong>
      </span>
      <span className="session-clock-item">
        <span>{t('session.progressLabel')}</span>
        <strong className="mono">{t('session.progress', { done, total: OBJECTIVE_KEYS.length })}</strong>
      </span>
    </div>
  )
}

/** Result card shown once every objective clears. */
export function CompletionModal() {
  const { t, money, signedMoney } = useI18n()
  const { state, dispatch } = useStore()
  const portfolio = usePortfolio()
  const { session } = state
  const [dismissed, setDismissed] = useState(false)
  const elapsed = useElapsed()

  // A fresh run gets its own result card.
  useEffect(() => {
    if (session.status !== 'complete') setDismissed(false)
  }, [session.status])

  const net = portfolio.netWorth - STARTING_CASH

  return (
    <Modal
      open={session.status === 'complete' && !dismissed}
      size="narrow"
      title={t('session.completeTitle')}
      onClose={() => setDismissed(true)}
      footer={
        <>
          <button className="btn grow" onClick={() => setDismissed(true)}>
            {t('session.keepExploring')}
          </button>
          <button
            className="btn btn-primary grow"
            onClick={() => {
              setDismissed(true)
              dispatch({ type: 'reset' })
            }}
          >
            {t('session.playAgain')}
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', display: 'grid', gap: 10, justifyItems: 'center' }}>
        <IconCheck size={36} style={{ color: 'var(--brand)' }} />
        <h3 style={{ fontSize: 24 }}>{t('session.completeHeadline')}</h3>
        <p className="muted">{t('session.completeBody')}</p>
        <div className="result-time mono">{formatElapsed(elapsed)}</div>
        <span className="panel-title">{t('session.timeTaken')}</span>
      </div>

      <ObjectiveList objectives={session.objectives} />

      <div className="order-summary">
        <div className="row-between">
          <span className="muted">{t('session.totalSpent')}</span>
          <strong className="mono">{money(session.spent)}</strong>
        </div>
        <div className="row-between">
          <span className="muted">{t('session.totalEarned')}</span>
          <strong className="mono">{money(session.earned)}</strong>
        </div>
        <hr className="divider" />
        <div className="row-between">
          <span className="muted">{t('session.finalNetWorth')}</span>
          <strong className="mono">{money(portfolio.netWorth)}</strong>
        </div>
        <div className="row-between">
          <strong>{t('session.netResult')}</strong>
          <strong className={cx('mono', net >= 0 ? 'up' : 'down')} style={{ fontSize: 17 }}>
            {signedMoney(net)}
          </strong>
        </div>
      </div>

      <p className="faint" style={{ fontSize: 12.5 }}>{t('session.scoreNote')}</p>
    </Modal>
  )
}

/** Announces each objective as it clears. */
export function useObjectiveToasts() {
  const { t } = useI18n()
  const { state, notify } = useStore()
  const { session } = state
  const previous = useRef<SessionObjectives | null>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = session.objectives
    if (!before || session.status === 'idle') return

    for (const key of OBJECTIVE_KEYS) {
      if (session.objectives[key] && !before[key]) {
        const remaining = OBJECTIVE_KEYS.filter((k) => !session.objectives[k]).length
        notify({
          tone: 'success',
          title: t('session.objectiveDone'),
          body:
            remaining > 0
              ? `${t(OBJECTIVE_META[key].label)} · ${t('session.remaining', { count: remaining })}`
              : t(OBJECTIVE_META[key].label),
        })
      }
    }
  }, [session.objectives, session.status, notify, t])
}
