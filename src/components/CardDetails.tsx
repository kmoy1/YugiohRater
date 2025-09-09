import React, { useEffect, useMemo, useState } from 'react'
import type { CardListItem } from '../lib/cards'

function formatStat(value: number | undefined | null) {
  return value === undefined || value === null ? '—' : value
}

type YgoCard = {
  name: string
  type: string
  race: string
  attribute?: string
  level?: number
  linkval?: number
  atk?: number
  def?: number
  archetype?: string
  desc: string
  card_images?: { image_url: string }[]
}

export default function CardDetails({ item }: { item: CardListItem }) {
  const { id, name, rating, reviewText: inlineReview, review, reviewFile } = item
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [card, setCard] = useState<YgoCard | null>(null)
  const [reviewText, setReviewText] = useState<string>(inlineReview ?? review ?? '')

  const url = useMemo(() => {
    if (id) return `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`
    if (name) return `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`
    return null
  }, [id, name])

  useEffect(() => {
    if (!url) return

    const controller = new AbortController()
    const { signal } = controller
    setLoading(true)
    setError(null)

    fetch(url, { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { data?: YgoCard[] }
        if (!json?.data?.length) throw new Error('Card not found')
        return json.data[0] as YgoCard
      })
      .then((data) => setCard(data))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [url])

  // Keep review text in sync with incoming props
  useEffect(() => {
    if (inlineReview) {
      setReviewText(inlineReview)
      return
    }
    if (review && !reviewFile) {
      setReviewText(review)
      return
    }
    // Clear before possibly fetching a file to avoid showing stale text
    setReviewText('')
  }, [inlineReview, review, reviewFile, id])

  // Load external review text file if provided and no inline review exists
  useEffect(() => {
    let active = true
    if (inlineReview || review) return
    if (!reviewFile) return
    const prefix = item.packSlug ? `/reviews/${item.packSlug}/` : '/reviews/'
    fetch(`${prefix}${reviewFile}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Review HTTP ${res.status}`)
        return res.text()
      })
      .then((txt) => { if (active) setReviewText(txt) })
      .catch(() => { /* keep fallback review text */ })
    return () => { active = false }
  }, [inlineReview, review, reviewFile, item.packSlug])

  return (
    <article className="card shadow-sm h-100 ygo-card">
      {loading && (
        <div className="card-body text-secondary">Loading {name || id}…</div>
      )}
      {error && (
        <div className="card-body text-danger">
          Failed to load {name || id}: {error.message}
        </div>
      )}
      {!loading && !error && card && (
        <div className="card-body overflow-hidden">
          <div className="row g-3">
            <div className="col-auto">
              <img
                className="img-fluid rounded ygo-card-img"
                src={card.card_images?.[0]?.image_url}
                alt={card.name}
                loading="lazy"
              />
            </div>
            <div className="col">
              <h2 className="h5 mb-2 text-break">{card.name}</h2>
              <div className="row row-cols-1 row-cols-sm-2 gy-1 small text-secondary">
                {(() => {
                  const t = (card.type || '').toLowerCase()
                  const isMonster = t.includes('monster')
                  const isSpell = t.includes('spell')
                  const isTrap = t.includes('trap')
                  const cardType = isMonster ? 'Monster' : isSpell ? 'Spell' : isTrap ? 'Trap' : card.type
                  return (
                    <>
                      <div className="text-break"><span className="fw-semibold text-body">Card Type:</span> {cardType}</div>
                      {isMonster ? (
                        <div className="text-break"><span className="fw-semibold text-body">Monster Type:</span> {card.race}</div>
                      ) : (
                        <div className="text-break"><span className="fw-semibold text-body">Subtype:</span> {card.race}</div>
                      )}
                    </>
                  )
                })()}

                {card.attribute && (
                  <div className="text-break"><span className="fw-semibold text-body">Attribute:</span> {card.attribute}</div>
                )}
                {card.level !== undefined && (
                  <div className="text-break"><span className="fw-semibold text-body">Level/Rank/Link:</span> {formatStat(card.level ?? card.linkval)}</div>
                )}
                {(card.atk !== undefined || card.def !== undefined) && (
                  <div className="text-break"><span className="fw-semibold text-body">ATK/DEF:</span> {formatStat(card.atk)} / {formatStat(card.def)}</div>
                )}
                {card.archetype && (
                  <div className="text-break"><span className="fw-semibold text-body">Archetype:</span> {card.archetype}</div>
                )}
                {item.pack && (
                  <div className="text-break"><span className="fw-semibold text-body">Pack:</span> {item.pack}</div>
                )}
              </div>

              <p className="mt-2 mb-2 text-break desc-clamp">{card.desc}</p>

              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="fw-bold">{rating}/10</span>
                  <div className="progress flex-grow-1" role="progressbar" aria-label="Rating" aria-valuenow={rating} aria-valuemin="0" aria-valuemax="10" style={{ height: 8 }}>
                    <div className="progress-bar" style={{ width: `${Math.min(10, Math.max(0, rating)) * 10}%` }} />
                  </div>
                </div>
                <p className="mb-0 text-body" style={{ whiteSpace: 'pre-line' }}>{reviewText}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
