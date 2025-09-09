import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import CardDetails from './components/CardDetails'
import CardPage from './pages/CardPage'
import { CardListItem, loadCards, normalizePack } from './lib/cards'

function HomeView() {
  const cards = useMemo(() => loadCards(), [])
  const [index, setIndex] = useState(0)
  const [selectedPack, setSelectedPack] = useState<string>('All')
  const [view, setView] = useState<'collections' | 'single'>('collections')
  const navigate = useNavigate()

  const packs = useMemo(() => {
    const set = new Set<string>()
    for (const c of cards) set.add(normalizePack(c.pack))
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [cards])

  const packCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of cards) {
      const key = normalizePack(c.pack)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [cards])

  const filtered = useMemo(() => {
    if (selectedPack === 'All') return cards
    return cards.filter((c) => normalizePack(c.pack) === selectedPack)
  }, [cards, selectedPack])

  useEffect(() => { setIndex(0) }, [selectedPack])

  const clamp = (i: number) => Math.max(0, Math.min(filtered.length - 1, i))
  const goPrev = useCallback(() => setIndex((i) => clamp(i - 1)), [filtered.length])
  const goNext = useCallback(() => setIndex((i) => clamp(i + 1)), [filtered.length])

  const openCard = useCallback((card?: CardListItem) => {
    if (!card?.id) return
    const query = selectedPack !== 'All' ? `?pack=${encodeURIComponent(selectedPack)}` : ''
    navigate(`/card/${card.id}${query}`)
  }, [navigate, selectedPack])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (view === 'single' && index > 0) openCard(filtered[index - 1])
        else goPrev()
      }
      if (e.key === 'ArrowRight') {
        if (view === 'single' && index < filtered.length - 1) openCard(filtered[index + 1])
        else goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, filtered, index, view, openCard])

  return (
    <div className="container min-vh-100 d-flex flex-column py-3">
      <header className="text-center mb-3">
        <h1 className="display-6 mb-1">Yu-Gi-Oh! Rater</h1>
        <p className="text-secondary m-0">Your ratings + live card data</p>
      </header>

      <section className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-2">
        {view !== 'collections' && (
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
        )}
        <div className="btn-group" role="group" aria-label="View toggle">
          <button type="button" className={`btn btn-outline-secondary ${view === 'collections' ? 'active' : ''}`} onClick={() => setView('collections')}>Collections</button>
          <button type="button" className={`btn btn-outline-secondary ${view === 'single' ? 'active' : ''}`} onClick={() => setView('single')}>Single</button>
        </div>
      </section>

      {view === 'collections' ? (
        <main className="row g-3 flex-grow-1 align-content-start">
          {Array.from(packCounts.keys()).sort((a, b) => a.localeCompare(b)).map((pack) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={pack}>
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h2 className="h6 mb-1 text-break">{pack}</h2>
                  <div className="text-secondary small mb-3">{packCounts.get(pack)} card(s)</div>
                  <button type="button" className="btn btn-primary mt-auto" onClick={() => { setSelectedPack(pack); setIndex(0); setView('single') }}>View</button>
                </div>
              </div>
            </div>
          ))}
        </main>
      ) : view === 'single' ? (
        <main className="row justify-content-center g-3 flex-grow-1 align-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-7">
            {filtered.length > 0 ? (
              <>
                <CardDetails key={filtered[index].id ?? filtered[index].name} item={filtered[index]} />
                {filtered[index].id && (
                  <div className="d-flex justify-content-end mt-2">
                    <Link className="btn btn-sm btn-outline-primary" to={`/card/${filtered[index].id}${selectedPack !== 'All' ? `?pack=${encodeURIComponent(selectedPack)}` : ''}`}>Open Link</Link>
                  </div>
                )}
              </>
            ) : (
              <div className="alert alert-warning">No cards found in this category</div>
            )}
          </div>
        </main>
      ) : null}

      {view === 'single' && filtered.length > 0 && (
        <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => openCard(filtered[index - 1])} disabled={index === 0}>
            ← Previous
          </button>
          <span className="text-secondary small">{index + 1} of {filtered.length}</span>
          <button type="button" className="btn btn-primary" onClick={() => openCard(filtered[index + 1])} disabled={index === filtered.length - 1}>
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/card/:id" element={<CardPage />} />
    </Routes>
  )
}
