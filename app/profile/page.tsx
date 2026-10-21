import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=%2Fprofile");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="mt-4 text-red-500">
          We couldn't load your profile. Please try again later.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </main>
    );
  }

  const displayName = profile.display_name || profile.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Player profile</h1>
        <LogoutButton />
      </div>

      <section className="mt-8 rounded-xl border p-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${displayName}'s avatar`}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div
              aria-label={`${displayName}'s avatar placeholder`}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-700 text-xl font-bold text-white"
            >
              {initials}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold">{displayName}</h2>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </div>

        <div className="mt-6 border-t pt-5">
          <h3 className="font-semibold">About</h3>
          <p className="mt-2 whitespace-pre-wrap text-gray-600">
            {profile.bio || "No bio added yet."}
          </p>
        </div>

        <div className="mt-5 border-t pt-5">
          <h3 className="font-semibold">Email</h3>
          <p className="mt-2 text-gray-600">
            {user.email || "No email available"}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Only you can see this email on your private profile page.
          </p>
        </div>

        <div className="mt-5 border-t pt-5">
          <h3 className="font-semibold">Player since</h3>
          <p className="mt-2 text-gray-600">
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </section>
    </main>
  );
}
