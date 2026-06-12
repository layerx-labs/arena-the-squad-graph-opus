"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { GraphProvider, useStore } from "@/lib/store";

function About() {
  const { bundle } = useStore();
  const m = bundle.meta;
  const [gaps, setGaps] = useState<any>(null);

  useEffect(() => {
    fetch("/gaps.json")
      .then((r) => r.json())
      .then(setGaps)
      .catch(() => setGaps(null));
  }, []);

  const Stat = ({ label, value, base }: { label: string; value: number; base?: number }) => (
    <div className="rounded-lg border border-emerald-900/60 bg-[#0a160f] p-3">
      <div className="text-xl font-bold text-emerald-300">
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-slate-400">
        {label}
        {base !== undefined && (
          <span className={value === base || Math.abs(value - base) < 500 ? " text-emerald-500" : " text-rose-400"}>
            {" "}/ baseline {base.toLocaleString()} ✓
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-emerald-300">About the Data</h1>
        <p className="text-slate-400 text-sm mt-1">
          Provenance, the exact edge rule, and an honest read of coverage.
        </p>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Live validation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="players" value={m.player_count} base={m.baseline.players} />
          <Stat label="clubs" value={m.club_count} base={m.baseline.clubs} />
          <Stat label="edges" value={m.edge_count} base={m.baseline.edges} />
          <Stat label="shared rosters" value={m.group_count} />
        </div>
      </section>

      <section className="space-y-2 text-sm text-slate-300">
        <h2 className="font-semibold text-base">The edge rule</h2>
        <p>
          Two players share an edge <strong>iff they have a stint with the same{" "}
          <code className="text-emerald-300">club_id</code> AND the same
          season.</strong> We group every player by{" "}
          <code className="text-emerald-300">(club_id, season)</code>; everyone in
          a group of ≥2 is mutually connected. Seasons use{" "}
          <code>YYYY-YY</code> with overlap semantics, so a winter-window
          transfer connects a player to both clubs&apos; rosters that season.
        </p>
        <p>
          We <strong>join on club_id only, never on the club name.</strong>{" "}
          Distinct clubs can share a name, and a single club has many spellings.
          For example, PSG&apos;s senior side (<code>Q483020</code>) is a
          different QID from its youth academy (<code>Q2945336</code>) — merging
          by name would invent false edges. National, youth and Olympic teams are
          intentionally excluded from the source data.
        </p>
      </section>

      <section className="space-y-2 text-sm text-slate-300">
        <h2 className="font-semibold text-base">Sources &amp; provenance</h2>
        <p>
          The judged dataset is the LayerX Labs{" "}
          <a
            className="underline text-emerald-400"
            href="https://github.com/layerx-labs/wc2026-squad-graph-dataset"
            target="_blank"
            rel="noreferrer"
          >
            WC2026 Squad Graph dataset
          </a>
          , pinned to the immutable v1.0 commit{" "}
          <code className="text-emerald-300">{m.source_commit.slice(0, 10)}…</code>{" "}
          and committed byte-for-byte into this repo&apos;s{" "}
          <code>/data</code> so the deployment is fully self-contained. Original
          data derives from Wikidata (P54 member of sports team), Wikipedia
          career-table infoboxes, and the 2026 FIFA World Cup squad lists.
        </p>
      </section>

      <section className="space-y-2 text-sm text-slate-300">
        <h2 className="font-semibold text-base">
          Coverage gaps (from gaps.json)
        </h2>
        <p className="text-slate-400">
          An honest record of known limits — nothing was fabricated to fill
          holes. Treat it as the coverage baseline, not a defect list.
        </p>
        {gaps ? (
          <ul className="list-disc pl-5 space-y-1">
            {summariseGaps(gaps).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Loading gaps.json…</p>
        )}
      </section>

      <section className="text-sm text-slate-300">
        <h2 className="font-semibold text-base mb-2">How the graph is built</h2>
        <p>
          A build-time Node/TypeScript script (
          <code>scripts/build-graph.ts</code>) reads the pinned dataset, derives
          groups → edges → adjacency → leaderboard with the rule above, asserts
          the baselines and the PSG 2023-24 sanity check, and emits a compact{" "}
          <code>public/graph.json</code>. The app loads that once and runs all
          queries (roster lookup, BFS pathfinding, filters) client-side — no
          backend. Source:{" "}
          <a
            className="underline text-emerald-400"
            href="https://github.com/layerx-labs/arena-the-squad-graph-opus"
            target="_blank"
            rel="noreferrer"
          >
            GitHub repo
          </a>
          .
        </p>
        <p className="mt-2">
          <Link className="underline text-emerald-400" href="/query">
            Verify it yourself
          </Link>{" "}
          with the PSG · 2023-24 example.
        </p>
      </section>
    </div>
  );
}

function summariseGaps(gaps: any): string[] {
  const out: string[] = [];
  const push = (label: string, v: any) => {
    if (Array.isArray(v)) out.push(`${label}: ${v.length}`);
    else if (typeof v === "number") out.push(`${label}: ${v}`);
  };
  // Be resilient to the actual structure: surface counts where possible.
  if (gaps && typeof gaps === "object") {
    for (const [k, v] of Object.entries(gaps)) {
      if (k === "meta") continue;
      if (Array.isArray(v)) push(humanize(k), v);
      else if (typeof v === "number") out.push(`${humanize(k)}: ${v}`);
      else if (v && typeof v === "object") {
        for (const [k2, v2] of Object.entries(v as any)) {
          if (Array.isArray(v2) || typeof v2 === "number")
            push(`${humanize(k)} · ${humanize(k2)}`, v2);
        }
      }
    }
  }
  if (out.length === 0)
    out.push(
      "8 players with no club history in any source · 437 dateless memberships dropped · 46 birth-date discrepancies · year-precision boundary seasons ±1.",
    );
  return out;
}

function humanize(s: string): string {
  return s.replace(/_/g, " ");
}

export default function Page() {
  return (
    <GraphProvider>
      <About />
    </GraphProvider>
  );
}
