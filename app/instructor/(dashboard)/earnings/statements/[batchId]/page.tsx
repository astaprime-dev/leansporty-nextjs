import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { COUNTRIES } from "@/lib/countries";
import { PrintButton } from "@/components/instructor/print-button";

/**
 * Monthly payout statement — the YouTube/OnlyFans-style earnings statement,
 * worded so it doubles as the Polish self-billed settlement document
 * (samofakturowanie, instructor agreement §7). Rendered straight from the
 * instructor_payouts ledger for one payout batch; RLS scopes everything to
 * the signed-in instructor's own rows. Print-friendly: the site chrome is
 * hidden in print, so the browser's print dialog produces the PDF.
 */

function fmt(cents: number, currency = "eur") {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function vatTreatment(
  businessStatus: string | null,
  vatNumber: string | null,
  country: string
): string {
  if (businessStatus === "unregistered_activity") {
    return "VAT: exempt — the supplier operates under the Polish small-scale activity rules (zwolnienie).";
  }
  if (businessStatus === "business" && vatNumber) {
    return `VAT: settled by the supplier as a VAT-registered business (VAT no. ${vatNumber}).`;
  }
  if (businessStatus === "foreign") {
    return country && country !== "PL"
      ? "VAT: reverse charge — services supplied to Astaprime Sp. z o.o. (Article 196 of Council Directive 2006/112/EC)."
      : "VAT: per the supplier's status.";
  }
  return "VAT: exempt (zwolnienie).";
}

export default async function PayoutStatementPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId: rawBatchId } = await params;
  const batchId = decodeURIComponent(rawBatchId);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/instructor/earnings");

  const { data: instructor } = await supabase
    .from("instructors")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();
  if (!instructor) redirect("/instructor/profile");

  const { data: rows } = await supabase
    .from("instructor_payouts")
    .select(
      "product_id, gross_cents, vat_cents, platform_fee_cents, instructor_share_cents, currency, created_at, paid_at, paid_via"
    )
    .eq("instructor_id", instructor.id)
    .eq("payout_batch_id", batchId)
    .order("created_at", { ascending: true });
  if (!rows || rows.length === 0) notFound();

  const { data: billing } = await supabase
    .from("instructor_billing")
    .select(
      "legal_name, business_name, business_status, tin, vat_number, address_line, city, postal_code, country"
    )
    .eq("instructor_id", instructor.id)
    .maybeSingle();

  const productIds = Array.from(
    new Set(rows.map((r) => r.product_id).filter((x): x is string => !!x))
  );
  const titleById = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, title")
      .in("id", productIds);
    for (const p of products ?? []) titleById.set(p.id, p.title);
  }

  const currency = rows[0].currency ?? "eur";
  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross_cents,
      vat: acc.vat + r.vat_cents,
      fee: acc.fee + r.platform_fee_cents,
      share: acc.share + r.instructor_share_cents,
    }),
    { gross: 0, vat: 0, fee: 0, share: 0 }
  );
  const paidAt = rows.find((r) => r.paid_at)?.paid_at ?? null;
  const method =
    rows[0].paid_via === "stripe_connect" ? "Stripe payout" : "Bank transfer";

  // LS-SB/<year>/<month>/<instructor slug> when the batch follows the default
  // YYYY-MM naming; otherwise fall back to the raw batch label.
  const m = /^(\d{4})-(\d{2})$/.exec(batchId);
  const statementNumber = m
    ? `LS-SB/${m[1]}/${m[2]}/${instructor.slug}`
    : `LS-SB/${batchId}/${instructor.slug}`;

  const countryName =
    COUNTRIES.find((c) => c.code === billing?.country)?.name ??
    billing?.country ??
    "";
  const nip = process.env.ASTAPRIME_NIP;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Hide the site chrome when printing — the document below is the page. */}
      <style>{`@media print { nav, footer { display: none !important; } body { background: white !important; } }`}</style>

      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/instructor/earnings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Earnings
        </Link>
        <PrintButton />
      </div>

      <div className="mt-6 rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-10 print:mt-0 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Payout statement
            </h1>
            <p className="text-sm text-gray-500">
              Samofakturowanie · No. {statementNumber}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Period: {batchId}</p>
            {paidAt && (
              <p>Paid on {new Date(paidAt).toLocaleDateString("en-GB")}</p>
            )}
            <p>Method: {method}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Supplier (instructor)</p>
            <p className="text-gray-700">{billing?.legal_name ?? "—"}</p>
            {billing?.business_name && (
              <p className="text-gray-700">{billing.business_name}</p>
            )}
            {billing?.address_line && (
              <p className="text-gray-700">{billing.address_line}</p>
            )}
            <p className="text-gray-700">
              {[billing?.postal_code, billing?.city].filter(Boolean).join(" ")}
            </p>
            <p className="text-gray-700">{countryName}</p>
            {billing?.tin && <p className="text-gray-700">TIN: {billing.tin}</p>}
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-semibold text-gray-900">Recipient (platform)</p>
            <p className="text-gray-700">Astaprime Sp. z o.o.</p>
            <p className="text-gray-700">Poland</p>
            {nip && <p className="text-gray-700">NIP: {nip}</p>}
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-700">
          Instructor teaching services provided via the Lean Sporty platform,
          period {batchId}.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-900">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Item</th>
                <th className="py-2 pr-3 text-right font-semibold">
                  Student paid
                </th>
                <th className="py-2 pr-3 text-right font-semibold">VAT</th>
                <th className="py-2 pr-3 text-right font-semibold">
                  Platform fee
                </th>
                <th className="py-2 text-right font-semibold">Your share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3 text-gray-600">
                    {new Date(r.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">
                    {titleById.get(r.product_id ?? "") ?? "Class"}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-600">
                    {fmt(r.gross_cents, currency)}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-600">
                    {fmt(r.vat_cents, currency)}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-600">
                    {fmt(r.platform_fee_cents, currency)}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {fmt(r.instructor_share_cents, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold text-gray-900">
                <td className="py-2 pr-3" colSpan={2}>
                  Total
                </td>
                <td className="py-2 pr-3 text-right">
                  {fmt(totals.gross, currency)}
                </td>
                <td className="py-2 pr-3 text-right">
                  {fmt(totals.vat, currency)}
                </td>
                <td className="py-2 pr-3 text-right">
                  {fmt(totals.fee, currency)}
                </td>
                <td className="py-2 text-right">{fmt(totals.share, currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-sm font-medium text-gray-900">
          Amount paid to the supplier: {fmt(totals.share, currency)}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {vatTreatment(
            billing?.business_status ?? null,
            billing?.vat_number ?? null,
            billing?.country ?? ""
          )}{" "}
          VAT shown per line is the VAT on the student&apos;s purchase, remitted
          to the tax office by the platform as merchant of record.
        </p>

        <p className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500">
          Issued by the recipient on behalf of the supplier under the
          self-billing authorization in the Instructor Agreement §7. Objections
          within 14 days of receipt; otherwise the statement is deemed
          accepted.
        </p>
      </div>
    </div>
  );
}
