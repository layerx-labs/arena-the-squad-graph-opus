import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Squad Graph — Six Degrees of the 2026 World Cup",
  description:
    "An interactive social graph of World Cup 2026 players connected by shared club history. Find rosters, trace six-degrees paths, and explore the network.",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/query", label: "Roster Query" },
  { href: "/path", label: "Six Degrees" },
  { href: "/graph", label: "Graph" },
  { href: "/clubs", label: "Leaderboard" },
  { href: "/about", label: "About / Data" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-emerald-900/60 bg-[#08130c]/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/" className="font-bold text-emerald-300 text-lg shrink-0">
              ⚽ The Squad Graph
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
              {nav.slice(1).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="hover:text-emerald-300 transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-emerald-900/60 text-xs text-slate-500 py-4 text-center">
          The Squad Graph · WC2026 dataset (LayerX Labs v1.0) · built for the
          AI Agent Hackathon
        </footer>
      </body>
    </html>
  );
}
