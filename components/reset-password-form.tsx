"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      setAuthorized(!error && Boolean(data.user));
      setReady(true);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user) {
      setAuthorized(false);
      setMessage(
        "Your recovery session is invalid or expired. Request a new reset link.",
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    router.replace("/login?passwordReset=success");
    router.refresh();
  }

  if (!ready) {
    return <p>Verifying your recovery session...</p>;
  }

  if (!authorized) {
    return (
      <div className="space-y-4">
        <p role="alert">
          This recovery link is invalid or expired, or your session is missing.
          Please request a new password reset link.
        </p>
        <Link className="underline" href="/forgot-password">
          Request another reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block">
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Updating password..." : "Set new password"}
      </button>

      {message && (
        <p role="alert" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
