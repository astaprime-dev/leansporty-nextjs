import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Wallet, Clock, CheckCircle2, CalendarDays } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";

function fmt(cents: number, currency = "eur") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function InstructorEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/instructor/earnings");

  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructorProfile) redirect("/instructor/profile");

  // Own payout rows (RLS scopes to this instructor).
  const { data: payouts } = await supabase
    .from("instructor_payouts")
    .select(
      "product_id, gross_cents, currency, instructor_share_cents, status, created_at"
    )
    .eq("instructor_id", instructorProfile.id)
    .order("created_at", { ascending: false });

  const rows = payouts ?? [];
  const currency = rows[0]?.currency ?? "eur";

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totals = {
    lifetime: 0,
    thisMonth: 0,
    pending: 0,
    paid: 0,
  };
  for (const r of rows) {
    totals.lifetime += r.instructor_share_cents;
    if (new Date(r.created_at) >= startOfMonth) totals.thisMonth += r.instructor_share_cents;
    if (r.status === "paid") totals.paid += r.instructor_share_cents;
    else totals.pending += r.instructor_share_cents;
  }

  // Per-class breakdown (title merged from products — public catalog read).
  const productIds = Array.from(new Set(rows.map((r) => r.product_id).filter((x): x is string => !!x)));
  const titleById = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, title")
      .in("id", productIds);
    for (const p of products ?? []) titleById.set(p.id, p.title);
  }
  const byClass = new Map<
    string,
    { title: string; sales: number; gross: number; share: number; pending: number }
  >();
  for (const r of rows) {
    const key = r.product_id ?? "unknown";
    const entry =
      byClass.get(key) ??
      { title: titleById.get(key) ?? "Class", sales: 0, gross: 0, share: 0, pending: 0 };
    entry.sales += 1;
    entry.gross += r.gross_cents;
    entry.share += r.instructor_share_cents;
    if (r.status !== "paid") entry.pending += r.instructor_share_cents;
    byClass.set(key, entry);
  }
  const classRows = Array.from(byClass.values()).sort((a, b) => b.share - a.share);

  const tiles = [
    { label: "This month", value: totals.thisMonth, icon: CalendarDays },
    { label: "Lifetime", value: totals.lifetime, icon: Wallet },
    { label: "Pending payout", value: totals.pending, icon: Clock },
    { label: "Paid out", value: totals.paid, icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Your share of every paid class, and what&apos;s owed to you.</p>
      </div>

      <Alert variant="info" className="mb-8">
        <p className="text-sm">
          You keep your agreed share of every sale (85%, or 90% as a featured instructor).
          Pending amounts are paid to your bank on a regular schedule.
        </p>
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-pink-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <t.icon className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmt(t.value, currency)}</p>
            <h3 className="text-sm font-semibold text-gray-600 mt-1">{t.label}</h3>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">By class</h2>
      {classRows.length === 0 ? (
        <EmptyState
          title="No earnings yet"
          description="Set a price on a class, and your sales will show up here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-100 bg-pink-50/60 text-left">
                <th className="p-4 font-semibold text-gray-900">Class</th>
                <th className="p-4 font-semibold text-gray-900">Sales</th>
                <th className="p-4 font-semibold text-gray-900">Gross</th>
                <th className="p-4 font-semibold text-gray-900">Your share</th>
                <th className="p-4 font-semibold text-gray-900">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {classRows.map((c, i) => (
                <tr key={i}>
                  <td className="p-4 text-gray-900">{c.title}</td>
                  <td className="p-4 text-gray-600">{c.sales}</td>
                  <td className="p-4 text-gray-600">{fmt(c.gross, currency)}</td>
                  <td className="p-4 font-semibold text-gray-900">{fmt(c.share, currency)}</td>
                  <td className="p-4 text-gray-600">{fmt(c.pending, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
