# The Squad Graph — Six Degrees of the 2026 World Cup

An interactive social graph of **FIFA World Cup 2026** players, connected by the
clubs they shared — season by season. Look up any club's roster, trace the
shortest "played together" chain between any two players (even across rival
nations), explore the network visually, and see which clubs were the biggest
feeder rosters of the tournament.

- **Live demo:** https://arena-the-squad-graph-opus.vercel.app
- **Dataset:** [LayerX Labs WC2026 Squad Graph dataset](https://github.com/layerx-labs/wc2026-squad-graph-dataset), pinned to the immutable **v1.0** commit and committed byte-for-byte into [`/data`](./data).

---

## What it does

| Page | What you get |
| --- | --- |
| **Home** (`/`) | Headline stats, a live **sanity-check badge** (counts vs. documented baselines), and player search. |
| **Roster Query** (`/query`) | *The core deliverable.* Pick a **club + season** → get every WC2026 player who was there together. |
| **Six Degrees** (`/path`) | BFS shortest path between any two players, rendered as a chain of `(player → shared club, season → player)` hops. |
| **Player** (`/player?id=…`) | A player's full per-season club history and teammates grouped by shared roster. |
| **Interactive Graph** (`/graph`) | Force-directed map (canvas). View by nation or by a player's neighborhood; hover edges for the shared club + season; click a node to open the player. |
| **Leaderboard** (`/clubs`) | Clubs & seasons ranked by how many WC2026 players were teammates there, filterable by club country. |
| **About / Data** (`/about`) | Provenance, the exact edge rule, the name-join trap we avoid, and an honest read of `gaps.json`. |

## How the graph is built

The single source of truth is [`lib/graph.ts`](./lib/graph.ts), which implements
the brief's edge rule **verbatim**:

> Two players share an edge **iff they have a stint with the same `club_id` AND
> the same season.**

Concretely:

1. **Group** every player by `(club_id, season)`.
2. Everyone in a group of **≥ 2** is mutually connected → that group contributes
   `N·(N−1)/2` edges.
3. **Adjacency** is the per-player teammate list (who / which club / which season).
4. **BFS** over the adjacency map yields shortest "six-degrees" paths.

Two correctness rules that matter:

- **Join on `club_id` only, never the club name.** Distinct clubs share names and
  a single club has many spellings. PSG's senior side (`Q483020`) is a *different
  QID* from its youth academy (`Q2945336`); merging by name would invent false
  edges. We key exclusively on the Wikidata QID.
- **Season overlap semantics** are preserved: a player is listed for any season
  they touched a club, so a winter-window transfer correctly connects them to
  both clubs' rosters that season. Stints are already deduped in the source data.

A build-time script, [`scripts/build-graph.ts`](./scripts/build-graph.ts), reads
the pinned dataset, derives groups → edges → adjacency → leaderboard, **asserts
the documented baselines** (1,248 players / 1,578 clubs / ~11,000 edges) and the
**PSG 2023-24 sanity check**, then emits a compact self-contained
`public/graph.json`. The build fails loudly if any invariant breaks.

The app loads `graph.json` **once on the client** and runs every query, lookup
and pathfind in memory — no backend, no database.

## Verify it yourself

The reference example from the brief: PSG in 2023-24 connects Vitinha, Nuno
Mendes and Gonçalo Ramos (João Neves only joins in 2024-25).

- In the app: open **Roster Query** → click *"Try the reference example"*.
- In tests: `npm test` runs the [Vitest suite](./tests/graph.test.ts), which
  asserts the PSG sanity check, the ~11,000-edge baseline, edge/adjacency
  invariants, the `club_id` join (no name merge), and the BFS path correctness.

```
$ npm test
✓ tests/graph.test.ts (10 tests)
```

## Tech stack

- **Next.js 14 (App Router) + TypeScript** — typed, structured, statically
  exported (`output: "export"`) so the whole app is a CDN-served bundle.
- **Build-time Node/TS derivation** — keeps runtime pure-client and the deploy
  self-contained (the brief's recommended approach).
- **react-force-graph-2d** — canvas rendering that handles the network smoothly.
- **Tailwind CSS** — fast, consistent dark UI.
- **Vitest** — unit tests that prove graph correctness.

## Run locally

```bash
npm install
npm run build:graph   # derive public/graph.json from /data (with sanity checks)
npm run dev           # http://localhost:3000
# or a full static build:
npm run build         # emits ./out
npm test              # graph correctness tests
```

> Note: the production build sets `NODE_ENV=production` explicitly (via
> `cross-env`) so React's prod runtime is used during static export.

## Architecture

```
data/                         pinned v1.0 players.json + gaps.json (judged bytes)
lib/graph.ts                  pure edge-rule logic (groups, edges, adjacency, BFS)
lib/types.ts                  shared TypeScript types
scripts/build-graph.ts        derive + validate + emit public/graph.json
public/graph.json             compact bundle (players, clubs, adjacency, groups, leaderboard)
app/                          Next.js pages (all client-side after load)
components/                   PlayerSearch, ClubSearch
tests/graph.test.ts           Vitest correctness suite
```

## Trade-offs & notes

- **Static-only by design.** Precomputing the graph at build time means zero
  runtime infra and instant correctness — the cost is a ~3.7 MB `graph.json`
  fetched once and cached.
- **Graph view is scoped.** Rendering all ~11,000 edges at once is illegible, so
  the explorer scopes to a nation or a player's neighborhood for clarity and
  performance. Headline counts always reflect the full graph.
- **Coverage is surfaced, not hidden.** `/about` reads `gaps.json` and shows the
  known limits (players without club history, dropped dateless memberships, etc.)
  so coverage gaps aren't mistaken for bugs.

## Credits

Dataset © LayerX Labs ([wc2026-squad-graph-dataset](https://github.com/layerx-labs/wc2026-squad-graph-dataset)),
derived from Wikidata, Wikipedia career infoboxes, and the 2026 FIFA World Cup
squad lists. Built for the **AI Agent Hackathon — The Squad Graph**.
