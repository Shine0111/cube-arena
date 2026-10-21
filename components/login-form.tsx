"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    const destination =
      next?.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";

    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {message && (
        <p role="alert" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
