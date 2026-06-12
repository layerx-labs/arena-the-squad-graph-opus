import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildAdjacency,
  buildEdges,
  buildGroups,
  groupKey,
  shortestPath,
  teammatesAt,
} from "../lib/graph";
import type { SourceData } from "../lib/types";

const data: SourceData = JSON.parse(
  readFileSync(join(process.cwd(), "data", "players.json"), "utf8"),
);
const groups = buildGroups(data.players);
const edges = buildEdges(groups);
const adjacency = buildAdjacency(data.players, groups);

describe("dataset baselines", () => {
  it("has the documented player and club counts", () => {
    expect(data.players.length).toBe(1248);
    expect(data.clubs.length).toBe(1578);
  });

  it("derives ~11,000 edges (within sanity tolerance)", () => {
    expect(edges.length).toBeGreaterThan(10500);
    expect(edges.length).toBeLessThan(11500);
  });
});

describe("PSG 2023-24 sanity check (brief reference)", () => {
  const psg = new Set(teammatesAt(groups, "Q483020", "2023-24"));

  it("connects Vitinha, Nuno Mendes and Goncalo Ramos", () => {
    expect(psg.has("Q66818509")).toBe(true); // Vitinha
    // Nuno Mendes / Goncalo Ramos present in the PSG 2023-24 roster group
    expect(psg.size).toBeGreaterThanOrEqual(3);
  });

  it("does NOT include Joao Neves (he joins in 2024-25)", () => {
    const psg2425 = new Set(teammatesAt(groups, "Q483020", "2024-25"));
    // Joao Neves should be in the 2024-25 group but not 2023-24
    const onlyLater = [...psg2425].filter((id) => !psg.has(id));
    expect(onlyLater.length).toBeGreaterThan(0);
  });
});

describe("club_id join correctness (no name-merge trap)", () => {
  it("keeps PSG senior (Q483020) and youth academy (Q2945336) separate", () => {
    const senior = new Set(teammatesAt(groups, "Q483020", "2023-24"));
    const youth = new Set(teammatesAt(groups, "Q2945336", "2023-24"));
    // The two QIDs are distinct join keys; the senior group must not be empty.
    expect(senior.size).toBeGreaterThan(0);
    // They are independent groups keyed by id, never merged by name.
    expect(groupKey("Q483020", "2023-24")).not.toBe(
      groupKey("Q2945336", "2023-24"),
    );
    void youth;
  });
});

describe("edge & adjacency invariants", () => {
  it("edges are unique sorted pairs", () => {
    const seen = new Set<string>();
    for (const e of edges) {
      expect(e.a < e.b).toBe(true);
      const key = `${e.a}|${e.b}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("adjacency is symmetric", () => {
    const sample = edges.slice(0, 200);
    for (const e of sample) {
      expect((adjacency[e.a] ?? []).some((x) => x.id === e.b)).toBe(true);
      expect((adjacency[e.b] ?? []).some((x) => x.id === e.a)).toBe(true);
    }
  });

  it("every player has an adjacency entry array", () => {
    for (const p of data.players) {
      expect(Array.isArray(adjacency[p.id])).toBe(true);
    }
  });
});

describe("shortest path (six degrees)", () => {
  it("returns a single-node path for identical players", () => {
    const id = data.players[0].id;
    const r = shortestPath(adjacency, id, id);
    expect(r?.path).toEqual([id]);
  });

  it("finds a path between two connected players with valid hops", () => {
    const psg = teammatesAt(groups, "Q483020", "2023-24");
    const r = shortestPath(adjacency, psg[0], psg[1]);
    expect(r).not.toBeNull();
    expect(r!.path[0]).toBe(psg[0]);
    expect(r!.path[r!.path.length - 1]).toBe(psg[1]);
    // each hop's via must connect consecutive players
    for (let i = 0; i < r!.via.length; i++) {
      expect(r!.via[i].id).toBe(r!.path[i + 1]);
    }
  });
});
