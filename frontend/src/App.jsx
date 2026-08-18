import { useEffect, useState } from "react";

function formatResult(result) {
  return JSON.stringify(result, null, 2);
}

export default function App() {
  const [state, setState] = useState({ phase: "loading", result: null });

  async function checkHealth() {
    setState({ phase: "loading", result: null });

    try {
      const response = await fetch("/api/health");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`The API returned HTTP ${response.status}.`);
      }

      setState({ phase: "ready", result });
    } catch (error) {
      setState({
        phase: "error",
        result: error instanceof Error ? error.message : "The API health check could not be completed.",
      });
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  const isReady = state.phase === "ready";
  const isLoading = state.phase === "loading";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-100 sm:px-10">
      <section className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">Sprint 1 · Technical Foundation</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Smart Cash &amp; Carry</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
          Frontend-to-backend connectivity check for the MVP grocery delivery platform.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-300">GET /api/health</p>
              <p className="mt-1 text-sm text-slate-400">Proxied from Vite to the Express API.</p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                isReady
                  ? "bg-emerald-400/15 text-emerald-300"
                  : state.phase === "error"
                    ? "bg-rose-400/15 text-rose-300"
                    : "bg-amber-400/15 text-amber-200"
              }`}
            >
              {isReady ? "Connected" : state.phase === "error" ? "Unavailable" : "Checking"}
            </span>
          </div>

          <pre className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-emerald-300">
            {isLoading ? "Requesting backend health…" : isReady ? formatResult(state.result) : String(state.result)}
          </pre>

          <button
            type="button"
            onClick={checkHealth}
            disabled={isLoading}
            className="mt-6 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "Checking…" : "Run health check again"}
          </button>
        </div>
      </section>
    </main>
  );
}

