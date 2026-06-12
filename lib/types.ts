// Shared types for the Squad Graph.

/** A club as published in the source dataset. */
export interface Club {
  id: string; // Wikidata QID — the canonical join key
  name: string;
  country: string;
}

/** One (club, season) membership for a player. */
export interface Stint {
  club_id: string;
  season: string; // YYYY-YY
}

/** A player as published in the source dataset. */
export interface Player {
  id: string; // Wikidata QID
  name: string;
  country: string; // WC2026 national team
  position: string; // GK | DF | MF | FW (may be combined)
  current_club_id: string;
  stints: Stint[];
}

export interface SourceData {
  meta: Record<string, unknown>;
  clubs: Club[];
  players: Player[];
}

/** A teammate link from one player's perspective. */
export interface AdjacencyEntry {
  id: string; // other player id
  club_id: string;
  season: string;
}

/** A roster group: everyone who shared a (club, season). */
export interface Group {
  club_id: string;
  season: string;
  player_ids: string[];
}

/** A graph edge (undirected, deduped, sorted pair). */
export interface Edge {
  a: string;
  b: string;
  club_id: string;
  season: string;
}

/** The compiled, self-contained graph bundle served to the client. */
export interface GraphBundle {
  meta: {
    tournament: string;
    generated_at: string;
    player_count: number;
    club_count: number;
    edge_count: number;
    group_count: number;
    source_commit: string;
    baseline: { players: number; clubs: number; edges: number };
  };
  players: Player[];
  clubs: Club[];
  /** playerId -> teammate links */
  adjacency: Record<string, AdjacencyEntry[]>;
  /** "club_id|season" -> player ids (the core join index) */
  groups: Record<string, string[]>;
  /** strongest connections leaderboard (largest shared rosters first) */
  leaderboard: Group[];
}
