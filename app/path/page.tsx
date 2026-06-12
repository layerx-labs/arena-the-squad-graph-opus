"use client";


import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GraphProvider, useStore } from "@/lib/store";
import { shortestPath } from "@/lib/graph";
import { flag } from "@/lib/flags";
import PlayerSearch from "@/components/PlayerSearch";
import type { Player } from "@/lib/types";

function Path() {
  const { bundle, playerById, clubById } = useStore();
  const sp = useSearchParams();
  const initialFrom = sp.get("from");
  const [from, setFrom] = useState<Player | null>(
    initialFrom ? playerById.get(initialFrom) ?? null : null,
  );
  const [to, setTo] = useState<Player | null>(null);

  const result = useMemo(() => {
    if (!from || !to) return null;
    return shortestPath(bundle.adjacency, from.id, to.id);
  }, [from, to, bundle]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-300">
          Six Degrees of Separation
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Pick two players. We run breadth-first search over the teammate graph
          to find the shortest chain of &ldquo;played together at the same club
          in the same season&rdquo; links.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400">From</label>
          <PlayerSearch
            players={bundle.players}
            onPick={setFrom}
            value={from?.name ?? ""}
            placeholder="First player…"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">To</label>
          <PlayerSearch
            players={bundle.players}
            onPick={setTo}
            value={to?.name ?? ""}
            placeholder="Second player…"
          />
        </div>
      </div>

      {from && to && (
        <div className="rounded-xl border border-emerald-900/60 bg-[#0a160f] p-5">
          {!result ? (
            <p className="text-rose-300 text-sm">
              No connection found between {from.name} and {to.name} within the
              WC2026 squad graph.
            </p>
          ) : result.path.length === 1 ? (
            <p className="text-slate-300 text-sm">Pick two different players.</p>
          ) : (
            <>
              <div className="text-sm text-emerald-300 mb-4">
                {result.via.length} hop{result.via.length === 1 ? "" : "s"} —{" "}
                {result.via.length === 1
                  ? "direct teammates!"
                  : `${result.via.length} degrees of separation`}
              </div>
              <ol className="space-y-1">
                {result.path.map((pid, i) => {
                  const p = playerById.get(pid)!;
                  const hop = i > 0 ? result.via[i - 1] : null;
                  return (
                    <li key={pid}>
                      {hop && (
                        <div className="ml-3 my-1 border-l-2 border-emerald-800 pl-4 py-1 text-xs text-slate-400">
                          ↓ both at{" "}
                          <span className="text-emerald-300">
                            {clubById.get(hop.club_id)?.name ?? hop.club_id}
                          </span>{" "}
                          in {hop.season}
                        </div>
                      )}
                      <Link
                        href={`/player?id=${p.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-900/60 px-3 py-2 text-sm hover:border-emerald-600"
                      >
                        <span>{flag(p.country)}</span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-slate-500 text-xs">
                          {p.country}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <GraphProvider>
      <Suspense>
        <Path />
      </Suspense>
    </GraphProvider>
  );
}
