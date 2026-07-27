"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { COUNTRIES, isEUCountry } from "@/lib/countries";
import { isConnectSupportedCountry } from "@/lib/payout-regions";

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
  iban: string | null;
  account_holder: string | null;
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
  // Bank details never live in this form: Connect-supported countries add
  // their bank account on Stripe's hosted onboarding, everyone else in the
  // "Payouts by bank transfer" card — both appear above once details are saved.
  const connectCountry = isConnectSupportedCountry(form.country);

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
      <div className="grid gap-4 sm:grid-cols-[1fr,14rem]">
        <div className="space-y-1.5">
          <Label htmlFor="pd-legal-name">Full legal name *</Label>
          <Input
            id="pd-legal-name"
            value={form.legalName}
            onChange={set("legalName")}
            maxLength={200}
            required
          />
          <p className="text-xs text-gray-500">
            Must match your identity document and your bank account.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd-country">Country *</Label>
          <select
            id="pd-country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="" disabled>
              Choose…
            </option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Country of tax residence.</p>
        </div>
      </div>

      {isPoland && (
        <div className="space-y-2">
          <Label>Business status *</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { v: true, label: "Registered business activity" },
              { v: false, label: "Unregistered activity (działalność nierejestrowana)" },
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

      {/* Shown unless the PL small-scale tier is chosen (no business to name).
          Foreign instructors may well operate as a company — the statements
          should carry its name. */}
      {!(isPoland && plRegisteredBusiness === false) && (
        <div className="space-y-1.5">
          <Label htmlFor="pd-business-name">
            Business / company name (optional)
          </Label>
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
          <Label htmlFor="pd-tin">
            Tax identification number (TIN){isEUCountry(form.country) ? " *" : ""}
          </Label>
          <Input
            id="pd-tin"
            value={form.tin}
            onChange={set("tin")}
            maxLength={50}
            placeholder="e.g. NIP, Steuernummer, NIF"
            required={isEUCountry(form.country)}
          />
          {!isEUCountry(form.country) && form.country !== "" && (
            <p className="text-xs text-gray-500">
              Optional outside the EU (EU platform reporting does not apply).
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd-vat">VAT number (if VAT-registered)</Label>
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

      {form.country !== "" && (
        <p className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4 text-sm text-gray-600">
          {connectCountry ? (
            <>
              Your bank account is added on Stripe&apos;s secure page — see
              &ldquo;Payouts via Stripe&rdquo; above. No bank details are
              needed here.
            </>
          ) : (
            <>
              Payouts via Stripe are available in the EU/EEA, the UK,
              Switzerland, the US, and Canada. In your country we pay by bank
              transfer instead — after saving, add your bank account in the
              &ldquo;Payouts by bank transfer&rdquo; section above.
            </>
          )}
        </p>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {saved && (
        <Alert variant="success">
          Saved. Your payout details are on file — you can update them at any
          time.
        </Alert>
      )}

      <Button type="submit" variant="brand" disabled={saving}>
        {saving ? "Saving…" : "Save payout details"}
      </Button>
    </form>
  );
}
