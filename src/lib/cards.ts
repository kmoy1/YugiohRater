export type CardListItem = {
  id?: number
  name: string
  rating: number
  review?: string
  reviewText?: string
  reviewFile?: string
  pack?: string
  packSlug?: string
}

export type PackFile = {
  pack: string
  cards: CardListItem[]
}

export function normalizePack(p?: string) {
  return p ?? 'Unspecified Pack'
}

export function loadCards(): CardListItem[] {
  const modules = import.meta.glob('../data/**/cards.json', { eager: true }) as Record<string, { default: PackFile }>
  const list: CardListItem[] = []
  for (const [path, mod] of Object.entries(modules)) {
    const pf = mod.default
    const m = path.match(/..\/data\/(.+)\/cards\.json$/)
    const packSlug = m ? m[1] : undefined
    for (const c of pf.cards) list.push({ ...c, pack: c.pack ?? pf.pack, packSlug })
  }
  return list
}
