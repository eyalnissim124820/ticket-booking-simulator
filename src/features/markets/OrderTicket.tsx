import { useEffect, useMemo, useState } from 'react'
import type { Instrument } from '../../data/stocks'
import type { Quote } from '../../data/stocks'
import type { OrderSide, OrderType } from '../../state/types'
import { useStore } from '../../state/store'
import { cx, money, number } from '../../lib/format'

const COMMISSION = 0.99

export function OrderTicket({ instrument, quote }: { instrument: Instrument; quote: Quote }) {
  const { state, dispatch, notify } = useStore()
  const [side, setSide] = useState<OrderSide>('buy')
  const [type, setType] = useState<OrderType>('market')
  const [quantityText, setQuantityText] = useState('10')
  const [limitText, setLimitText] = useState(quote.price.toFixed(2))

  // Keep the limit field anchored to the live price until the user edits it.
  const [limitTouched, setLimitTouched] = useState(false)
  useEffect(() => {
    if (!limitTouched) setLimitText(quote.price.toFixed(2))
  }, [quote.price, limitTouched])

  useEffect(() => {
    setLimitTouched(false)
  }, [instrument.symbol])

  const quantity = Math.max(0, Math.floor(Number(quantityText) || 0))
  const limitPrice = Number(limitText) || 0
  const referencePrice = type === 'market' ? quote.price : limitPrice
  const position = state.positions.find((p) => p.symbol === instrument.symbol)
  const held = position?.quantity ?? 0

  const notional = referencePrice * quantity
  const estimatedTotal = side === 'buy' ? notional + COMMISSION : notional - COMMISSION

  const problem = useMemo(() => {
    if (quantity <= 0) return 'Enter a quantity'
    if (type === 'limit' && limitPrice <= 0) return 'Enter a limit price'
    if (side === 'buy' && type === 'market' && estimatedTotal > state.cash) return 'Not enough cash'
    if (side === 'sell' && quantity > held) return `You only hold ${number(held, 0)} shares`
    return null
  }, [quantity, type, limitPrice, side, estimatedTotal, state.cash, held])

  const maxAffordable = Math.floor((state.cash - COMMISSION) / Math.max(0.01, referencePrice))

  const submit = () => {
    if (problem) {
      notify({ tone: 'error', title: 'Order not sent', body: problem })
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
        title: `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${instrument.symbol}`,
        body: `Filled at ${money(quote.price)} · ${money(notional)}`,
      })
    } else {
      notify({
        tone: 'info',
        title: 'Limit order working',
        body: `${side === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${instrument.symbol} at ${money(limitPrice)} or better`,
      })
    }
  }

  return (
    <div className="card card-pad stack" style={{ gap: 13 }}>
      <div className="row-between">
        <span className="panel-title">Order ticket</span>
        <span className="mono faint" style={{ fontSize: 12 }}>{instrument.symbol}</span>
      </div>

      <div className="side-toggle">
        <button className="buy" aria-pressed={side === 'buy'} onClick={() => setSide('buy')}>Buy</button>
        <button className="sell" aria-pressed={side === 'sell'} onClick={() => setSide('sell')}>Sell</button>
      </div>

      <div className="field">
        <label>Order type</label>
        <select className="select" value={type} onChange={(e) => setType(e.target.value as OrderType)}>
          <option value="market">Market — fill now</option>
          <option value="limit">Limit — fill at my price</option>
        </select>
      </div>

      <div className="field">
        <label>Quantity</label>
        <input
          className="input mono"
          type="number"
          min={0}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
        />
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {side === 'buy'
            ? [0.25, 0.5, 1].map((fraction) => (
                <button
                  key={fraction}
                  className="chip"
                  onClick={() => setQuantityText(String(Math.max(0, Math.floor(maxAffordable * fraction))))}
                >
                  {fraction === 1 ? 'Max' : `${fraction * 100}%`}
                </button>
              ))
            : [0.25, 0.5, 1].map((fraction) => (
                <button
                  key={fraction}
                  className="chip"
                  disabled={held === 0}
                  onClick={() => setQuantityText(String(Math.floor(held * fraction)))}
                >
                  {fraction === 1 ? 'All' : `${fraction * 100}%`}
                </button>
              ))}
        </div>
      </div>

      {type === 'limit' && (
        <div className="field">
          <label>Limit price</label>
          <input
            className="input mono"
            type="number"
            min={0}
            step={0.01}
            value={limitText}
            onChange={(e) => {
              setLimitTouched(true)
              setLimitText(e.target.value)
            }}
          />
          <span className="faint" style={{ fontSize: 11.5 }}>
            Fills automatically when the price {side === 'buy' ? 'falls to' : 'rises to'}{' '}
            {money(limitPrice)}.
          </span>
        </div>
      )}

      <div className="order-summary">
        <div className="row-between">
          <span className="muted">{type === 'market' ? 'Market price' : 'Limit price'}</span>
          <span className="mono">{money(referencePrice)}</span>
        </div>
        <div className="row-between">
          <span className="muted">Estimated {side === 'buy' ? 'cost' : 'proceeds'}</span>
          <span className="mono">{money(notional)}</span>
        </div>
        <div className="row-between">
          <span className="muted">Commission</span>
          <span className="mono">{money(COMMISSION)}</span>
        </div>
        <hr className="divider" />
        <div className="row-between">
          <strong>{side === 'buy' ? 'Total debit' : 'Net credit'}</strong>
          <strong className="mono">{money(Math.abs(estimatedTotal))}</strong>
        </div>
        <div className="row-between faint" style={{ fontSize: 12 }}>
          <span>{side === 'buy' ? 'Buying power' : 'Shares held'}</span>
          <span className="mono">{side === 'buy' ? money(state.cash) : number(held, 0)}</span>
        </div>
      </div>

      <button
        className={cx('btn', 'btn-lg', 'btn-block', !problem && 'btn-primary')}
        onClick={submit}
        disabled={!!problem}
        style={
          !problem && side === 'sell'
            ? { background: 'var(--down)', borderColor: 'var(--down)', color: '#2b0808' }
            : undefined
        }
      >
        {problem ?? `${side === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${instrument.symbol}`}
      </button>
      <p className="faint" style={{ fontSize: 11.5, textAlign: 'center' }}>
        Simulated market. No real orders are routed anywhere.
      </p>
    </div>
  )
}
