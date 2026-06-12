"use client";


import Link from "next/link";
import { useMemo, useState } from "react";
import { GraphProvider, useStore } from "@/lib/store";
import { groupKey } from "@/lib/graph";

function Clubs() {
  const { bundle, clubById, playerById } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("");

  const countries = useMemo(
    () =>
      [...new Set(bundle.clubs.map((c) => c.country))]
        .filter(Boolean)
        .sort(),
    [bundle],
  );

  const rows = useMemo(() => {
    return bundle.leaderboard.filter((g) => {
      if (!country) return true;
      return clubById.get(g.club_id)?.country === country;
    });
  }, [bundle, country, clubById]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-300">
          Strongest Club Connections
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Clubs &amp; seasons ranked by how many WC2026 players were teammates
          there. Bigger rosters = denser sub-networks (a group of N players is{" "}
          N·(N−1)/2 edges).
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Filter by club country:</span>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg bg-[#0c1a12] border border-emerald-900/70 px-2 py-1 outline-none focus:border-emerald-500"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {rows.slice(0, 60).map((g, i) => {
          const key = groupKey(g.club_id, g.season);
          const club = clubById.get(g.club_id);
          const isOpen = open === key;
          return (
            <div
              key={key}
              className="rounded-lg border border-emerald-900/60 bg-[#0a160f]"
            >
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-slate-500 w-6 text-sm">{i + 1}</span>
                <span className="font-medium">{club?.name ?? g.club_id}</span>
                <span className="text-slate-500 text-xs">
                  {club?.country} · {g.season}
                </span>
                <span className="ml-auto text-emerald-300 font-semibold">
                  {g.player_ids.length} players
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {g.player_ids
                    .map((id) => playerById.get(id)!)
                    .filter(Boolean)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <Link
                        key={p.id}
                        href={`/player?id=${p.id}`}
                        className="text-xs rounded-full border border-emerald-900/60 px-2 py-1 hover:border-emerald-600"
                      >
                        {p.name}{" "}
                        <span className="text-slate-500">({p.country})</span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <GraphProvider>
      <Clubs />
    </GraphProvider>
  );
}
