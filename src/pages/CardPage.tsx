import React, { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import CardDetails from '../components/CardDetails'
import { CardListItem, loadCards, normalizePack } from '../lib/cards'

export default function CardPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const allCards = useMemo(() => loadCards(), [])
  const packParam = params.get('pack') || undefined
  const pool: CardListItem[] = useMemo(() => {
    if (!packParam) return allCards
    return allCards.filter((c) => normalizePack(c.pack) === packParam)
  }, [allCards, packParam])
  const packs = useMemo(() => {
    const set = new Set<string>()
    for (const c of allCards) set.add(normalizePack(c.pack))
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [allCards])

  const index = useMemo(() => {
    const numId = Number(id)
    return pool.findIndex((c) => c.id === numId)
  }, [pool, id])

  const prevNext = {
    prev: index > 0 ? pool[index - 1] : undefined,
    next: index >= 0 && index < pool.length - 1 ? pool[index + 1] : undefined,
  }

  useEffect(() => {
    if (index === -1 && pool.length) {
      // Unknown id for this pool; redirect to first card in pool
      const first = pool[0]
      if (first?.id) navigate(`/card/${first.id}` + (packParam ? `?pack=${encodeURIComponent(packParam)}` : ''), { replace: true })
    }
  }, [index, pool, navigate, packParam])

  const goTo = useCallback((target?: CardListItem) => {
    if (!target?.id) return
    navigate(`/card/${target.id}` + (packParam ? `?pack=${encodeURIComponent(packParam)}` : ''))
  }, [navigate, packParam])

  const changePack = useCallback((newPack: string) => {
    const current = index >= 0 ? pool[index] : undefined
    if (newPack === 'All') {
      if (current?.id && allCards.some((c) => c.id === current.id)) {
        navigate(`/card/${current.id}`)
      } else if (allCards[0]?.id) {
        navigate(`/card/${allCards[0].id}`)
      }
      return
    }
    const inPack = allCards.filter((c) => normalizePack(c.pack) === newPack)
    if (!inPack.length) return
    if (current?.id && inPack.some((c) => c.id === current.id)) {
      navigate(`/card/${current.id}?pack=${encodeURIComponent(newPack)}`)
    } else {
      navigate(`/card/${inPack[0].id}?pack=${encodeURIComponent(newPack)}`)
    }
  }, [allCards, index, pool, navigate])

  if (index === -1 || !pool.length) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">Card not found.</div>
        <Link className="btn btn-secondary" to="/">Back</Link>
      </div>
    )
  }

  const card = pool[index]

  return (
    <div className="container min-vh-100 d-flex flex-column py-3">
      <header className="text-center mb-3">
        <h1 className="display-6 mb-1">Yu-Gi-Oh! Rater</h1>
        <p className="text-secondary m-0">Your ratings + live card data</p>
      </header>

      <section className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-2">
        <div className="input-group" style={{ maxWidth: 420 }}>
          <span className="input-group-text">Pack</span>
          <select className="form-select" value={packParam ?? 'All'} onChange={(e) => changePack(e.target.value)}>
            {packs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="btn-group" role="group" aria-label="View toggle">
          <Link className="btn btn-outline-secondary" to="/">Collections</Link>
          <button type="button" className="btn btn-outline-secondary active" disabled>Single</button>
        </div>
      </section>

      <main className="row justify-content-center g-3 flex-grow-1 align-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7">
          <CardDetails key={card.id ?? card.name} item={card} />
        </div>
      </main>

      <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
        <button type="button" className="btn btn-outline-secondary" onClick={() => goTo(prevNext.prev)} disabled={!prevNext.prev}>← Previous</button>
        <span className="text-secondary small">{index + 1} of {pool.length}</span>
        <button type="button" className="btn btn-primary" onClick={() => goTo(prevNext.next)} disabled={!prevNext.next}>Next →</button>
      </div>
    </div>
  )
}
