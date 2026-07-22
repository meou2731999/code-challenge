export function formatAmount(value: number, maxFractionDigits = 6): string {
  if (!Number.isFinite(value)) return '0'
  if (value === 0) return '0'

  const abs = Math.abs(value)
  const digits =
    abs >= 1000 ? 2 : abs >= 1 ? Math.min(4, maxFractionDigits) : maxFractionDigits

  return value.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1 ? 2 : 4,
  })
}

export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim()
  if (cleaned === '') return null
  if (!/^\d*\.?\d*$/.test(cleaned)) return NaN
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : NaN
}

/** Simulated wallet balances for validation demos. */
export function mockBalance(currency: string): number {
  const seed = [...currency].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return Number((((seed % 97) + 12) * 1.37).toFixed(4))
}
