import { useState } from "react";
import { apiRequest } from "../api";

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await apiRequest("/api/admin/login", { method: "POST", body: { username, password } });
      onLogin(result.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#160b2e] px-5 py-12 text-slate-100 sm:px-8">
      <section className="mx-auto grid min-h-[620px] max-w-5xl overflow-hidden rounded-3xl border border-violet-300/15 bg-[#211044] shadow-2xl shadow-black/35 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between bg-gradient-to-br from-violet-600 via-violet-700 to-[#2a0c58] p-8 sm:p-12">
          <div><p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-100/80">Smart Cash &amp; Carry</p><h1 className="mt-8 max-w-md text-4xl font-bold tracking-tight text-white sm:text-5xl">Admin control, without the clutter.</h1><p className="mt-6 max-w-md text-base leading-7 text-violet-100/85">Use this protected workspace to prepare categories, products, availability, and product imagery for the customer experience in a later sprint.</p></div>
          <p className="mt-12 text-sm text-violet-100/70">Sprint 2 · Admin-only operations</p>
        </div>
        <div className="flex items-center p-8 sm:p-12">
          <form className="w-full" onSubmit={submit}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Administrator sign in</p><h2 className="mt-3 text-3xl font-bold text-white">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-300">Enter the credentials configured in your environment.</p>
            {error && <div className="mt-6 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            <label className="mt-8 block text-sm font-medium text-slate-200">Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="field" /></label>
            <label className="mt-5 block text-sm font-medium text-slate-200">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="field" /></label>
            <button disabled={isSubmitting} className="mt-7 w-full rounded-xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Signing in…" : "Sign in to admin"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
