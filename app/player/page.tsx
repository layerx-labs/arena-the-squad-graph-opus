"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { GraphProvider, useStore } from "@/lib/store";
import { flag } from "@/lib/flags";

function Profile() {
  const { bundle, playerById, clubById } = useStore();
  const id = useSearchParams().get("id") ?? "";
  const player = playerById.get(id);

  const teammatesByGroup = useMemo(() => {
    if (!player) return [];
    const map = new Map<
      string,
      { club_id: string; season: string; ids: Set<string> }
    >();
    for (const e of bundle.adjacency[id] ?? []) {
      const key = `${e.club_id}|${e.season}`;
      let g = map.get(key);
      if (!g) {
        g = { club_id: e.club_id, season: e.season, ids: new Set() };
        map.set(key, g);
      }
      g.ids.add(e.id);
    }
    return [...map.values()].sort(
      (a, b) =>
        b.season.localeCompare(a.season) || a.club_id.localeCompare(b.club_id),
    );
  }, [bundle, id, player]);

  if (!player)
    return (
      <div className="text-slate-400">
        Player not found.{" "}
        <Link className="underline text-emerald-400" href="/">
          Go home
        </Link>
      </div>
    );

  const stintsBySeason = [...player.stints].sort((a, b) =>
    b.season.localeCompare(a.season),
  );
  const uniqueTeammates = new Set(
    (bundle.adjacency[id] ?? []).map((e) => e.id),
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl">{flag(player.country)}</span>
        <div>
          <h1 className="text-2xl font-bold text-emerald-300">{player.name}</h1>
          <p className="text-slate-400 text-sm">
            {player.country} · {player.position} ·{" "}
            {clubById.get(player.current_club_id)?.name ?? "—"} (current) ·{" "}
            {uniqueTeammates} teammates ·{" "}
            <a
              className="underline"
              href={`https://www.wikidata.org/wiki/${player.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {player.id}
            </a>
          </p>
        </div>
        <Link
          href={`/path?from=${player.id}`}
          className="ml-auto text-sm rounded-lg border border-emerald-700 px-3 py-1.5 hover:bg-emerald-900/40"
        >
          Find a path from here →
        </Link>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Club history (per season)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {stintsBySeason.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-emerald-900/50 px-3 py-2 text-sm"
            >
              <div className="font-medium">
                {clubById.get(s.club_id)?.name ?? s.club_id}
              </div>
              <div className="text-slate-500 text-xs">
                {clubById.get(s.club_id)?.country ?? ""} · {s.season}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Teammates by shared roster</h2>
        {teammatesByGroup.length === 0 && (
          <p className="text-slate-400 text-sm">
            No shared-club teammates among WC2026 squads.
          </p>
        )}
        <div className="space-y-3">
          {teammatesByGroup.map((g) => (
            <div
              key={`${g.club_id}|${g.season}`}
              className="rounded-lg border border-emerald-900/50 p-3"
            >
              <div className="text-sm font-medium text-emerald-300">
                {clubById.get(g.club_id)?.name ?? g.club_id}{" "}
                <span className="text-slate-500">· {g.season}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...g.ids]
                  .map((tid) => playerById.get(tid)!)
                  .filter(Boolean)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <Link
                      key={t.id}
                      href={`/player?id=${t.id}`}
                      className="text-xs rounded-full border border-emerald-900/60 px-2 py-1 hover:border-emerald-600"
                    >
                      {flag(t.country)} {t.name}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <GraphProvider>
      <Suspense>
        <Profile />
      </Suspense>
    </GraphProvider>
  );
}
