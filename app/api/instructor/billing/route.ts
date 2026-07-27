import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isEUCountry } from "@/lib/countries";

export const runtime = "nodejs";

/**
 * POST /api/instructor/billing
 *
 * Upserts the caller's payout + tax details (instructor_billing, one row per
 * instructor). Writes go through the caller's OWN RLS-scoped client — the row
 * is the instructor's data, no service role involved. Required before the
 * first payout (agreement §1/§7); the founder reads it for the monthly run,
 * self-billed statements, and DAC7.
 *
 * business_status is DERIVED, not asked: non-PL country → 'foreign'; PL +
 * registered business → 'business'; PL without one → 'unregistered_activity'
 * (requires the confirmed statement). Keeps the form country-neutral while the
 * stored tiers still match the agreement.
 */

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
  const tin = str(body.tin, 50);
  const vatNumber = str(body.vatNumber, 50); // optional
  const addressLine = str(body.addressLine, 300);
  const city = str(body.city, 100);
  const postalCode = str(body.postalCode, 20);
  const country =
    typeof body.country === "string" && /^[A-Za-z]{2}$/.test(body.country.trim())
      ? body.country.trim().toUpperCase()
      : null;
  const unregisteredConfirmed = body.unregisteredConfirmed === true;

  if (!legalName || !addressLine || !city || !postalCode || !country) {
    return NextResponse.json(
      { error: "Please fill in all required fields." },
      { status: 400 }
    );
  }
  // TIN: mandatory for EU residents (DAC7 — no de-minimis for services);
  // optional outside the EU (outside DAC7 scope — do not demand e.g. a US SSN).
  if (isEUCountry(country) && !tin) {
    return NextResponse.json(
      { error: "A tax identification number is required for EU residents." },
      { status: 400 }
    );
  }
  // Bank fields ride along ONLY when the bank-transfer path's combined form
  // submits them (the Stripe path sends them empty). Empty → the stored bank
  // columns are left untouched, so a tax-details update never wipes a saved
  // account.
  let bankColumns: Record<string, string> = {};
  const rawIban = typeof body.iban === "string" ? body.iban.trim() : "";
  if (rawIban !== "") {
    const iban = rawIban.replace(/\s+/g, "").toUpperCase();
    const accountHolder = str(body.accountHolder, 200);
    if (!IBAN_RE.test(iban)) {
      return NextResponse.json(
        { error: "The IBAN appears invalid — verify it (a 2-letter country code followed by check digits and the account number)." },
        { status: 400 }
      );
    }
    if (!accountHolder) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }
    // Saving a bank account happens on the bank-transfer path — record the
    // method choice with it so the payout run follows the instructor's intent.
    bankColumns = { iban, account_holder: accountHolder, payout_method: "manual" };
  }

  // Derive the stored status from country + the Poland-only answer.
  let businessStatus: string;
  if (country !== "PL") {
    businessStatus = "foreign";
  } else if (body.plRegisteredBusiness === true) {
    businessStatus = "business";
  } else if (body.plRegisteredBusiness === false) {
    if (!unregisteredConfirmed) {
      return NextResponse.json(
        { error: "The unregistered-activity statement must be confirmed to continue." },
        { status: 400 }
      );
    }
    businessStatus = "unregistered_activity";
  } else {
    return NextResponse.json(
      { error: "Business status is required." },
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
      ...bankColumns,
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
