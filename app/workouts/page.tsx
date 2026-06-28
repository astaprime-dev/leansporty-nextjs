import { redirect } from "next/navigation";

/**
 * /workouts is PARKED (hidden from nav + redirected).
 *
 * It used to be a non-playable preview grid + an "available on iOS" notice —
 * low value once the web challenge shipped (the program lives at /my-program,
 * surfaced there and on /activity via ProgramCard).
 *
 * RECLAIM LATER: when membership (Phase 2) unlocks a standalone catalog, this
 * route becomes the "Library" of playable sessions. The old preview-grid
 * implementation is in git history (the commit before this redirect).
 */
export default function WorkoutsPage() {
  redirect("/my-program");
}
