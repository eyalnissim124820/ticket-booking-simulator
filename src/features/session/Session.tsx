import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MISSION_KEYS, isMissionDone, type MissionKey, type MissionResult } from '../../state/types'
import { STARTING_CASH, usePortfolio, useStore } from '../../state/store'
import { BrandMark, lockPageScroll, Modal } from '../../components/ui'
import {
  IconArrowUp,
  IconBed,
  IconChart,
  IconCheck,
  IconClock,
  IconDrawer,
  IconPlane,
  IconRestart,
  IconTarget,
} from '../../components/icons'
import { airportCity, getAirport } from '../../data/airports'
import { cx, nightsBetween } from '../../lib/format'
import { useI18n } from '../../i18n'
import type { MessageKey } from '../../i18n/en'

const MISSION_META: Record<MissionKey, { label: MessageKey; Icon: typeof IconPlane }> = {
  drawer: { label: 'session.objDrawer', Icon: IconDrawer },
  flight: { label: 'session.objFlight', Icon: IconPlane },
  stay: { label: 'session.objStay', Icon: IconBed },
  buy: { label: 'session.objBuy', Icon: IconChart },
  sell: { label: 'session.objSell', Icon: IconArrowUp },
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

/** A clock that ticks while `live` and stops the moment it isn't. */
function useTicker(live: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [live])
  return now
}

/** Elapsed run time: ticks while running, frozen once the run completes. */
export function useElapsed(): number {
  const { state } = useStore()
  const { session } = state
  const now = useTicker(session.status === 'running')
  if (!session.startedAt) return 0
  const end = session.status === 'complete' && session.completedAt ? session.completedAt : now
  return end - session.startedAt
}

/** Elapsed time on the mission currently being worked on. */
function useMissionElapsed(): number {
  const { state } = useStore()
  const { session } = state
  const live = session.status === 'running' && !session.handoff
  const now = useTicker(live)
  if (!session.missionStartedAt) return 0
  return Math.max(0, now - session.missionStartedAt)
}

/** The ordered mission checklist: what is done, what is live, what is left. */
function MissionList({ activeIndex }: { activeIndex: number | null }) {
  const { t } = useI18n()
  const { state } = useStore()
  const { session } = state

  return (
    <ol className="mission-list">
      {MISSION_KEYS.map((key, i) => {
        const { label, Icon } = MISSION_META[key]
        const done = session.status !== 'idle' && isMissionDone(session, key)
        const active = activeIndex === i && !done
        return (
          <li key={key} className={cx('mission', done && 'done', active && 'active')}>
            <span className="mission-mark">
              {done ? <IconCheck size={14} /> : <span className="mono">{i + 1}</span>}
            </span>
            <Icon size={16} className="mission-glyph" />
            <span className="grow">{t(label)}</span>
            {active && <span className="mission-flag">{t('session.upNext')}</span>}
          </li>
        )
      })}
    </ol>
  )
}

/** The run's trip brief, resolved for display. Only the two travel missions
 *  have one — the drawer and the trades are not part of the trip. */
function useBrief(mission: MissionKey) {
  const { t, locale, formatDate, arrow, plural } = useI18n()
  const { state } = useStore()
  const brief = state.session.brief

  if (!brief || (mission !== 'flight' && mission !== 'stay')) return null

  const from = airportCity(getAirport(brief.from), locale)
  const to = airportCity(getAirport(brief.to), locale)
  const dates = `${formatDate(brief.departIso, 'short')} ${arrow} ${formatDate(brief.returnIso, 'short')}`
  const nights = plural.nights(nightsBetween(brief.departIso, brief.returnIso))
  const people =
    mission === 'flight' ? plural.travellers(brief.travellers) : plural.guests(brief.travellers)

  const rows =
    mission === 'flight'
      ? [
          { label: t('brief.route'), value: `${from} ${arrow} ${to}` },
          { label: t('brief.dates'), value: dates },
          { label: t('brief.travellers'), value: people },
        ]
      : [
          { label: t('brief.city'), value: to },
          { label: t('brief.dates'), value: `${dates} · ${nights}` },
          { label: t('brief.guests'), value: people },
        ]

  const line =
    mission === 'flight'
      ? `${from} ${arrow} ${to} · ${dates} · ${people}`
      : `${to} · ${dates} · ${nights} · ${people}`

  return { rows, line }
}

