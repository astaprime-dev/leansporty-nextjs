import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/instructor/billing
 *
 * Upserts the caller's payout + tax details (instructor_billing, one row per
 * instructor). Writes go through the caller's OWN RLS-scoped client — the row
 * is the instructor's data, no service role involved. Required before the
 * first payout (agreement §1/§7); the founder reads it for the monthly run,
 * self-billed statements, and DAC7.
 */

const STATUSES = new Set(["business", "unregistered_activity", "foreign"]);
// Broad structural check (country prefix + length); real validation is the
// founder's bank rejecting a bad IBAN — this only catches typos early.
const IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/;

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructor) {
    return NextResponse.json({ error: "not an instructor" }, { status: 403 });
  }

  const legalName = str(body.legalName, 200);
  const businessName = str(body.businessName, 200); // optional
  const businessStatus =
    typeof body.businessStatus === "string" && STATUSES.has(body.businessStatus)
      ? body.businessStatus
      : null;
  const tin = str(body.tin, 50);
  const vatNumber = str(body.vatNumber, 50); // optional
  const addressLine = str(body.addressLine, 300);
  const city = str(body.city, 100);
  const postalCode = str(body.postalCode, 20);
  const country =
    typeof body.country === "string" && /^[A-Za-z]{2}$/.test(body.country.trim())
      ? body.country.trim().toUpperCase()
      : null;
  const iban =
    typeof body.iban === "string"
      ? body.iban.replace(/\s+/g, "").toUpperCase()
      : "";
  const accountHolder = str(body.accountHolder, 200);
  const unregisteredConfirmed = body.unregisteredConfirmed === true;

  if (
    !legalName ||
    !businessStatus ||
    !tin ||
    !addressLine ||
    !city ||
    !postalCode ||
    !country ||
    !accountHolder
  ) {
    return NextResponse.json(
      { error: "Please fill in all required fields." },
      { status: 400 }
    );
  }
  if (!IBAN_RE.test(iban)) {
    return NextResponse.json(
      { error: "That IBAN doesn't look right — please check it (letters and digits only, starting with a 2-letter country code)." },
      { status: 400 }
    );
  }
  if (businessStatus === "unregistered_activity" && !unregisteredConfirmed) {
    return NextResponse.json(
      { error: "Please confirm the small-activity statement to continue." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("instructor_billing").upsert(
    {
      instructor_id: instructor.id,
      legal_name: legalName,
      business_name: businessName,
      business_status: businessStatus,
      tin,
      vat_number: vatNumber,
      address_line: addressLine,
      city,
      postal_code: postalCode,
      country,
      iban,
      account_holder: accountHolder,
      unregistered_statement_at:
        businessStatus === "unregistered_activity" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "instructor_id" }
  );
  if (error) {
    console.error("instructor_billing upsert failed:", error);
    return NextResponse.json(
      { error: "Could not save your details. Please try again." },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
