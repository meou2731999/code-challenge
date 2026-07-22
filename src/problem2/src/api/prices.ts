import type { Token, TokenPrice } from '../types'

const PRICES_URL = 'https://interview.switcheo.com/prices.json'

/** Keep the latest priced entry per currency; drop tokens without a price. */
export function normalizeTokens(rows: TokenPrice[]): Token[] {
  const latest = new Map<string, Token>()

  for (const row of rows) {
    if (typeof row.price !== 'number' || Number.isNaN(row.price)) continue

    const existing = latest.get(row.currency)
    if (!existing || new Date(row.date) > new Date(existing.date)) {
      latest.set(row.currency, {
        currency: row.currency,
        price: row.price,
        date: row.date,
      })
    }
  }

  return [...latest.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency),
  )
}

export async function fetchTokens(): Promise<Token[]> {
  const response = await fetch(PRICES_URL)
  if (!response.ok) {
    throw new Error('Unable to load market prices. Please try again.')
  }
  const data = (await response.json()) as TokenPrice[]
  return normalizeTokens(data)
}

export function tokenIconUrl(currency: string): string {
  return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`
}
