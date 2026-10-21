"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="rounded border border-red-500 px-4 py-2 font-medium text-red-500 disabled:opacity-50"
      >
        {loading ? "Signing out..." : "Log out"}
      </button>

      {message && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}
