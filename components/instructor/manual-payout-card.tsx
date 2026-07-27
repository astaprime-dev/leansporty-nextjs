"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/**
 * The bank-transfer option inside the "How you get paid" card
 * (payout-method-card) — the manual rail. The bank form stays collapsed
 * behind one button so the page reads as a single clear step. Saves via POST
 * /api/instructor/billing with bankOnly (updates only the bank columns of the
 * instructor's existing row).
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
    <div>
      <p className="text-sm text-gray-600">
        We send your earnings straight to your bank account once a month. Add
        the account you want to be paid to — you can change it at any time.
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
