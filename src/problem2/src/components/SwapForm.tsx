import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Token } from '../types'
import {
  formatAmount,
  formatUsd,
  mockBalance,
  parseAmountInput,
} from '../utils/format'
import { TokenIcon } from './TokenIcon'
import { TokenModal } from './TokenModal'

type SwapFormProps = {
  tokens: Token[]
}

type PickerSide = 'from' | 'to' | null

const SUBMIT_DELAY_MS = 1600

export function SwapForm({ tokens }: SwapFormProps) {
  const tokenMap = useMemo(
    () => new Map(tokens.map((token) => [token.currency, token])),
    [tokens],
  )

  const defaultFrom = tokens.find((t) => t.currency === 'ETH')?.currency ?? tokens[0]?.currency
  const defaultTo =
    tokens.find((t) => t.currency === 'USDC')?.currency ??
    tokens.find((t) => t.currency !== defaultFrom)?.currency

  const [fromCurrency, setFromCurrency] = useState(defaultFrom ?? '')
  const [toCurrency, setToCurrency] = useState(defaultTo ?? '')
  const [amountRaw, setAmountRaw] = useState('')
  const [picker, setPicker] = useState<PickerSide>(null)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [flipKey, setFlipKey] = useState(0)

  const fromToken = tokenMap.get(fromCurrency)
  const toToken = tokenMap.get(toCurrency)
  const balance = fromToken ? mockBalance(fromToken.currency) : 0
  const amount = parseAmountInput(amountRaw)

  const rate =
    fromToken && toToken && fromToken.price > 0
      ? fromToken.price / toToken.price
      : 0

  const receive =
    amount !== null && Number.isFinite(amount) && amount > 0 && rate > 0
      ? amount * rate
      : null

  const error = (() => {
    if (!touched && amountRaw === '') return null
    if (amountRaw === '') return 'Enter an amount to swap.'
    if (amount === null || Number.isNaN(amount)) return 'Amount must be a valid number.'
    if (amount <= 0) return 'Amount must be greater than zero.'
    if (fromCurrency === toCurrency) return 'Choose two different tokens.'
    if (amount > balance) return `Insufficient ${fromCurrency} balance.`
    return null
  })()

  const canSubmit =
    !error &&
    receive !== null &&
    !!fromToken &&
    !!toToken &&
    !submitting

  function handleAmountChange(value: string) {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountRaw(value)
      setSuccess(null)
    }
  }

  function handleFlip() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setAmountRaw(receive !== null ? String(Number(receive.toFixed(8))) : amountRaw)
    setFlipKey((key) => key + 1)
    setSuccess(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit || !fromToken || !toToken || receive === null) return

    setSubmitting(true)
    setSuccess(null)
    await new Promise((resolve) => window.setTimeout(resolve, SUBMIT_DELAY_MS))
    setSubmitting(false)
    setSuccess(
      `Swapped ${formatAmount(amount!)} ${fromCurrency} for ${formatAmount(receive)} ${toCurrency}.`,
    )
    setAmountRaw('')
    setTouched(false)
  }

  return (
    <>
      <form className="swap-form" onSubmit={handleSubmit} noValidate>
        <div className="swap-form__toolbar">
          <div>
            <p className="eyebrow">Instant exchange</p>
            <h1>Swap assets</h1>
          </div>
          <span className="pill">{tokens.length} markets</span>
        </div>

        <motion.div
          key={`from-${flipKey}`}
          className={`field${error && touched ? ' has-error' : ''}`}
          initial={{ opacity: 0.6, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="field__top">
            <label htmlFor="input-amount">You pay</label>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setAmountRaw(String(balance))
                setTouched(true)
                setSuccess(null)
              }}
            >
              Balance {formatAmount(balance)}
            </button>
          </div>
          <div className="field__row">
            <input
              id="input-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.0"
              value={amountRaw}
              onChange={(event) => handleAmountChange(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'amount-error' : undefined}
            />
            <button
              type="button"
              className="token-trigger"
              onClick={() => setPicker('from')}
            >
              {fromToken ? (
                <>
                  <TokenIcon currency={fromToken.currency} />
                  <span>{fromToken.currency}</span>
                </>
              ) : (
                <span>Select</span>
              )}
              <Chevron />
            </button>
          </div>
          {fromToken && amount !== null && Number.isFinite(amount) && amount > 0 && (
            <p className="field__hint">≈ {formatUsd(amount * fromToken.price)}</p>
          )}
        </motion.div>

        <div className="swap-form__flip">
          <button
            type="button"
            className="flip-btn"
            onClick={handleFlip}
            aria-label="Switch tokens"
            disabled={!fromCurrency || !toCurrency}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M6 4v9M6 13l-2.5-2.5M6 13l2.5-2.5M14 16V7M14 7l-2.5 2.5M14 7l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <motion.div
          key={`to-${flipKey}`}
          className="field field--receive"
          initial={{ opacity: 0.6, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="field__top">
            <label htmlFor="output-amount">You receive</label>
            {toToken && <span className="muted">{formatUsd(toToken.price)}</span>}
          </div>
          <div className="field__row">
            <input
              id="output-amount"
              readOnly
              tabIndex={-1}
              placeholder="0.0"
              value={receive !== null ? formatAmount(receive, 8) : ''}
            />
            <button
              type="button"
              className="token-trigger"
              onClick={() => setPicker('to')}
            >
              {toToken ? (
                <>
                  <TokenIcon currency={toToken.currency} />
                  <span>{toToken.currency}</span>
                </>
              ) : (
                <span>Select</span>
              )}
              <Chevron />
            </button>
          </div>
          {toToken && receive !== null && (
            <p className="field__hint">≈ {formatUsd(receive * toToken.price)}</p>
          )}
        </motion.div>

        {fromToken && toToken && fromCurrency !== toCurrency && (
          <div className="rate-bar">
            <span>Rate</span>
            <strong>
              1 {fromCurrency} = {formatAmount(rate, 8)} {toCurrency}
            </strong>
          </div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id="amount-error"
              className="form-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button type="submit" className="submit-btn" disabled={!canSubmit}>
          {submitting ? (
            <span className="submit-btn__loading">
              <span className="spinner" aria-hidden />
              Confirming swap…
            </span>
          ) : (
            'Confirm swap'
          )}
        </button>

        <AnimatePresence>
          {success && (
            <motion.p
              className="form-success"
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {success}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <TokenModal
        open={picker === 'from'}
        title="Pay with"
        tokens={tokens}
        selected={fromCurrency}
        exclude={toCurrency}
        onSelect={setFromCurrency}
        onClose={() => setPicker(null)}
      />
      <TokenModal
        open={picker === 'to'}
        title="Receive"
        tokens={tokens}
        selected={toCurrency}
        exclude={fromCurrency}
        onSelect={setToCurrency}
        onClose={() => setPicker(null)}
      />
    </>
  )
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 4.5L6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
