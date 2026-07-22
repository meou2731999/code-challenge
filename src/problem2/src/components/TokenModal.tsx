import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Token } from '../types'
import { formatUsd } from '../utils/format'
import { TokenIcon } from './TokenIcon'

type TokenModalProps = {
  open: boolean
  title: string
  tokens: Token[]
  selected?: string
  exclude?: string
  onSelect: (currency: string) => void
  onClose: () => void
}

export function TokenModal({
  open,
  title,
  tokens,
  selected,
  exclude,
  onSelect,
  onClose,
}: TokenModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tokens.filter((token) => {
      if (token.currency === exclude) return false
      if (!q) return true
      return token.currency.toLowerCase().includes(q)
    })
  }, [tokens, query, exclude])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <h2 id={titleId}>{title}</h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path
                    d="M4 4l10 10M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <label className="search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search token"
                autoComplete="off"
              />
            </label>

            <ul className="token-list" role="listbox">
              {filtered.length === 0 && (
                <li className="token-list__empty">No tokens match “{query}”.</li>
              )}
              {filtered.map((token) => {
                const isSelected = token.currency === selected
                return (
                  <li key={token.currency}>
                    <button
                      type="button"
                      className={`token-option${isSelected ? ' is-selected' : ''}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelect(token.currency)
                        onClose()
                      }}
                    >
                      <TokenIcon currency={token.currency} size={36} />
                      <span className="token-option__meta">
                        <strong>{token.currency}</strong>
                        <span>{formatUsd(token.price)}</span>
                      </span>
                      {isSelected && <span className="token-option__check">Selected</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
