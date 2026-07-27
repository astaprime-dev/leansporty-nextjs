"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type {
  PayoutPreview,
  PayoutPreviewInstructor,
  PayoutRunResult,
} from "@/lib/payouts";

function fmt(cents: number, currency = "eur") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * The founder's payout console (see app/admin/payouts). Preview → run the
 * Stripe rail → mark manual-rail instructors paid one by one. All writes go
 * through the admin API routes; this component only renders their results.
 */
export function PayoutRunPanel() {
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<PayoutRunResult | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [marked, setMarked] = useState<Record<string, string>>({});

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts/preview");
      if (!res.ok) throw new Error(`Preview failed (${res.status})`);
      setPreview(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const stripeRows =
    preview?.instructors.filter((i) => i.rail === "stripe_connect") ?? [];
  const manualRows =
    preview?.instructors.filter((i) => i.rail === "manual") ?? [];
  const stripeEligible = stripeRows.filter((i) => i.eligible);

  const runStripe = async () => {
    const total = stripeEligible.reduce((s, i) => s + i.pendingCents, 0);
    if (
      !window.confirm(
        `Send ${fmt(total)} to ${stripeEligible.length} instructor(s) via Stripe (batch ${batchId})?`
      )
    ) {
      return;
    }
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/payouts/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      if (!res.ok) throw new Error(`Run failed (${res.status})`);
      setRunResult(await res.json());
      await loadPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const markPaid = async (i: PayoutPreviewInstructor) => {
    if (
      !window.confirm(
        `Mark ${fmt(i.pendingCents, i.currency)} as PAID to ${i.displayName} (batch ${batchId})? Only do this after the money has actually been sent.`
      )
    ) {
      return;
    }
    setMarking(i.instructorId);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId: i.instructorId, batchId }),
      });
      if (!res.ok) throw new Error(`Mark-paid failed (${res.status})`);
      const data = await res.json();
      setMarked((m) => ({
        ...m,
        [i.instructorId]: `${data.rowsPaid} sale(s), ${fmt(data.totalCents, i.currency)}`,
      }));
      await loadPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mark-paid failed");
    } finally {
      setMarking(null);
    }
  };

  if (loading && !preview) {
    return <p className="text-gray-500">Loading pending balances…</p>;
  }

  return (
    <div className="space-y-8">
      {error && <Alert variant="error">{error}</Alert>}

      {preview && preview.reversalFailedTotal > 0 && (
        <Alert variant="warning">
          {preview.reversalFailedTotal} refunded sale(s) were already paid out
          and need manual reconciliation (net the amount from the instructor’s
          next payout or recover it directly). Rows are marked
          `reversal_failed` in the ledger.
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="batch-id">Batch</Label>
          <Input
            id="batch-id"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-40"
            maxLength={40}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={loadPreview}
          disabled={loading}
        >
          <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Stripe rail{" "}
            <span className="text-sm font-normal text-gray-500">
              (automatic transfers)
            </span>
          </h2>
          <Button
            type="button"
            variant="brand"
            onClick={runStripe}
            disabled={running || stripeEligible.length === 0}
          >
            {running
              ? "Sending transfers…"
              : `Run payouts (${stripeEligible.length})`}
          </Button>
        </div>
        {stripeRows.length === 0 ? (
          <p className="text-sm text-gray-500">
            No pending balances on the Stripe rail.
          </p>
        ) : (
          <PreviewTable rows={stripeRows} />
        )}
      </section>

      {runResult && (
        <Alert
          variant={
            runResult.instructors.some((i) => i.errors.length > 0)
              ? "warning"
              : "success"
          }
        >
          <p className="font-semibold mb-1">Batch {runResult.batchId} sent</p>
          <ul className="text-sm space-y-0.5">
            {runResult.instructors.length === 0 && (
              <li>Nothing to transfer (all under €20 or already paid).</li>
            )}
            {runResult.instructors.map((i) => (
              <li key={i.instructorId}>
                {i.displayName}: {fmt(i.transferredCents)} across {i.rowsPaid}{" "}
                sale(s)
                {i.errors.length > 0 && (
                  <span className="text-red-700">
                    {" "}
                    — {i.errors.length} error(s): {i.errors.join("; ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Manual rail{" "}
          <span className="text-sm font-normal text-gray-500">
            (send via Wise/SEPA, then mark paid)
          </span>
        </h2>
        {manualRows.length === 0 ? (
          <p className="text-sm text-gray-500">
            No pending balances on the manual rail.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-pink-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pink-100 bg-pink-50/60 text-left">
                  <th className="p-4 font-semibold text-gray-900">Instructor</th>
                  <th className="p-4 font-semibold text-gray-900">Pending</th>
                  <th className="p-4 font-semibold text-gray-900">Bank details</th>
                  <th className="p-4 font-semibold text-gray-900">Status</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {manualRows.map((i) => (
                  <tr key={i.instructorId}>
                    <td className="p-4 text-gray-900">{i.displayName}</td>
                    <td className="p-4 font-semibold text-gray-900">
                      {fmt(i.pendingCents, i.currency)}
                      <span className="block text-xs font-normal text-gray-500">
                        {i.salesCount} sale(s)
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {i.bank?.iban ? (
                        <>
                          <span className="font-mono text-xs">{i.bank.iban}</span>
                          <span className="block text-xs">
                            {i.bank.accountHolder} · {i.bank.country}
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600">No bank details</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {marked[i.instructorId] ? (
                        <Badge variant="free">Paid: {marked[i.instructorId]}</Badge>
                      ) : (
                        i.railNote
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => markPaid(i)}
                        disabled={
                          marking === i.instructorId || !i.eligible || !!marked[i.instructorId]
                        }
                      >
                        {marking === i.instructorId ? "Marking…" : "Mark paid"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PreviewTable({ rows }: { rows: PayoutPreviewInstructor[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-pink-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pink-100 bg-pink-50/60 text-left">
            <th className="p-4 font-semibold text-gray-900">Instructor</th>
            <th className="p-4 font-semibold text-gray-900">Sales</th>
            <th className="p-4 font-semibold text-gray-900">Pending</th>
            <th className="p-4 font-semibold text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pink-50">
          {rows.map((i) => (
            <tr key={i.instructorId} className={i.eligible ? "" : "opacity-60"}>
              <td className="p-4 text-gray-900">{i.displayName}</td>
              <td className="p-4 text-gray-600">{i.salesCount}</td>
              <td className="p-4 font-semibold text-gray-900">
                {fmt(i.pendingCents, i.currency)}
              </td>
              <td className="p-4 text-gray-600">
                {i.eligible ? (
                  <Badge variant="free">Ready</Badge>
                ) : (
                  i.railNote
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
