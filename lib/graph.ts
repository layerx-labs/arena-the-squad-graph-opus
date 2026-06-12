// Pure, framework-free graph derivation. This is the single source of truth for
// the brief's edge rule:
//   "two players share an edge iff they have a stint with the same club_id
//    AND the same season"
// We JOIN ON club_id ONLY (never the club name) to avoid the PSG senior
// (Q483020) vs. youth-academy (Q2945336) trap that would invent false edges.

import type {
  AdjacencyEntry,
  Edge,
  Group,
  Player,
  SourceData,
} from "./types";

export const groupKey = (clubId: string, season: string) => `${clubId}|${season}`;

/**
 * Group players by (club_id, season). Every player in a group of >= 2 is
 * mutually connected. Stints are already deduped in the dataset.
 */
export function buildGroups(players: Player[]): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();
  for (const p of players) {
    for (const s of p.stints) {
      const key = groupKey(s.club_id, s.season);
      let set = groups.get(key);
      if (!set) {
        set = new Set<string>();
        groups.set(key, set);
      }
      set.add(p.id);
    }
  }
  return groups;
}

/** All unique, sorted edges derived from groups of >= 2. */
export function buildEdges(groups: Map<string, Set<string>>): Edge[] {
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const [key, members] of groups) {
    if (members.size < 2) continue;
    const [club_id, season] = key.split("|");
    const ids = [...members].sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const pairKey = `${a}|${b}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        edges.push({ a, b, club_id, season });
      }
    }
  }
  return edges;
}

/**
 * Adjacency: for each player, every teammate link (who, where, when).
 * The same teammate can appear multiple times if they shared >1 (club,season).
 */
export function buildAdjacency(
  players: Player[],
  groups: Map<string, Set<string>>,
): Record<string, AdjacencyEntry[]> {
  const adj: Record<string, AdjacencyEntry[]> = {};
  for (const p of players) adj[p.id] = [];
  for (const [key, members] of groups) {
    if (members.size < 2) continue;
    const [club_id, season] = key.split("|");
    const ids = [...members];
    for (const id of ids) {
      const list = adj[id] ?? (adj[id] = []);
      for (const other of ids) {
        if (other === id) continue;
        list.push({ id: other, club_id, season });
      }
    }
  }
  return adj;
}

/** Leaderboard of the largest shared rosters (strongest club connections). */
export function buildLeaderboard(
  groups: Map<string, Set<string>>,
  limit = 200,
): Group[] {
  const list: Group[] = [];
  for (const [key, members] of groups) {
    if (members.size < 2) continue;
    const [club_id, season] = key.split("|");
    list.push({ club_id, season, player_ids: [...members].sort() });
  }
  list.sort(
    (x, y) =>
      y.player_ids.length - x.player_ids.length ||
      x.club_id.localeCompare(y.club_id) ||
      x.season.localeCompare(y.season),
  );
  return list.slice(0, limit);
}

/** Core query: players who were at a club in a given season. */
export function teammatesAt(
  groups: Map<string, Set<string>>,
  clubId: string,
  season: string,
): string[] {
  return [...(groups.get(groupKey(clubId, season)) ?? [])];
}

/**
 * BFS shortest path of "played together" hops between two players.
 * Returns an ordered list of player ids, or null if disconnected.
 * `via` returns the (club, season) used for each hop.
 */
export function shortestPath(
  adjacency: Record<string, AdjacencyEntry[]>,
  from: string,
  to: string,
): { path: string[]; via: AdjacencyEntry[] } | null {
  if (from === to) return { path: [from], via: [] };
  const prev = new Map<string, { node: string; via: AdjacencyEntry }>();
  const visited = new Set<string>([from]);
  const queue: string[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of adjacency[cur] ?? []) {
      if (visited.has(e.id)) continue;
      visited.add(e.id);
      prev.set(e.id, { node: cur, via: e });
      if (e.id === to) {
        const path: string[] = [to];
        const via: AdjacencyEntry[] = [];
        let step = to;
        while (step !== from) {
          const p = prev.get(step)!;
          via.unshift(p.via);
          path.unshift(p.node);
          step = p.node;
        }
        return { path, via };
      }
      queue.push(e.id);
    }
  }
  return null;
}

export function deriveStats(data: SourceData) {
  const groups = buildGroups(data.players);
  const edges = buildEdges(groups);
  return {
    players: data.players.length,
    clubs: data.clubs.length,
    groups: [...groups.values()].filter((g) => g.size >= 2).length,
    edges: edges.length,
  };
}
