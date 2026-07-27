"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/**
 * Payout + tax details form (agreement §1/§7) — plain-English copy, most
 * instructors are non-native speakers. The country of tax residence drives the
 * one legal question we must ask: only Polish residents see the
 * registered-business question (it decides B2B vs unregistered-activity
 * handling); everyone else just enters bank + tax details. The server derives
 * the stored business_status from country + answer. Posts to
 * /api/instructor/billing (RLS-scoped upsert of the caller's own row).
 */

export type BillingInitial = {
  legal_name: string;
  business_name: string | null;
  business_status: string;
  tin: string;
  vat_number: string | null;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  iban: string;
  account_holder: string;
} | null;

export function PayoutDetailsForm({ initial }: { initial: BillingInitial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    legalName: initial?.legal_name ?? "",
    businessName: initial?.business_name ?? "",
    tin: initial?.tin ?? "",
    vatNumber: initial?.vat_number ?? "",
    addressLine: initial?.address_line ?? "",
    city: initial?.city ?? "",
    postalCode: initial?.postal_code ?? "",
    country: initial?.country ?? "",
    iban: initial?.iban ?? "",
    accountHolder: initial?.account_holder ?? "",
  });
  // Poland-only question, prefilled from a previously saved status.
  const [plRegisteredBusiness, setPlRegisteredBusiness] = useState<boolean | null>(
    initial?.business_status === "business"
      ? true
      : initial?.business_status === "unregistered_activity"
        ? false
        : null
  );
  const [unregisteredConfirmed, setUnregisteredConfirmed] = useState(
    initial?.business_status === "unregistered_activity"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isPoland = form.country.trim().toUpperCase() === "PL";

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/instructor/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plRegisteredBusiness: isPoland ? plRegisteredBusiness : null,
          unregisteredConfirmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save your details. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr,10rem]">
        <div className="space-y-1.5">
          <Label htmlFor="pd-legal-name">Your full legal name *</Label>
          <Input
            id="pd-legal-name"
            value={form.legalName}
            onChange={set("legalName")}
            maxLength={200}
            required
          />
          <p className="text-xs text-gray-500">
            As it appears on your ID and your bank account.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd-country">Country *</Label>
          <Input
            id="pd-country"
            value={form.country}
            onChange={set("country")}
            maxLength={2}
            placeholder="e.g. DE"
            required
          />
          <p className="text-xs text-gray-500">
            Where you pay taxes — 2-letter code.
          </p>
        </div>
      </div>

      {isPoland && (
        <div className="space-y-2">
          <Label>Do you have a registered business? *</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { v: true, label: "Yes, I run a registered business" },
              { v: false, label: "No, I teach on a small scale" },
            ].map((o) => (
              <label
                key={String(o.v)}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                  plRegisteredBusiness === o.v
                    ? "border-pink-400 bg-pink-50"
                    : "border-pink-100 bg-white hover:border-pink-200"
                }`}
              >
                <input
                  type="radio"
                  name="pl-business"
                  checked={plRegisteredBusiness === o.v}
                  onChange={() => setPlRegisteredBusiness(o.v)}
                  className="accent-pink-500"
                  required
                />
                <span className="font-medium text-gray-900">{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isPoland && plRegisteredBusiness === false && (
        <label className="flex items-start gap-3 rounded-2xl border border-pink-100 bg-pink-50/40 p-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={unregisteredConfirmed}
            onChange={(e) => setUnregisteredConfirmed(e.target.checked)}
            className="mt-0.5 accent-pink-500"
          />
          <span>
            I confirm I operate under the small-scale activity rules
            (działalność nierejestrowana), my revenue stays within the legal
            monthly limit, and I report this income myself in my annual tax
            return.
          </span>
        </label>
      )}

      {isPoland && plRegisteredBusiness === true && (
        <div className="space-y-1.5">
          <Label htmlFor="pd-business-name">Business name (if different)</Label>
          <Input
            id="pd-business-name"
            value={form.businessName}
            onChange={set("businessName")}
            maxLength={200}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pd-tin">Tax ID *</Label>
          <Input
            id="pd-tin"
            value={form.tin}
            onChange={set("tin")}
            maxLength={50}
            placeholder="Your country's tax number"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd-vat">VAT number (only if VAT-registered)</Label>
          <Input
            id="pd-vat"
            value={form.vatNumber}
            onChange={set("vatNumber")}
            maxLength={50}
            placeholder="Leave empty if not"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pd-address">Street address *</Label>
        <Input
          id="pd-address"
          value={form.addressLine}
          onChange={set("addressLine")}
          maxLength={300}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pd-city">City *</Label>
          <Input id="pd-city" value={form.city} onChange={set("city")} maxLength={100} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd-postal">Postal code *</Label>
          <Input
            id="pd-postal"
            value={form.postalCode}
            onChange={set("postalCode")}
            maxLength={20}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pd-iban">Bank account (IBAN) *</Label>
          <Input
            id="pd-iban"
            value={form.iban}
            onChange={set("iban")}
            maxLength={42}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd-holder">Account holder name *</Label>
          <Input
            id="pd-holder"
            value={form.accountHolder}
            onChange={set("accountHolder")}
            maxLength={200}
            required
          />
          <p className="text-xs text-gray-500">
            The account must be in your own name (or your business&apos;s).
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && (
        <Alert variant="success">
          Saved — you&apos;re all set for payouts. You can update these details
          any time.
        </Alert>
      )}

      <Button type="submit" variant="brand" disabled={saving}>
        {saving ? "Saving…" : "Save payout details"}
      </Button>
    </form>
  );
}
