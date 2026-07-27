"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

/**
 * "Payouts by bank transfer" card — the manual-rail counterpart of the
 * ConnectOnboardingCard, shown on payout-details when the instructor's country
 * isn't reachable by Stripe payouts. Same card look and feel; the bank form
 * stays collapsed behind one button so the page reads as a single clear step.
 * Saves via POST /api/instructor/billing with bankOnly (updates only the bank
 * columns of the instructor's existing row).
 */
export function ManualPayoutCard({
  initialIban,
  initialHolder,
}: {
  initialIban: string | null;
  initialHolder: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [iban, setIban] = useState(initialIban ?? "");
  const [ibanConfirm, setIbanConfirm] = useState("");
  const [holder, setHolder] = useState(initialHolder ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasBank = !!initialIban;
  const normIban = (v: string) => v.replace(/\s+/g, "").toUpperCase();
  const ibanChanged = normIban(iban) !== normIban(initialIban ?? "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ibanChanged && normIban(ibanConfirm) !== normIban(iban)) {
      setError("The IBAN entries do not match — re-enter the IBAN to confirm it.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/instructor/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankOnly: true, iban, accountHolder: holder }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save your bank account. Please try again.");
        return;
      }
      setSaved(true);
      setExpanded(false);
      router.refresh();
    } catch {
      setError("Could not save your bank account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Payouts by bank transfer
        </h2>
        {hasBank && !expanded && (
          <Badge variant="free" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Bank account on file
          </Badge>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        Payouts via Stripe aren&apos;t available in your country yet — Stripe
        supports the EU/EEA countries, the United Kingdom, Switzerland, the
        United States, and Canada. Instead, we send your earnings straight to
        your bank account once a month (€20 minimum — smaller balances roll
        over to the next month).
      </p>

      {!expanded && (
        <div className="mt-4 space-y-3">
          {hasBank && (
            <p className="text-sm text-gray-600">
              Payouts go to{" "}
              <span className="font-mono">
                •••• {normIban(initialIban ?? "").slice(-4)}
              </span>{" "}
              ({initialHolder}).
            </p>
          )}
          {saved && (
            <Alert variant="success">
              Saved. Your payouts will go to this bank account.
            </Alert>
          )}
          <Button
            type="button"
            variant={hasBank ? "outline" : "brand"}
            onClick={() => {
              setExpanded(true);
              setSaved(false);
            }}
          >
            {hasBank ? "Update bank account" : "Add bank account"}
          </Button>
        </div>
      )}

      {expanded && (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mp-iban">IBAN *</Label>
              <Input
                id="mp-iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                maxLength={42}
                required
              />
              <p className="text-xs text-gray-500">
                Payouts are transferred to this account — verify it carefully.
              </p>
            </div>
            {ibanChanged && (
              <div className="space-y-1.5">
                <Label htmlFor="mp-iban-confirm">Confirm IBAN *</Label>
                <Input
                  id="mp-iban-confirm"
                  value={ibanConfirm}
                  onChange={(e) => setIbanConfirm(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  autoComplete="off"
                  maxLength={42}
                  required
                />
                <p className="text-xs text-gray-500">
                  Re-enter manually — pasting is disabled in this field.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="mp-holder">Account holder name *</Label>
              <Input
                id="mp-holder"
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-500">
                The account must be held in your legal name or your business&apos;s name.
              </p>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3">
            <Button type="submit" variant="brand" disabled={saving}>
              {saving ? "Saving…" : "Save bank account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setExpanded(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
