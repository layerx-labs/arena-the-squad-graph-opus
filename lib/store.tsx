"use client";

// Loads the precomputed graph bundle once on the client and exposes indexed
// lookups. All query/BFS logic runs in-memory, no backend round-trips.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Club, GraphBundle, Player } from "./types";

interface Store {
  bundle: GraphBundle;
  playerById: Map<string, Player>;
  clubById: Map<string, Club>;
  seasonsByClub: Map<string, string[]>;
}

const Ctx = createContext<Store | null>(null);

let cache: GraphBundle | null = null;

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [bundle, setBundle] = useState<GraphBundle | null>(cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cache) return;
    fetch("/graph.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((b: GraphBundle) => {
        cache = b;
        setBundle(b);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const store = useMemo<Store | null>(() => {
    if (!bundle) return null;
    const playerById = new Map(bundle.players.map((p) => [p.id, p]));
    const clubById = new Map(bundle.clubs.map((c) => [c.id, c]));
    const seasonsByClub = new Map<string, Set<string>>();
    for (const p of bundle.players) {
      for (const s of p.stints) {
        let set = seasonsByClub.get(s.club_id);
        if (!set) {
          set = new Set();
          seasonsByClub.set(s.club_id, set);
        }
        set.add(s.season);
      }
    }
    const seasons = new Map<string, string[]>();
    for (const [k, v] of seasonsByClub)
      seasons.set(k, [...v].sort().reverse());
    return { bundle, playerById, clubById, seasonsByClub: seasons };
  }, [bundle]);

  // Render nothing interactive on the server / before hydration. This keeps the
  // whole client-only tree (which uses router/searchParams hooks) out of SSR.
  if (!mounted)
    return (
      <div className="p-8 text-slate-500 animate-pulse">Loading…</div>
    );

  if (error)
    return (
      <div className="p-8 text-rose-400">Failed to load graph: {error}</div>
    );
  if (!store)
    return (
      <div className="p-8 text-slate-400 animate-pulse">
        Loading the squad graph…
      </div>
    );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within GraphProvider");
  return s;
}
