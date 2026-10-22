"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    // Avoid disclosing whether an account exists.
    setMessage(
      "If an account exists for that email, you'll receive a password reset link shortly. Check your inbox and spam folder.",
    );

    if (error) {
      // Keep the same public message; log only a generic diagnostic.
      console.error("Password reset request failed.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block">
          Account email
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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send reset link"}
      </button>

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
