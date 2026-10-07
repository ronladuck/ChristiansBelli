# Menu

**Tell us what you want. We'll narrow it down to three.**

Menu is a mobile-first restaurant recommendation app built around one idea: deciding where to eat
is hard because every other app shows you too much. Instead of a hundred results, Menu gives you
exactly three.

Describe what you're after in plain English — `Italian in Greenwich, casual date night, great pasta
and cocktails, under $50 each.` — and you get back a short, confident shortlist:

| Role | What it is |
| --- | --- |
| ❤️ **Your Pick** | The closest fit for you specifically, weighted by what you've rated before |
| 🏆 **Best Overall** | The strongest objective match on ratings, reviews and popularity |
| 🎲 **Wild Card** | Something slightly unexpected that still fits the request |

Don't like the menu? Press **↻ New Menu** and you're handed three different restaurants for the
same request, like asking the waiter for a different list.

## Running it

Requires Node 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production build
npx tsc --noEmit             # typecheck
```

## How it works

Everything runs client-side against a mock dataset — there is no backend, database or API key.

### Understanding the request

`lib/query.ts` parses free text into structured intent: cuisine, neighborhood, vibe, dietary needs,
meal period, party size and budget. It is a keyword-and-regex parser standing in for the LLM that
would eventually do this job, so it handles the phrasings people actually type:

```
"under $50 each"        → budget.max = 50
"around $20 per person" → budget.target = 20, budget.max = 28
"cheap"                 → budget.max = 22, implied = true
"worth the splurge"     → budget.min = 55, implied = true
"gluten free pizza"     → cuisine: Pizza, dietary: gluten-free
```

The `implied` flag matters for honesty: a stated `under $50` gets quoted back to you as _"comes in
under your $50 ceiling"_, but a vague `cheap` becomes _"comes in at about $22 a head"_ rather than
inventing a number you never said.

### Picking three

`lib/recommend.ts` scores every candidate on three independent axes, which is what keeps the roles
from collapsing into the same answer:

- **relevance** — how well it matches *this* request (cuisine, location, vibe, dish keywords, budget)
- **quality** — objective strength, leaning hard on rating and review volume
- **personal** — relevance blended with taste affinity learned from your ratings

Your Pick takes the highest `personal`, Best Overall the highest `quality`, Wild Card the best
adjacent-cuisine pivot. Because `quality` deliberately ignores most request-specific signal, a
higher-rated restaurant can win Best Overall even when another place matches your words better.

Two guardrails keep results sensible:

- **Cuisine is respected.** If you name a cuisine, Your Pick and Best Overall only ever come from
  that cuisine or an adjacent one. A burger joint will never be served as a "healthy lunch".
- **Filters relax in stages, never silently.** If too few restaurants qualify, Menu widens distance,
  then price, then availability toggles — and says so on the page. Dietary requirements are never
  relaxed.

Repeated **New Menu** presses draw from a seeded PRNG keyed on `query + filters + round`, so each
round is different but reproducible. Returning from a detail page replays the same three places
instead of reshuffling them.

### Explaining itself

Every card says *why* it was chosen. The copy templates are gated on what actually matched:
confident phrasing like _"lines up almost exactly with what you described"_ only fires when a
cuisine or real dish keyword hit. A wild card with nothing in common gets honest framing instead:

> A complete change of direction — Japanese, not Italian. We're including it because it's one of the
> best-reviewed rooms in range.

### Remembering you

Marking **I've Been Here** opens a 😕 / 😐 / 🙂 / 😍 rating that persists to `localStorage` and
feeds your taste profile at `/you`. That profile sharpens Your Pick over time and powers the
*Exclude places I've been* toggle.

## Project layout

```
app/
  page.tsx               Home — rotating question, search box, quick filters
  menu/page.tsx          Your Menu — the three recommendations
  restaurant/[id]/       Detail view — photos, dishes, actions, "Have you been here?"
  you/page.tsx           Taste profile — visit history and learned preferences
  globals.css            Design tokens and custom Tailwind utilities

lib/
  query.ts               Natural-language → structured intent
  recommend.ts           Scoring, filter relaxation, slot assignment, explanation copy
  restaurants.ts         37 mock restaurants
  photos.ts              Generated — see scripts/gen-photos.mjs
  store.tsx              Visit history (localStorage) + search session (sessionStorage)
  filters.ts             Filter options and labels
  format.ts              Display formatting and the search summary line

components/              Screens, cards, sheets and UI primitives
scripts/                 Photo verification and generation tooling
```

## Photography

Restaurant imagery comes from Unsplash, requested at responsive widths through `lib/photos.ts`.

The photo keys are semantic (`pizzaPan`, `curryNaan`, `roomWaterfrontPatio`) and **every one has
been checked against the image it actually resolves to**, so the name describes what is in the
frame. This matters more than it sounds: an unverified set had a key named `sushiColorful` that was
really chocolate-covered strawberries, and `ramenBowls` that was an Indian thali.

`lib/photos.ts` is generated — edit the map in `scripts/gen-photos.mjs` and regenerate:

```bash
cd scripts && node gen-photos.mjs
```

If you rename a key, rename it to match the picture rather than reusing it for something else. The
restaurant data selects photos by meaning.

## Design

Dark forest green (`#113b2b`) on warm cream (`#f6f1e6`), with gold accents and three soft role
palettes for the recommendation cards. Headings are set in Fraunces for an editorial, restaurant-menu
feel; interface text is Inter. Large rounded cards, generous tap targets, bottom sheets on mobile that
become centered dialogs on desktop. The intent is a modern consumer food brand, not a dashboard.

## Current state

This is a front-end prototype. The experience is complete and interactive, but the data behind it is
mock by design:

| Working now | Mocked / deferred |
| --- | --- |
| Full search → menu → detail flow | Real restaurant APIs |
| Natural-language query parsing | LLM-based intent parsing |
| Three-role recommendation engine | Server-side recommendations |
| New Menu with deterministic rounds | User accounts and auth |
| Visit history and taste profile | Database-backed history |
| Responsive phone + desktop layouts | Live hours, menus, reservations |

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · lucide-react
