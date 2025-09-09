#!/usr/bin/env node
// Update missing or placeholder Yu-Gi-Oh! card IDs (passcodes) by name.
// Scans src/data/**/cards.json and writes IDs back into those files.

import { promises as fs } from 'fs'
import path from 'path'
import process from 'process'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'src', 'data')

// Config via CLI
const argv = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.includes('=') ? a.split('=') : [a, 'true']
  return [k.replace(/^--/, ''), v]
}))

const DRY_RUN = argv.get('dry-run') === 'true' || argv.has('dry')
const FORCE_ALL = argv.has('all') // update every card regardless of current id
const MIN_DIGITS = Number(argv.get('min-digits') ?? 6) // ids shorter than this are treated as placeholders
const ONLY_PACK = argv.get('pack') // optional folder name to limit updates

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (e.isFile()) yield p
  }
}

function needsIdUpdate(card) {
  if (FORCE_ALL) return true
  const id = card?.id
  if (id === undefined || id === null) return true
  const asNum = Number(id)
  if (!Number.isFinite(asNum) || asNum <= 0) return true
  const digits = String(Math.trunc(Math.abs(asNum))).length
  return digits < MIN_DIGITS
}

async function fetchIdByName(name) {
  const base = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
  // Try exact name first
  let url = `${base}?name=${encodeURIComponent(name)}`
  let res = await fetch(url)
  if (res.ok) {
    const json = await res.json()
    const id = json?.data?.[0]?.id
    if (id) return id
  }
  // Fallback to fuzzy name
  url = `${base}?fname=${encodeURIComponent(name)}`
  res = await fetch(url)
  if (res.ok) {
    const json = await res.json()
    const id = json?.data?.[0]?.id
    if (id) return id
  }
  throw new Error(`No ID found for name: ${name}`)
}

async function updateFile(file) {
  const rel = path.relative(ROOT, file)
  const content = await fs.readFile(file, 'utf8')
  let packJson
  try { packJson = JSON.parse(content) } catch (e) { throw new Error(`Invalid JSON in ${rel}`) }
  if (!packJson || !Array.isArray(packJson.cards)) throw new Error(`Missing cards[] in ${rel}`)

  let changed = 0
  for (const card of packJson.cards) {
    if (!card?.name) continue
    if (!needsIdUpdate(card)) continue
    try {
      const id = await fetchIdByName(card.name)
      card.id = id
      changed++
      console.log(`[ok] ${card.name} -> ${id} (${rel})`)
      // Gentle pacing to be polite to the API
      await sleep(150)
    } catch (e) {
      console.warn(`[skip] ${card.name}: ${e.message}`)
    }
  }

  if (changed > 0 && !DRY_RUN) {
    // Preserve pretty formatting
    await fs.writeFile(file, JSON.stringify(packJson, null, 2) + '\n', 'utf8')
  }
  return { rel, changed }
}

async function main() {
  console.log(`Scanning ${DATA_DIR} ${ONLY_PACK ? `(pack=${ONLY_PACK})` : ''}`)
  const files = []
  for await (const f of walk(DATA_DIR)) {
    if (path.basename(f) === 'cards.json') {
      if (ONLY_PACK) {
        const segs = path.relative(DATA_DIR, f).split(path.sep)
        if (segs[0] !== ONLY_PACK) continue
      }
      files.push(f)
    }
  }
  if (!files.length) {
    console.log('No cards.json files found.')
    return
  }
  let total = 0
  for (const file of files) {
    try {
      const { rel, changed } = await updateFile(file)
      total += changed
      if (changed > 0) console.log(`Updated ${changed} card(s) in ${rel}`)
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message)
    }
  }
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'} ${total} card(s) across ${files.length} file(s).`)
  console.log('Options: --dry-run --all --min-digits=6 --pack=FolderName')
}

main().catch((e) => { console.error(e); process.exit(1) })

