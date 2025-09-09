import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CardDetails from './components/CardDetails'
import cardsData from './data/cards.json'

type CardListItem = {
  id?: number
  name: string
  rating: number
  review?: string
  reviewFile?: string
  pack?: string
}

export default function App() {
  const cards = cardsData as CardListItem[]
  const [index, setIndex] = useState(0)
  const [selectedPack, setSelectedPack] = useState<string>('All')
  const [view, setView] = useState<'single' | 'list'>('single')

  const packs = useMemo(() => {
    const set = new Set<string>()
    for (const c of cards) set.add(c.pack ?? 'Unspecified Pack')
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [cards])

  const filtered = useMemo(() => {
    if (selectedPack === 'All') return cards
    return cards.filter((c) => (c.pack ?? 'Unspecified Pack') === selectedPack)
  }, [cards, selectedPack])

  useEffect(() => { setIndex(0) }, [selectedPack])

  const clamp = (i: number) => Math.max(0, Math.min(filtered.length - 1, i))
  const goPrev = useCallback(() => setIndex((i) => clamp(i - 1)), [filtered.length])
  const goNext = useCallback(() => setIndex((i) => clamp(i + 1)), [filtered.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  return (
    <div className="container min-vh-100 d-flex flex-column py-3">
      <header className="text-center mb-3">
        <h1 className="display-6 mb-1">Yu-Gi-Oh! Rater</h1>
        <p className="text-secondary m-0">Your ratings + live card data</p>
      </header>

      <section className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-2">
        <div className="input-group" style={{ maxWidth: 420 }}>
          <span className="input-group-text">Pack</span>
          <select
            className="form-select"
            value={selectedPack}
            onChange={(e) => setSelectedPack(e.target.value)}
          >
            {packs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="btn-group" role="group" aria-label="View toggle">
          <button type="button" className={`btn btn-outline-secondary ${view === 'single' ? 'active' : ''}`} onClick={() => setView('single')}>Single</button>
          <button type="button" className={`btn btn-outline-secondary ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
        </div>
      </section>

      {view === 'single' ? (
        <main className="row justify-content-center g-3 flex-grow-1 align-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-7">
            {filtered.length > 0 ? (
              <CardDetails key={filtered[index].id ?? filtered[index].name} item={filtered[index]} />
            ) : (
              <div className="alert alert-warning">No cards found in this category</div>
            )}
          </div>
        </main>
      ) : (
        <main className="row g-3 flex-grow-1">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <div className="col-12 col-md-6 col-lg-4" key={c.id ?? c.name}>
                <CardDetails item={c} />
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-warning">No cards found in this category</div>
            </div>
          )}
        </main>
      )}

      {view === 'single' && filtered.length > 0 && (
        <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
          <button type="button" className="btn btn-outline-secondary" onClick={goPrev} disabled={index === 0}>
            ← Previous
          </button>
          <span className="text-secondary small">{index + 1} of {filtered.length}</span>
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={index === filtered.length - 1}>
            Next →
          </button>
        </div>
      )}

      <footer className="text-center text-secondary small mt-2">
        Data courtesy of YGOPRODeck API
      </footer>
    </div>
  )
}
