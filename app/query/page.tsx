"use client";


import Link from "next/link";
import { useState } from "react";
import { GraphProvider, useStore } from "@/lib/store";
import { groupKey } from "@/lib/graph";
import { flag } from "@/lib/flags";
import ClubSearch from "@/components/ClubSearch";
import type { Club } from "@/lib/types";

function Query() {
  const { bundle, clubById, playerById, seasonsByClub } = useStore();
  const [club, setClub] = useState<Club | null>(null);
  const [season, setSeason] = useState<string>("");

  const seasons = club ? seasonsByClub.get(club.id) ?? [] : [];
  const roster =
    club && season ? bundle.groups[groupKey(club.id, season)] ?? [] : [];

  // Demo shortcut: PSG 2023-24.
  const loadPsg = () => {
    const psg = clubById.get("Q483020");
    if (psg) {
      setClub(psg);
      setSeason("2023-24");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-300">Roster Query</h1>
        <p className="text-slate-400 text-sm mt-1">
          Given a club and season, list every WC2026 player who was there
          together. This is the brief&apos;s core query — joined on{" "}
          <code className="text-emerald-300">club_id</code>, never name.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400">Club</label>
          <ClubSearch clubs={bundle.clubs} onPick={(c) => { setClub(c); setSeason(""); }} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            disabled={!club}
            className="w-full rounded-lg bg-[#0c1a12] border border-emerald-900/70 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="">{club ? "Select a season…" : "Pick a club first"}</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={loadPsg}
        className="text-xs text-emerald-400 underline"
      >
        Try the reference example: Paris Saint-Germain · 2023-24
      </button>

      {club && season && (
        <div className="rounded-xl border border-emerald-900/60 bg-[#0a160f] p-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">
              {club.name}{" "}
              <span className="text-slate-400 text-sm">
                · {club.country} · {season}
              </span>
            </h2>
            <span className="text-sm text-emerald-300">
              {roster.length} player{roster.length === 1 ? "" : "s"}
            </span>
          </div>
          {roster.length === 0 ? (
            <p className="text-slate-400 text-sm mt-3">
              No WC2026 players listed at this club in {season}.
            </p>
          ) : (
            <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {roster
                .map((id) => playerById.get(id)!)
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/player?id=${p.id}`}
                      className="flex items-center gap-2 rounded-lg border border-emerald-900/50 px-3 py-2 text-sm hover:border-emerald-600"
                    >
                      <span>{flag(p.country)}</span>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-slate-500 text-xs ml-auto">
                        {p.position}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
          {roster.length >= 2 && (
            <p className="text-xs text-slate-500 mt-4">
              All {roster.length} players above are mutually connected — that&apos;s{" "}
              {(roster.length * (roster.length - 1)) / 2} teammate edges from
              this single roster.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <GraphProvider>
      <Query />
    </GraphProvider>
  );
}
