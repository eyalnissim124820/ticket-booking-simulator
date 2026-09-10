import { useEffect, useMemo, useState } from 'react'
import type { Instrument, Quote } from '../../data/stocks'
import type { OrderSide, OrderType } from '../../state/types'
import { useStore } from '../../state/store'
import { Select } from '../../components/ui'
import { cx } from '../../lib/format'
import { useI18n } from '../../i18n'
import type { MessageKey } from '../../i18n/en'

const COMMISSION = 0.99

export function OrderTicket({ instrument, quote }: { instrument: Instrument; quote: Quote }) {
  const { t, money, number, toDisplay, fromDisplay } = useI18n()
  const { state, dispatch, notify } = useStore()
  const [side, setSide] = useState<OrderSide>('buy')
  const [type, setType] = useState<OrderType>('market')
  const [quantityText, setQuantityText] = useState('10')
  // The limit field is edited in the display currency and converted back.
  const [limitText, setLimitText] = useState(() => toDisplay(quote.price).toFixed(2))
  const [limitTouched, setLimitTouched] = useState(false)

  useEffect(() => {
    if (!limitTouched) setLimitText(toDisplay(quote.price).toFixed(2))
  }, [quote.price, limitTouched, toDisplay])

  useEffect(() => setLimitTouched(false), [instrument.symbol])

  const quantity = Math.max(0, Math.floor(Number(quantityText) || 0))
  const limitPrice = fromDisplay(Number(limitText) || 0)
  const referencePrice = type === 'market' ? quote.price : limitPrice
  const held = state.positions.find((p) => p.symbol === instrument.symbol)?.quantity ?? 0

  const notional = referencePrice * quantity
  const estimatedTotal = side === 'buy' ? notional + COMMISSION : notional - COMMISSION

  const problem = useMemo(() => {
    if (quantity <= 0) return t('markets.enterQuantity')
    if (type === 'limit' && limitPrice <= 0) return t('markets.enterLimit')
    if (side === 'buy' && type === 'market' && estimatedTotal > state.cash) return t('markets.notEnoughCash')
    if (side === 'sell' && quantity > held) return t('markets.onlyHold', { count: number(held, 0) })
    return null
  }, [quantity, type, limitPrice, side, estimatedTotal, state.cash, held, t, number])

  const maxAffordable = Math.floor((state.cash - COMMISSION) / Math.max(0.01, referencePrice))
  const sideLabel = t(`side.${side}` as MessageKey)

  const submit = () => {
    if (problem) {
      notify({ tone: 'error', title: t('markets.orderNotSent'), body: problem })
      return
    }
    dispatch({
      type: 'place-order',
      order: {
        symbol: instrument.symbol,
        side,
        type,
        quantity,
        limitPrice: type === 'limit' ? limitPrice : null,
      },
      marketPrice: quote.price,
    })
    if (type === 'market') {
      notify({
        tone: 'success',
        title: t(side === 'buy' ? 'markets.boughtToast' : 'markets.soldToast', {
          count: quantity,
          symbol: instrument.symbol,
        }),
        body: t('markets.filledAt', { price: money(quote.price), total: money(notional) }),
      })
    } else {
      notify({
        tone: 'info',
        title: t('markets.limitWorking'),
        body: t('markets.limitWorkingBody', {
          side: sideLabel,
          count: quantity,
          symbol: instrument.symbol,
          price: money(limitPrice),
        }),
      })
    }
  }

  return (
    <div className="card card-pad stack" style={{ gap: 14 }}>
      <div className="row-between">
        <span className="panel-title">{t('markets.orderTicket')}</span>
        <span className="mono faint" style={{ fontSize: 12.5 }}>{instrument.symbol}</span>
      </div>

      <div className="side-toggle">
        <button className="buy" aria-pressed={side === 'buy'} onClick={() => setSide('buy')}>{t('markets.buy')}</button>
        <button className="sell" aria-pressed={side === 'sell'} onClick={() => setSide('sell')}>{t('markets.sell')}</button>
      </div>

      <div className="field">
        <label>{t('markets.orderType')}</label>
        <Select value={type} onChange={(v) => setType(v as OrderType)} ariaLabel={t('markets.orderType')}>
          <option value="market">{t('markets.marketOrder')}</option>
          <option value="limit">{t('markets.limitOrder')}</option>
        </Select>
      </div>

      <div className="field">
        <label>{t('markets.quantity')}</label>
        <input
          className="input mono"
          type="number"
          dir="ltr"
          min={0}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
          aria-label={t('markets.quantity')}
        />
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {[0.25, 0.5, 1].map((fraction) => (
            <button
              key={fraction}
              className="chip"
              disabled={side === 'sell' && held === 0}
              onClick={() =>
                setQuantityText(
                  String(Math.max(0, Math.floor((side === 'buy' ? maxAffordable : held) * fraction))),
                )
              }
            >
              {fraction === 1 ? (side === 'buy' ? t('markets.max') : t('markets.all_')) : `${fraction * 100}%`}
            </button>
          ))}
        </div>
      </div>

      {type === 'limit' && (
        <div className="field">
          <label>{t('markets.limitPrice')}</label>
          <input
            className="input mono"
            type="number"
            dir="ltr"
            min={0}
            step={0.01}
            value={limitText}
            onChange={(e) => {
              setLimitTouched(true)
              setLimitText(e.target.value)
            }}
            aria-label={t('markets.limitPrice')}
          />
          <span className="faint" style={{ fontSize: 11.5 }}>
            {t(side === 'buy' ? 'markets.limitHintBuy' : 'markets.limitHintSell', {
              amount: money(limitPrice),
            })}
          </span>
        </div>
      )}

      <div className="order-summary">
        <div className="row-between">
          <span className="muted">{type === 'market' ? t('markets.marketPrice') : t('markets.limitPrice')}</span>
          <span className="mono">{money(referencePrice)}</span>
        </div>
        <div className="row-between">
          <span className="muted">{side === 'buy' ? t('markets.estimatedCost') : t('markets.estimatedProceeds')}</span>
          <span className="mono">{money(notional)}</span>
        </div>
        <div className="row-between">
          <span className="muted">{t('markets.commission')}</span>
          <span className="mono">{money(COMMISSION)}</span>
        </div>
        <hr className="divider" />
        <div className="row-between">
          <strong>{side === 'buy' ? t('markets.totalDebit') : t('markets.netCredit')}</strong>
          <strong className="mono">{money(Math.abs(estimatedTotal))}</strong>
        </div>
        <div className="row-between faint" style={{ fontSize: 12.5 }}>
          <span>{side === 'buy' ? t('markets.buyingPower') : t('markets.sharesHeld')}</span>
          <span className="mono">{side === 'buy' ? money(state.cash) : number(held, 0)}</span>
        </div>
      </div>

      <button
        className={cx('btn', 'btn-lg', 'btn-block', !problem && (side === 'buy' ? 'btn-primary' : 'btn-sell'))}
        onClick={submit}
        disabled={!!problem}
      >
        {problem ??
          t(side === 'buy' ? 'markets.buySymbol' : 'markets.sellSymbol', {
            count: quantity,
            symbol: instrument.symbol,
          })}
      </button>
      <p className="faint" style={{ fontSize: 11.5, textAlign: 'center' }}>{t('markets.simulatedNote')}</p>
    </div>
  )
}
