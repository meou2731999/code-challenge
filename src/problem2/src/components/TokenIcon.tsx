import { useState } from 'react'
import { tokenIconUrl } from '../api/prices'

type TokenIconProps = {
  currency: string
  size?: number
}

export function TokenIcon({ currency, size = 28 }: TokenIconProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className="token-icon token-icon--fallback"
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        aria-hidden
      >
        {currency.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      className="token-icon"
      src={tokenIconUrl(currency)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
