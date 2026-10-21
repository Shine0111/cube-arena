# Planned application structure

```text
app/
  page.tsx                         # Home dashboard
  signup/page.tsx                  # Account registration
  login/page.tsx                   # Sign in
  forgot-password/page.tsx         # Password recovery
  onboarding/page.tsx              # Username/profile setup
  settings/page.tsx                # Account and timer preferences
  rankings/page.tsx                # Event-specific community rankings
  profile/page.tsx                 # Current user's profile
  profile/solves/page.tsx          # Solve history
  profile/matches/page.tsx         # Competition history
  u/[username]/page.tsx            # Public profile
  rooms/create/page.tsx            # Create competition room
  rooms/join/page.tsx              # Join with room code
  rooms/[roomId]/page.tsx          # Competition room
  rooms/[roomId]/results/page.tsx  # Round results
  matches/[matchId]/page.tsx       # Final match results
components/
  app-shell.tsx                    # Global header/navigation/footer
lib/
  # Add Supabase clients, validation, ranking and timing logic here
```

The route list follows the supplied `About-Project.txt`. Route placeholders are intentionally simple until the relevant milestone is implemented.
