import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-bold text-emerald-300">Page not found</h1>
      <p className="text-slate-400 mt-2">
        <Link className="underline" href="/">
          Back to The Squad Graph
        </Link>
      </p>
    </div>
  );
}
