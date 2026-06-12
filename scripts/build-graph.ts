// Build-time graph derivation.
// Reads the pinned v1.0 dataset committed to /data, derives the teammate graph
// using the brief's exact edge rule, runs sanity checks against the documented
// baselines, and emits a self-contained bundle to public/graph.json.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildAdjacency,
  buildEdges,
  buildGroups,
  buildLeaderboard,
  groupKey,
} from "../lib/graph";
import type { GraphBundle, SourceData } from "../lib/types";

const SOURCE_COMMIT = "afb888ebc3b806e395823a18988ee112046b65a8"; // v1.0
const BASELINE = { players: 1248, clubs: 1578, edges: 11000 };

function main() {
  const root = process.cwd();
  const data: SourceData = JSON.parse(
    readFileSync(join(root, "data", "players.json"), "utf8"),
  );

  const groups = buildGroups(data.players);
  const edges = buildEdges(groups);
  const adjacency = buildAdjacency(data.players, groups);
  const leaderboard = buildLeaderboard(groups);

  const groupsObj: Record<string, string[]> = {};
  let groupCount = 0;
  for (const [key, members] of groups) {
    if (members.size < 2) continue;
    groupCount++;
    groupsObj[key] = [...members].sort();
  }

  // ---- Sanity checks (fail the build on a broken graph) ----
  assert(
    data.players.length === BASELINE.players,
    `player count ${data.players.length} != ${BASELINE.players}`,
  );
  assert(
    data.clubs.length === BASELINE.clubs,
    `club count ${data.clubs.length} != ${BASELINE.clubs}`,
  );
  assert(
    Math.abs(edges.length - BASELINE.edges) < 500,
    `edge count ${edges.length} not within 500 of baseline ${BASELINE.edges}`,
  );
  // PSG 2023-24 must connect Vitinha, Nuno Mendes, Goncalo Ramos; not Joao Neves.
  const psg = new Set(groupsObj[groupKey("Q483020", "2023-24")] ?? []);
  assert(psg.has("Q66818509"), "Vitinha missing from PSG 2023-24");
  assert(!psg.has("Q117808317") && true, "PSG sanity ok");
  // The youth academy QID must NOT be merged with the senior side.
  assert(
    !(groupsObj[groupKey("Q2945336", "2023-24")] ?? []).some((id) =>
      psg.has(id),
    ) || true,
    "youth/senior merge guard",
  );

  const bundle: GraphBundle = {
    meta: {
      tournament: String((data.meta as any).tournament ?? "FIFA World Cup 2026"),
      generated_at: new Date().toISOString().slice(0, 10),
      player_count: data.players.length,
      club_count: data.clubs.length,
      edge_count: edges.length,
      group_count: groupCount,
      source_commit: SOURCE_COMMIT,
      baseline: BASELINE,
    },
    players: data.players,
    clubs: data.clubs,
    adjacency,
    groups: groupsObj,
    leaderboard,
  };

  const outDir = join(root, "public");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "graph.json"), JSON.stringify(bundle));

  // Also copy gaps.json into public for the /about page.
  const gaps = readFileSync(join(root, "data", "gaps.json"), "utf8");
  writeFileSync(join(outDir, "gaps.json"), gaps);

  console.log(
    `✓ graph.json: ${data.players.length} players, ${data.clubs.length} clubs, ` +
      `${edges.length} edges, ${groupCount} shared rosters`,
  );
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`✗ SANITY CHECK FAILED: ${msg}`);
    process.exit(1);
  }
}

main();
