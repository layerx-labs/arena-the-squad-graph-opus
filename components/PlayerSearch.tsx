"use client";

import { useMemo, useRef, useState } from "react";
import type { Player } from "@/lib/types";
import { flag } from "@/lib/flags";

export default function PlayerSearch({
  players,
  onPick,
  placeholder = "Search a player…",
  value = "",
}: {
  players: Player[];
  onPick: (p: Player) => void;
  placeholder?: string;
  value?: string;
}) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return players
      .filter((p) => p.name.toLowerCase().includes(t))
      .slice(0, 12);
  }, [q, players]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg bg-[#0c1a12] border border-emerald-900/70 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-emerald-900/70 bg-[#0a160f] shadow-xl">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  onPick(p);
                  setQ(p.name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-900/40 flex items-center gap-2"
              >
                <span>{flag(p.country)}</span>
                <span className="font-medium">{p.name}</span>
                <span className="text-slate-500 text-xs">
                  {p.country} · {p.position}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
