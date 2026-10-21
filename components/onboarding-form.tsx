"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingForm() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setMessage("Please sign in before choosing a username.");
      }

      setCheckingSession(false);
    }

    checkUser();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const normalizedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setMessage("Use 3–20 lowercase letters, numbers, or underscores.");
      return;
    }

    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMessage("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: normalizedUsername })
      .eq("id", userData.user.id);

    if (error) {
      if (error.code === "23505") {
        setMessage("That username is already taken. Try another.");
      } else {
        setMessage(error.message);
      }

      setLoading(false);
      return;
    }

    setMessage("Username saved! Welcome to Cube Arena.");
    setLoading(false);
    router.push("/profile");
    router.refresh();
  }

  if (checkingSession) {
    return <p>Checking your session...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="mb-1 block">
          Choose your username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          autoComplete="username"
          className="w-full rounded border px-3 py-2"
        />

        <p className="mt-1 text-sm text-gray-500">
          3–20 letters, numbers, or underscores. Usernames must be unique.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save username"}
      </button>

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
