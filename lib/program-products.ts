import { getServiceRoleClient, ensureStripeProduct } from "@/lib/stripe";
import { SUPPORTED_CURRENCIES } from "@/lib/stream-products";
import type { ProductConfig } from "@/types/commerce";

/**
 * Provision the `products` row backing an instructor Program (kind='course').
 * Server-only and trusted: the caller MUST have verified the acting user owns
 * `instructorId`. Written with the service-role client (`products` has no user
 * INSERT policy), mirroring lib/stream-products.ts.
 *
 * Programs start as DRAFTS (`is_active=false`) — the publish route flips them
 * live after the readiness + terms check. Like class products, no Stripe
 * objects are created here; Checkout prices inline from this row.
 */
export type ProgramProductInput = {
  instructorId: string;
  title: string;
  priceCents: number;
  currency: string; // e.g. "eur"
  structure: "list" | "days";
  programLengthDays?: number; // days mode only
};

/** Fixed v1 access window — matches the 21-day challenge's proven config. */
const PROGRAM_ACCESS_MONTHS = 12;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (Polish titles)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function provisionProgramProduct(
  input: ProgramProductInput
): Promise<{ productId: string; slug: string }> {
  const { instructorId, title, priceCents, currency, structure, programLengthDays } = input;
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error("priceCents must be a positive integer");
  }
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const db = getServiceRoleClient();

  // Lock the instructor's split % onto the product (per-instructor default,
  // else platform 80) so later default changes don't rewrite history.
  const { data: instr } = await db
    .from("instructors")
    .select("split_pct")
    .eq("id", instructorId)
    .maybeSingle();
  const splitPct = instr?.split_pct ?? 80;

  const config: ProductConfig = {
    structure,
    access_months: PROGRAM_ACCESS_MONTHS,
    ...(structure === "days" && programLengthDays
      ? { program_length_days: programLengthDays }
      : {}),
  };

  // Random suffix keeps slugs unique across instructors without a lookup loop.
  const suffix = Math.random().toString(36).slice(2, 8);
  const base = slugify(title) || "program";
  const slug = `${base}-${suffix}`;

  const { data, error } = await db
    .from("products")
    .insert({
      slug,
      kind: "course",
      title,
      price_cents: priceCents,
      currency,
      instructor_id: instructorId,
      split_pct: splitPct,
      is_active: false,
      config,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create program product: ${error?.message ?? "unknown"}`);
  }

  // Deterministic Stripe Product (id = slug) so the first checkout doesn't
  // race creation; same helper the checkout route uses.
  try {
    await ensureStripeProduct(slug, title);
  } catch {
    // Non-fatal: checkout's ensureStripeProduct() will retry lazily.
  }

  return { productId: data.id, slug };
}
