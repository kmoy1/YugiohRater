#!/usr/bin/env node
// Fill a pack's cards.json with any missing cards from YGOPRODeck by pack name.
// Usage examples:
//   node scripts/fill-pack.mjs --folder=LegendBEWD --pack-name="Legend of Blue Eyes White Dragon"
//   node scripts/fill-pack.mjs --folder=MetalRaiders --pack-name="Metal Raiders" --default-rating=0 --review-text="TBD"
//   node scripts/fill-pack.mjs --folder=LegendBEWD   (uses pack name from existing cards.json)

import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'src', 'data')

const argv = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.includes('=') ? a.split('=') : [a, 'true']
  return [k.replace(/^--/, ''), v]
}))

const FOLDER = argv.get('folder')
const PACK_NAME = argv.get('pack-name')
if (!FOLDER) {
  console.error('Missing --folder=<PackFolder> (e.g., LegendBEWD)')
  process.exit(1)
}

const DEFAULT_RATING = Number(argv.get('default-rating') ?? 0)
const DEFAULT_REVIEW_TEXT = argv.get('review-text') ?? ''

async function pathExists(p) {
  try { await fs.stat(p); return true } catch { return false }
}

async function loadOrInitPackJson(folder, packNameIfNew) {
  const dir = path.join(DATA_DIR, folder)
  const file = path.join(dir, 'cards.json')
  const exists = await pathExists(file)
  if (!exists) {
    if (!packNameIfNew) throw new Error('cards.json not found; provide --pack-name to initialize')
    await fs.mkdir(dir, { recursive: true })
    const json = { pack: packNameIfNew, cards: [] }
    await fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
    return { file, json }
  }
  const content = await fs.readFile(file, 'utf8')
  const json = JSON.parse(content)
  if (!json?.pack || !Array.isArray(json?.cards)) throw new Error('Invalid pack cards.json: missing pack/cards')
  // If user provided a pack name explicitly, keep file in sync
  if (packNameIfNew && json.pack !== packNameIfNew) {
    json.pack = packNameIfNew
    await fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
  }
  return { file, json }
}

async function fetchCardsInPack(packName) {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(packName)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YGOPRODeck error: HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.data?.length) throw new Error('No cards returned for pack')
  return data.data.map(c => ({ id: c.id, name: c.name }))
}

function upsertMissingCards(currentCards, fetched) {
  const existingNames = new Set(currentCards.map(c => c.name.toLowerCase()))
  const existingIds = new Set(currentCards.filter(c => c.id != null).map(c => Number(c.id)))
  const additions = []
  for (const f of fetched) {
    if (existingIds.has(f.id) || existingNames.has(f.name.toLowerCase())) continue
    additions.push({ id: f.id, name: f.name, rating: DEFAULT_RATING, reviewText: DEFAULT_REVIEW_TEXT })
  }
  // Keep alphabetical by name for consistency
  const merged = currentCards.concat(additions).sort((a, b) => a.name.localeCompare(b.name))
  return { merged, count: additions.length }
}

async function main() {
  const { file, json } = await loadOrInitPackJson(FOLDER, PACK_NAME)
  console.log(`Loaded ${file} (pack: ${json.pack}) with ${json.cards.length} card(s).`)
  const fetched = await fetchCardsInPack(json.pack)
  console.log(`Fetched ${fetched.length} card(s) from YGOPRODeck for this pack.`)
  const { merged, count } = upsertMissingCards(json.cards, fetched)
  if (count === 0) {
    console.log('No missing cards to add. ✅')
    return
  }
  json.cards = merged
  await fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(`Added ${count} missing card(s). Updated file written.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