/** The brief as a block, read before the mission's clock starts. */
function BriefCard({ mission }: { mission: MissionKey }) {
  const { t } = useI18n()
  const brief = useBrief(mission)
  if (!brief) return null

  return (
    <div className="brief-card">
      <span className="panel-title">
        <IconTarget size={12} /> {t('brief.title')}
      </span>
      {brief.rows.map(({ label, value }) => (
        <div key={label} className="row-between">
          <span className="muted">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

/** The same brief as a strip under the header, in view for as long as the
 *  mission it belongs to is the one being worked. */
export function MissionBrief() {
  const { t } = useI18n()
  const { state } = useStore()
  const { session } = state
  const mission = MISSION_KEYS[session.index]
  const brief = useBrief(mission)

  if (session.status !== 'running' || session.handoff || !brief) return null

  return (
    <div className="brief-bar">
      <span className="brief-bar-task">
        <IconTarget size={14} />
        <strong>{t(MISSION_META[mission].label)}</strong>
      </span>
      <span className="brief-bar-line">{brief.line}</span>
    </div>
  )
}

/** Leaves the run and puts the player back on the start screen. Always asks
 *  first: a reset throws away the clock, the bookings, the trades and the
 *  budget, and there is no undo. Rendered in the header during a run, and
 *  again on the full-screen gates, which paint over the header. */
export function ResetRun({ onGate = false }: { onGate?: boolean }) {
  const { t } = useI18n()
  const { state, dispatch, notify } = useStore()
  const [confirming, setConfirming] = useState(false)
  const { session } = state
  const elapsed = useElapsed()

  // Nothing to reset before a run starts — the start screen is already up.
  if (session.status === 'idle') return null

  return (
    <>
      <button className={cx('reset-run', onGate && 'on-gate')} onClick={() => setConfirming(true)}>
        <IconRestart size={15} />
        {t('session.reset')}
      </button>

      <Modal
        open={confirming}
        raised
        size="narrow"
        title={t('session.resetTitle')}
        onClose={() => setConfirming(false)}
        footer={
          <>
            <button className="btn grow" onClick={() => setConfirming(false)}>
              {t('session.resetKeep')}
            </button>
            <button
              className="btn btn-danger grow"
              onClick={() => {
                setConfirming(false)
                dispatch({ type: 'reset' })
                notify({
                  tone: 'info',
                  title: t('session.resetDone'),
                  body: t('session.resetDoneBody'),
                })
              }}
            >
              {t('session.resetConfirm')}
            </button>
          </>
        }
      >
        <p className="muted">{t('session.resetBody')}</p>
        {session.status === 'running' && (
          <p className="faint" style={{ fontSize: 12.5 }}>
            {t('session.resetProgress', {
              n: session.index + 1,
              total: MISSION_KEYS.length,
              time: formatElapsed(elapsed),
            })}
          </p>
        )}
      </Modal>
    </>
  )
}

/** Non-dismissible gate shown before a run begins. */
export function StartGate({ languageToggle }: { languageToggle: ReactNode }) {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const idle = state.session.status === 'idle'

  useEffect(() => {
    if (!idle) return
    return lockPageScroll()
  }, [idle])

  if (!idle) return null

  return createPortal(
    <div className="gate" role="dialog" aria-modal="true">
      <div className="gate-panel">
        <div className="gate-lang">{languageToggle}</div>
        <BrandMark size={36} />
        <h1 className="gate-title">{t('session.gateTitle')}</h1>

        <MissionList activeIndex={null} />

        <button
          className="btn btn-primary btn-lg"
          style={{ minWidth: 250 }}
          onClick={() => dispatch({ type: 'start-session' })}
        >
          {t('session.start')}
        </button>
        <p className="faint" style={{ fontSize: 13 }}>{t('session.gateSub')}</p>
      </div>
    </div>,
    document.body,
  )
}

/** Mission one happens off-screen. The app does nothing here but keep time. */
export function DrawerMission() {
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const { session } = state
  const elapsed = useMissionElapsed()
  const open =
    session.status === 'running' && !session.handoff && MISSION_KEYS[session.index] === 'drawer'

  useEffect(() => {
    if (!open) return
    return lockPageScroll()
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="gate" role="dialog" aria-modal="true">
      <div className="gate-panel">
        <ResetRun onGate />
        <span className="panel-title">
          {t('session.missionOf', { n: 1, total: MISSION_KEYS.length })}
        </span>
        <div className="mission-icon"><IconDrawer size={26} /></div>
        <h1 className="gate-title">{t('session.drawerTitle')}</h1>
        <p className="muted" style={{ maxWidth: 420 }}>{t('session.drawerBody')}</p>

        <div className="big-clock" role="timer" aria-live="off">
          <span className="panel-title">
            <IconClock size={13} /> {t('session.drawerTiming')}
          </span>
          <span className="big-clock-time mono">{formatElapsed(elapsed)}</span>
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ minWidth: 250 }}
          onClick={() => dispatch({ type: 'finish-mission' })}
        >
          <IconCheck size={18} />
          {t('session.drawerDone')}
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** Shown the moment a mission clears, so completion is unmistakable and the
 *  next mission only starts when the player says go. */
export function MissionHandoff() {
  const { t, money, signedMoney } = useI18n()
  const { state, dispatch } = useStore()
  const { session } = state
  const open = session.status === 'running' && session.handoff
  const result: MissionResult | undefined = session.results.at(-1)

  useEffect(() => {
    if (!open) return
    return lockPageScroll()
  }, [open])

  if (!open || !result) return null

  const nextKey = MISSION_KEYS[Math.min(session.index + 1, MISSION_KEYS.length - 1)]
  const net = result.earned - result.spent

  return createPortal(
    <div className="gate" role="dialog" aria-modal="true">
      <div className="gate-panel">
        <ResetRun onGate />
        <div className="mission-icon done"><IconCheck size={28} /></div>
        <span className="panel-title">{t('session.missionComplete')}</span>
        <h1 className="gate-title">{t(MISSION_META[result.key].label)}</h1>

        <div className="big-clock">
          <span className="panel-title">{t('session.missionTime')}</span>
          <span className="big-clock-time mono">{formatElapsed(result.durationMs)}</span>
        </div>

        <div className="budget-card">
          {net === 0 ? (
            <div className="row-between">
              <span className="muted">{t('session.budget')}</span>
              <span className="faint">{t('session.noMoneyMoved')}</span>
            </div>
          ) : (
            <div className="row-between">
              <span className="muted">
                {result.spent > 0 ? t('session.spentOnMission') : t('session.earnedOnMission')}
              </span>
              <strong className={cx('mono', net >= 0 ? 'up' : 'down')} style={{ fontSize: 17 }}>
                {signedMoney(net)}
              </strong>
            </div>
          )}
          <hr className="divider" />
          <div className="row-between">
            <strong>{t('session.budgetLeft')}</strong>
            <strong className="mono" style={{ fontSize: 17 }}>{money(result.cashAfter)}</strong>
          </div>
        </div>

        <BriefCard mission={nextKey} />

        <button
          className="btn btn-primary btn-lg"
          style={{ minWidth: 280 }}
          onClick={() => dispatch({ type: 'next-mission' })}
        >
          {t('session.nextMission')} · {t(MISSION_META[nextKey].label)}
        </button>

        <MissionList activeIndex={session.index + 1} />
      </div>
    </div>,
    document.body,
  )
}

/** The run status, shown as a notch hanging from the top edge of the screen. */
export function SessionNotch() {
  const { t } = useI18n()
  const { state } = useStore()
  const { session } = state
  const elapsed = useElapsed()

  if (session.status === 'idle') return null
  const done = session.results.length
  const complete = session.status === 'complete'
  const activeLabel = complete ? null : t(MISSION_META[MISSION_KEYS[session.index]].label)

  return (
    <div
      className={cx('notch', complete && 'complete')}
      role="status"
      aria-label={`${t('session.elapsedLabel')} ${formatElapsed(elapsed)} · ${t('session.progressLabel')} ${done}/${MISSION_KEYS.length}`}
    >
      {/* stands in for the camera on a real notch — it lights up when the run closes */}
      <span className="notch-lens" aria-hidden="true" />
      <span className="notch-metric" title={t('session.elapsedLabel')}>
        <IconClock size={12} />
        <span className="mono">{formatElapsed(elapsed)}</span>
      </span>
      <span className="notch-sep" aria-hidden="true" />
      <span className="notch-metric" title={t('session.progressLabel')}>
        {complete ? <IconCheck size={12} /> : <IconTarget size={12} />}
        <span className="mono">{done}/{MISSION_KEYS.length}</span>
      </span>
      {activeLabel && <span className="notch-task">{activeLabel}</span>}
    </div>
  )
}

/** Result card shown once every mission clears: what was done, and how long
 *  each one took. */
export function RunSummary() {
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
      <div style={{ textAlign: 'center', display: 'grid', gap: 8, justifyItems: 'center' }}>
        <div className="mission-icon done"><IconCheck size={26} /></div>
        <h3 style={{ fontSize: 22 }}>{t('session.completeHeadline')}</h3>
        <div className="result-time mono">{formatElapsed(elapsed)}</div>
        <span className="panel-title">{t('session.timeTaken')}</span>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <span className="panel-title">{t('session.missionBreakdown')}</span>
        <ol className="mission-list">
          {session.results.map((result, i) => {
            const { label, Icon } = MISSION_META[result.key]
            const missionNet = result.earned - result.spent
            return (
              <li key={result.key} className="mission done">
                <span className="mission-mark"><span className="mono">{i + 1}</span></span>
                <Icon size={16} className="mission-glyph" />
                <span className="grow">{t(label)}</span>
                {missionNet !== 0 && (
                  <span className={cx('mono mission-money', missionNet >= 0 ? 'up' : 'down')}>
                    {signedMoney(missionNet)}
                  </span>
                )}
                <span className="mono mission-duration">{formatElapsed(result.durationMs)}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="order-summary">
        <div className="row-between">
          <span className="muted">{t('session.startingBudget')}</span>
          <span className="mono">{money(STARTING_CASH)}</span>
        </div>
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
