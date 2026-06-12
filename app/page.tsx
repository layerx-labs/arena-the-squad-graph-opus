"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraphProvider, useStore } from "@/lib/store";
import PlayerSearch from "@/components/PlayerSearch";

function Home() {
  const { bundle } = useStore();
  const router = useRouter();
  const m = bundle.meta;
  const edgeOk = Math.abs(m.edge_count - m.baseline.edges) < 500;
  const playerOk = m.player_count === m.baseline.players;
  const clubOk = m.club_count === m.baseline.clubs;
  const allOk = edgeOk && playerOk && clubOk;

  return (
    <div className="space-y-10">
      <section className="text-center pt-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-emerald-300">
          Six Degrees of the 2026 World Cup
        </h1>
        <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
          Every player at the tournament, linked by the clubs they shared —
          season by season. Trace how rivals were once teammates, look up any
          club&apos;s roster, and explore the network.
        </p>
        <div className="mt-6 max-w-md mx-auto">
          <PlayerSearch
            players={bundle.players}
            onPick={(p) => router.push(`/player?id=${p.id}`)}
            placeholder="Search any of 1,248 players…"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Players", value: m.player_count, href: "/graph" },
          { label: "Clubs", value: m.club_count, href: "/clubs" },
          { label: "Teammate edges", value: m.edge_count.toLocaleString(), href: "/graph" },
          { label: "Shared rosters", value: m.group_count.toLocaleString(), href: "/clubs" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-emerald-900/60 bg-[#0a160f] p-4 text-center hover:border-emerald-600 transition-colors"
          >
            <div className="text-2xl font-bold text-emerald-300">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </Link>
        ))}
      </section>

      <section
        className={`rounded-xl border p-4 text-sm ${
          allOk
            ? "border-emerald-700 bg-emerald-950/40"
            : "border-rose-700 bg-rose-950/40"
        }`}
      >
        <div className="font-semibold mb-1">
          {allOk ? "✓ Sanity check passed" : "✗ Sanity check mismatch"}
        </div>
        <p className="text-slate-300">
          Live counts vs. the dataset&apos;s documented baselines:{" "}
          <strong>{m.player_count}</strong>/{m.baseline.players} players ·{" "}
          <strong>{m.club_count}</strong>/{m.baseline.clubs} clubs ·{" "}
          <strong>{m.edge_count.toLocaleString()}</strong> edges (baseline ~
          {m.baseline.edges.toLocaleString()}). The graph is joined on{" "}
          <code className="text-emerald-300">club_id</code> + season, never club
          name. See <Link className="underline" href="/about">About / Data</Link>.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            href: "/query",
            title: "Roster Query",
            body: "Pick a club and season — get everyone who was there together, with their WC2026 nation. The core deliverable.",
            icon: "📋",
          },
          {
            href: "/path",
            title: "Six Degrees",
            body: "Choose any two players. BFS finds the shortest chain of shared-club links between them — even across rival nations.",
            icon: "🔗",
          },
          {
            href: "/graph",
            title: "Interactive Graph",
            body: "A force-directed map of the whole tournament. Filter by nation, focus a player's neighborhood, read edge labels.",
            icon: "🕸️",
          },
          {
            href: "/clubs",
            title: "Strongest Connections",
            body: "Clubs & seasons ranked by how many WC2026 players were teammates there — the biggest feeder rosters.",
            icon: "🏆",
          },
          {
            href: "/about",
            title: "About the Data",
            body: "Provenance, the exact edge rule, the name-join trap we avoid, and an honest read of gaps.json coverage.",
            icon: "📖",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-emerald-900/60 bg-[#0a160f] p-5 hover:border-emerald-600 transition-colors"
          >
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="font-semibold text-emerald-300">{c.title}</div>
            <p className="text-sm text-slate-400 mt-1">{c.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <GraphProvider>
      <Home />
    </GraphProvider>
  );
}
