#!/usr/bin/env node
// Quick script to get a Yu-Gi-Oh! card passcode (ID) by name.
// Usage: node scripts/get-passcode.js "Tri-Horned Dragon"

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function printUsageAndExit() {
  console.error('Usage: node scripts/get-passcode.js "<Card Name>" [--fuzzy] [--local]')
  process.exit(1)
}

const args = process.argv.slice(2)
if (args.length === 0) printUsageAndExit()

const nameParts = []
let fuzzy = false
let localOnly = false
for (const a of args) {
  if (a === '--fuzzy') { fuzzy = true; continue }
  if (a === '--local') { localOnly = true; continue }
  nameParts.push(a)
}
const query = nameParts.join(' ').trim()
if (!query) printUsageAndExit()

async function fetchFromAPI(name) {
  const base = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
  const url = new URL(base)
  if (fuzzy) url.searchParams.set('fname', name)
  else url.searchParams.set('name', name)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = json?.data
    if (!Array.isArray(data) || data.length === 0) return null
    const exact = data.find((c) => (c?.name || '').toLowerCase() === name.toLowerCase())
    const picked = exact || data[0]
    const id = picked?.id
    return Number.isFinite(id) ? id : null
  } catch (_) {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function readLocalCards() {
  const dataRoot = path.resolve(__dirname, '../src/data')
  const results = []
  if (!fs.existsSync(dataRoot)) return results

  for (const entry of fs.readdirSync(dataRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const cardsFile = path.join(dataRoot, entry.name, 'cards.json')
    if (!fs.existsSync(cardsFile)) continue
    try {
      const text = fs.readFileSync(cardsFile, 'utf-8')
      const json = JSON.parse(text)
      const cards = Array.isArray(json?.cards) ? json.cards : []
      for (const c of cards) results.push({ id: c?.id, name: c?.name, pack: json?.pack || c?.pack })
    } catch (_) {
      // skip
    }
  }
  return results
}

function searchLocal(name) {
  const all = readLocalCards()
  if (all.length === 0) return null

  const lc = name.toLowerCase()
  const exact = all.find((c) => (c?.name || '').toLowerCase() === lc)
  if (exact && Number.isFinite(exact.id)) return exact.id

  if (fuzzy) {
    const partial = all.find((c) => (c?.name || '').toLowerCase().includes(lc))
    if (partial && Number.isFinite(partial.id)) return partial.id
  }
  return null
}

;(async () => {
  // Try remote API first unless --local provided
  let id = null
  if (!localOnly) id = await fetchFromAPI(query)
  if (id === null) id = searchLocal(query)
  if (id === null) {
    console.error(`Card not found: ${query}`)
    process.exit(2)
  }
  // Print only the passcode/ID for easy piping
  console.log(String(id))
})()

