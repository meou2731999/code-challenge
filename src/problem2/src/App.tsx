import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchTokens } from './api/prices'
import type { Token } from './types'
import { SwapForm } from './components/SwapForm'
import './App.css'

export default function App() {
  const [tokens, setTokens] = useState<Token[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchTokens()
      .then((data) => {
        if (!cancelled) setTokens(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load prices.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="page__atmosphere" aria-hidden>
        <span className="orb orb--a" />
        <span className="orb orb--b" />
        <span className="grid-lines" />
      </div>

      <header className="brand">
        <motion.div
          className="brand__mark"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" rx="9" fill="#13212E" />
            <path
              d="M8 18c4-8 12-8 16 0"
              stroke="#E85D4C"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M10 22c3-5 9-5 12 0"
              stroke="#7EB8B0"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Cascade</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          Move value between tokens with live market rates.
        </motion.p>
      </header>

      <main>
        {error && <div className="state-panel state-panel--error">{error}</div>}
        {!error && !tokens && (
          <div className="state-panel" aria-busy="true">
            <span className="spinner" />
            Loading markets…
          </div>
        )}
        {tokens && tokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SwapForm tokens={tokens} />
          </motion.div>
        )}
      </main>

      <footer className="page__footer">
        Prices from Switcheo · Icons from Switcheo/token-icons
      </footer>
    </div>
  )
}
