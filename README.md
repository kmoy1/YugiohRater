Yu-Gi-Oh! Rater
================

A minimal React app that displays Yu-Gi-Oh! cards with your pre-written rating and review, while fetching live card details (image, effect, stats, etc.) from the YGOPRODeck API. Built with modern React + TypeScript and styled with Bootstrap 5 for consistent typography and layout.

Features
--------
- Store only `id`, `name`, `rating`, `review` locally in `src/data/cards.json`.
- Packs are now organized as folders under `src/data/**/cards.json`, and the UI auto-loads them.
 - Multi-line reviews via external text files per card (no escaping needed).
- Fetch card metadata and images on the client from YGOPRODeck.
- Clean, responsive layout with loading and error states.
 - Bootstrap 5 grid and card components.

Getting Started
---------------
Prerequisites: Node.js 18+ recommended.

1) Install dependencies:
   npm install

2) Run the dev server:
   npm run dev

3) Build for production:
   npm run build

4) Preview the production build:
   npm run preview

Editing Your Card List
----------------------
Data Structure
--------------
Create one folder per collection under `src/data/` with a `cards.json` file:

src/data/LegendBEWD/cards.json
src/data/MetalRaiders/cards.json
src/data/StarterDeckYugi/cards.json

Each `cards.json` looks like:

{
  "pack": "Legend of Blue Eyes White Dragon",
  "cards": [
    { "id": 89631139, "name": "Blue-Eyes White Dragon", "rating": 10, "reviewFile": "89631139.txt" },
    { "id": 83764718, "name": "Monster Reborn", "rating": 8, "reviewFile": "83764718.txt" }
  ]
}

The `pack` value is applied to each card in that folder automatically.

Card Fields
-----------

{
  "id": 89631139,
  "name": "Blue-Eyes White Dragon",
  "rating": 9,
"reviewFile": "89631139.txt"
}

- `id`: Recommended (YGOPRODeck passcode). If omitted, the app falls back to `name`.
- `name`: Used for display and as a fetch fallback if `id` is missing.
- `rating`: Number from 0–10.
- `review`: Your short review text.
 - `pack`: Not needed in individual card entries; it’s taken from the folder’s `cards.json` header.
 - `review` (optional): Short inline review string (JSON-escaped if multi-line).
 - `reviewFile` (optional, recommended): Name of a `.txt` file in `public/reviews/` containing your review. Newlines are preserved.

Writing Multi-line Reviews
--------------------------
1) Create a `.txt` file in `public/reviews/`, e.g. `public/reviews/89631139.txt`.
2) Put your multi-line review in that file. No JSON escaping needed.
3) In `src/data/cards.json`, set `"reviewFile": "89631139.txt"` for that card. If both `review` and `reviewFile` exist, the text file takes precedence.

Packs & Views
 ------------------
- Use the Pack dropdown to filter cards by pack, or select "All".
- Toggle between "Single" (one-at-a-time with Previous/Next and arrow keys) and "List" (shows all cards in the selected category).
 - Use the Collections view to see all packs (from folders) with counts; click a pack to drill into Single view for that pack.

How It Works
------------
- The UI reads your list from `src/data/cards.json`.
- For each entry, it fetches from `https://db.ygoprodeck.com/api/v7/cardinfo.php` using `id` (preferred) or `name`.
- The first matching print is displayed, including image, type, race, attribute, level/atk/def (if applicable), and description.

Notes
-----
- API requests run in the browser at runtime; ensure your environment allows outbound HTTPS.
- Some cards have many prints; this app uses the first result returned by the API.
- For Spell/Trap cards, level/atk/def may be absent and are shown as “—”.
- Built with TypeScript; components live in `.tsx` files.
- Styling uses Bootstrap 5; tweak `src/styles.css` or apply utility classes as needed.
