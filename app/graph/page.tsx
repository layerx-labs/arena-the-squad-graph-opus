"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GraphProvider, useStore } from "@/lib/store";
import { countryColor, flag } from "@/lib/flags";
import PlayerSearch from "@/components/PlayerSearch";
import type { Player } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center text-slate-500">
      Loading graph engine…
    </div>
  ),
});

type Mode = "country" | "neighborhood";

function GraphView() {
  const { bundle, playerById, clubById } = useStore();
  const router = useRouter();
  const fgRef = useRef<any>(null);

  const countries = useMemo(
    () => [...new Set(bundle.players.map((p) => p.country))].sort(),
    [bundle],
  );

  const [mode, setMode] = useState<Mode>("country");
  const [country, setCountry] = useState<string>(countries[0] ?? "");
  const [focus, setFocus] = useState<Player | null>(null);

  const data = useMemo(() => {
    const nodeIds = new Set<string>();
    const edges: { source: string; target: string; label: string }[] = [];
    const seen = new Set<string>();

    if (mode === "neighborhood" && focus) {
      nodeIds.add(focus.id);
      for (const e of bundle.adjacency[focus.id] ?? []) nodeIds.add(e.id);
      // edges among the neighborhood set
      for (const id of nodeIds) {
        for (const e of bundle.adjacency[id] ?? []) {
          if (!nodeIds.has(e.id)) continue;
          const key = [id, e.id].sort().join("|");
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push({
            source: id,
            target: e.id,
            label: `${clubById.get(e.club_id)?.name ?? e.club_id} · ${e.season}`,
          });
        }
      }
    } else {
      // Country mode: every player from the chosen nation + their direct
      // teammates, with edges among that visible set.
      for (const p of bundle.players) {
        if (p.country === country) nodeIds.add(p.id);
      }
      const base = new Set(nodeIds);
      for (const id of base) {
        for (const e of bundle.adjacency[id] ?? []) nodeIds.add(e.id);
      }
      for (const id of nodeIds) {
        for (const e of bundle.adjacency[id] ?? []) {
          if (!nodeIds.has(e.id)) continue;
          const key = [id, e.id].sort().join("|");
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push({
            source: id,
            target: e.id,
            label: `${clubById.get(e.club_id)?.name ?? e.club_id} · ${e.season}`,
          });
        }
      }
    }

    const nodes = [...nodeIds].map((id) => {
      const p = playerById.get(id)!;
      return {
        id,
        name: p.name,
        country: p.country,
        color: countryColor(p.country),
      };
    });
    return { nodes, links: edges };
  }, [mode, country, focus, bundle, playerById, clubById]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-emerald-300">
          Interactive Graph
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Force-directed map of teammate connections. Hover an edge for the
          shared club &amp; season; click a node to open the player.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex rounded-lg overflow-hidden border border-emerald-900/70">
          <button
            onClick={() => setMode("country")}
            className={`px-3 py-1.5 ${mode === "country" ? "bg-emerald-700" : "bg-[#0c1a12]"}`}
          >
            By nation
          </button>
          <button
            onClick={() => setMode("neighborhood")}
            className={`px-3 py-1.5 ${mode === "neighborhood" ? "bg-emerald-700" : "bg-[#0c1a12]"}`}
          >
            Player neighborhood
          </button>
        </div>

        {mode === "country" ? (
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg bg-[#0c1a12] border border-emerald-900/70 px-2 py-1.5 outline-none focus:border-emerald-500"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {flag(c)} {c}
              </option>
            ))}
          </select>
        ) : (
          <div className="w-64">
            <PlayerSearch
              players={bundle.players}
              onPick={setFocus}
              value={focus?.name ?? ""}
              placeholder="Focus on a player…"
            />
          </div>
        )}
        <span className="text-slate-500 text-xs">
          {data.nodes.length} nodes · {data.links.length} edges shown
        </span>
      </div>

      <div className="rounded-xl border border-emerald-900/60 bg-[#06100b] overflow-hidden">
        {mode === "neighborhood" && !focus ? (
          <div className="h-[600px] flex items-center justify-center text-slate-500 text-sm">
            Pick a player to render their teammate neighborhood.
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={data}
            height={600}
            backgroundColor="#06100b"
            nodeLabel={(n: any) => `${n.name} (${n.country})`}
            nodeColor={(n: any) => n.color}
            nodeRelSize={4}
            linkColor={() => "rgba(52,211,153,0.18)"}
            linkLabel={(l: any) => l.label}
            linkWidth={0.5}
            cooldownTicks={80}
            onNodeClick={(n: any) => router.push(`/player?id=${n.id}`)}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node: any, ctx: any, scale: number) => {
              if (scale < 2.2) return;
              const label = node.name as string;
              ctx.font = `${10 / scale}px system-ui`;
              ctx.fillStyle = "#cbd5e1";
              ctx.fillText(label, node.x + 5 / scale, node.y + 3 / scale);
            }}
          />
        )}
      </div>
      <p className="text-xs text-slate-500">
        Node color = WC2026 national team. The full graph has{" "}
        {bundle.meta.edge_count.toLocaleString()} edges across{" "}
        {bundle.meta.player_count} players; views are scoped for legibility and
        performance.
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <GraphProvider>
      <GraphView />
    </GraphProvider>
  );
}
