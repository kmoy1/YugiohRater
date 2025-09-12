Yu-Gi-Oh! Rater
================

A React app that displays Yu-Gi-Oh! cards with each card rated and reviewed, while fetching live card details (image, effect, stats, etc.) from the YGOPRODeck API. Built with React + TypeScript and styled with Bootstrap 5.

Getting Started
---------------
Prerequisites: Node.js 18+ recommended.

1) Install dependencies:
   `npm install`

2) Run the dev server:
   `npm run dev`

3) Build for production:
   `npm run build`

4) Preview the production build:
   `npm run preview`

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
 - `reviewText` (optional): Inline review for short notes. If present, it overrides `reviewFile` and is shown directly.

Writing Multi-line Reviews
--------------------------
Place reviews under a subfolder per collection in `public/reviews/<CollectionFolder>/` to match your data folders.

Example (Legend of Blue Eyes White Dragon):
- Data: `src/data/LegendBEWD/cards.json` (pack = "Legend of Blue Eyes White Dragon")
- Review file: `public/reviews/LegendBEWD/89631139.txt`
- Card entry uses just the filename:

{
  "id": 89631139,
  "name": "Blue-Eyes White Dragon",
  "rating": 10,
  "reviewFile": "89631139.txt"
}

Notes:
- The review loader auto-resolves to `/reviews/<packFolder>/<reviewFile>` using the folder name under `src/data/`.
- Precedence: `reviewText` (if present) > `reviewFile` (if present) > `review` (legacy field).

Packs & Views
 ------------------
- Use the Pack dropdown to filter cards by pack, or select "All".
- Toggle between "Collections" and "Single" (one-at-a-time with Previous/Next and arrow keys).
 - Collections lists every pack with a count; click a pack to drill into Single view for that pack.

Deep Links
----------
- Navigate directly to `/card/:id` (e.g., `/card/89631139`).
- Add `?pack=<Pack Name>` to constrain Previous/Next to that pack (e.g., `/card/89631139?pack=Legend%20of%20Blue%20Eyes%20White%20Dragon`).
 - Next/Previous on the card page update the URL.

Data Utilities
--------------
- Fill a pack with missing cards from YGOPRODeck and write them to `src/data/<Folder>/cards.json`:
  - `npm run fill:pack -- --folder=LegendBEWD --pack-name="Legend of Blue Eyes White Dragon"`
  - `npm run fill:pack -- --folder=MetalRaiders --pack-name="Metal Raiders" --default-rating=0 --review-text="TBD"`
  - If `cards.json` already exists, you can omit `--pack-name` and it will use the `pack` in the file.
- Update missing or placeholder IDs by card name across all packs:
  - `npm run update:ids` (options: `--dry-run`, `--all`, `--min-digits=6`, `--pack=<Folder>`)

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
