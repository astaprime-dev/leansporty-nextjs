"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ConnectOnboardingCard } from "@/components/instructor/connect-onboarding-card";
import {
  PayoutDetailsForm,
  type BillingInitial,
} from "@/components/instructor/payout-details-form";
import { COUNTRIES } from "@/lib/countries";
import { isConnectSupportedCountry } from "@/lib/payout-regions";
import type { ConnectState } from "@/lib/connect-accounts";

/**
 * "How you get paid" — the two payout options as stacked cards; the selected
 * one expands in place. Clicking a tile IS the choice (persisted immediately,
 * no save button); the "Used for your payouts" badge marks the method the
 * payout run would actually use.
 *
 * Via Stripe: one country dropdown, then everything (identity, address, bank)
 * happens on Stripe's hosted page — we ask for nothing Stripe already
 * collects. By bank transfer: one combined form (bank + details for the
 * payout paperwork). Country is ONLY the declared tax residence — never
 * browser/IP.
 */
export function PayoutMethodCard({
  defaultMethod,
  activeMethod,
  connectState,
  initial,
}: {
  defaultMethod: "stripe" | "manual";
  /** Which method the payout run would actually use right now (null = none ready). */
  activeMethod: "stripe" | "manual" | null;
  connectState: ConnectState;
  initial: BillingInitial;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"stripe" | "manual">(defaultMethod);
  const [editing, setEditing] = useState(false);
  const [country, setCountry] = useState("");
  const [starting, setStarting] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const bankOnFile = !!initial?.iban;
  const last4 = (initial?.iban ?? "").replace(/\s+/g, "").slice(-4);
  const countryName =
    COUNTRIES.find((c) => c.code === initial?.country)?.name ?? initial?.country;

  // Opening a card is just looking — it never changes how payouts are sent.
  // The method switches only when the instructor COMPLETES something (finishes
  // Stripe onboarding / saves a bank account) or presses an explicit
  // "Use … for my payouts" button below.
  const selectMethod = (key: "stripe" | "manual") => {
    setMethod(key);
    setEditing(false);
    setStripeError(null);
  };

  const [switching, setSwitching] = useState(false);
  const switchTo = async (key: "stripe" | "manual") => {
    setSwitching(true);
    try {
      await fetch("/api/instructor/payout-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: key }),
      });
      router.refresh();
    } finally {
      setSwitching(false);
    }
  };

  // First-time Stripe setup: declared country → straight to hosted onboarding.
  const startStripeOnboarding = async () => {
    setStarting(true);
    setStripeError(null);
    try {
      const res = await fetch("/api/instructor/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setStripeError(data.error ?? "Could not open Stripe. Please try again.");
        setStarting(false);
        router.refresh();
        return;
      }
      window.location.href = data.url;
    } catch {
      setStripeError("Could not open Stripe. Please try again.");
      setStarting(false);
    }
  };

  const options = [
    {
      key: "stripe" as const,
      label: "Via Stripe",
      recommended: true,
      description:
        "Automatic monthly payouts straight to your bank, through your own free Stripe account. Available in the EU/EEA countries, the UK, Switzerland, the US, and Canada.",
      done: connectState === "active",
      doneLabel: "Active",
    },
    {
      key: "manual" as const,
      label: "By bank transfer",
      recommended: false,
      description:
        "We send your earnings to your bank account manually once a month — for countries where Stripe isn't available, or if you'd rather skip Stripe.",
      done: bankOnFile,
      doneLabel: "Bank account added",
    },
  ];

  const stripeFirstTime = !initial && connectState === "not_started";

  const chosenCountrySupported = !country || isConnectSupportedCountry(country);
  const chosenCountryName =
    COUNTRIES.find((c) => c.code === country)?.name ?? country;
  const savedCountryUnsupported =
    !!initial &&
    connectState === "not_started" &&
    !isConnectSupportedCountry(initial.country);

  const stripeContent = stripeFirstTime ? (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Everything happens on Stripe&apos;s secure page — your identity,
        address, and bank account (about 5 minutes). We only need your country
        of tax residence to start.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pm-country">Country of tax residence *</Label>
          <select
            id="pm-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex h-10 w-56 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        </div>
        <Button
          type="button"
          variant="brand"
          disabled={!country || !chosenCountrySupported || starting}
          onClick={startStripeOnboarding}
        >
          {starting ? "Opening Stripe…" : "Continue to Stripe"}
          {!starting && <ExternalLink className="ml-1.5 h-4 w-4" />}
        </Button>
      </div>
      {!chosenCountrySupported && (
        <Alert variant="warning">
          Stripe payouts aren&apos;t available in {chosenCountryName} yet.
          Choose &ldquo;By bank transfer&rdquo; below instead — we&apos;ll send
          your earnings to your bank account manually.
        </Alert>
      )}
    </div>
  ) : savedCountryUnsupported ? (
    <Alert variant="warning">
      Stripe payouts aren&apos;t available in {countryName} yet. Choose
      &ldquo;By bank transfer&rdquo; below instead — we&apos;ll send your
      earnings to your bank account manually.
    </Alert>
  ) : connectState === "active" && activeMethod === "manual" ? (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Your Stripe account is ready, but your payouts currently go by bank
        transfer.
      </p>
      <Button
        type="button"
        variant="brand"
        disabled={switching}
        onClick={() => switchTo("stripe")}
      >
        {switching ? "Switching…" : "Use Stripe for my payouts"}
      </Button>
    </div>
  ) : (
    <div className="space-y-3">
      {initial && (
        <p className="text-sm text-gray-500">
          Payout account country: {countryName}.
        </p>
      )}
      {activeMethod === "manual" && connectState !== "active" && (
        <p className="text-sm text-gray-600">
          Your payouts go by bank transfer for now — they&apos;ll switch to
          Stripe when you finish this setup.
        </p>
      )}
      <ConnectOnboardingCard state={connectState} />
    </div>
  );

  const manualContent = !editing ? (
    <div className="space-y-4">
      {bankOnFile && initial ? (
        activeMethod === "stripe" ? (
          <p className="text-sm text-gray-600">
            Your bank account <span className="font-mono">•••• {last4}</span>{" "}
            is saved, but your payouts currently go through Stripe.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            We send your earnings to{" "}
            <span className="font-mono">•••• {last4}</span> (
            {initial.account_holder}) once a month.
          </p>
        )
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Your bank account and the details we need for the payout paperwork
            — one form, about 3 minutes.
          </p>
          {activeMethod === "stripe" && (
            <p className="text-sm text-gray-600">
              Your payouts currently go through Stripe. If you save a bank
              account here, we&apos;ll switch to bank transfers.
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3">
        {bankOnFile && activeMethod === "stripe" && (
          <Button
            type="button"
            variant="brand"
            disabled={switching}
            onClick={() => switchTo("manual")}
          >
            {switching ? "Switching…" : "Use bank transfer for my payouts"}
          </Button>
        )}
        <Button
          type="button"
          variant={bankOnFile ? "outline" : "brand"}
          onClick={() => setEditing(true)}
        >
          {bankOnFile ? "Update details" : "Add bank account"}
        </Button>
      </div>
    </div>
  ) : (
    <PayoutDetailsForm
      initial={initial}
      submitLabel="Save payout details"
      onSaved={() => {
        setEditing(false);
        router.refresh();
      }}
      onCancel={() => setEditing(false)}
    />
  );

  return (
    <div className="space-y-4">
      {options.map((o) => {
        const selected = method === o.key;
        return (
          <div
            key={o.key}
            className={`rounded-2xl border bg-white p-6 shadow-sm transition-all sm:p-8 ${
              selected ? "border-pink-400" : "border-pink-100 hover:border-pink-200"
            }`}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="payout-method"
                checked={selected}
                onChange={() => selectMethod(o.key)}
                className="mt-1.5 accent-pink-500"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {o.label}
                  </span>
                  {o.recommended && <Badge variant="brand">Recommended</Badge>}
                  {activeMethod === o.key ? (
                    <Badge variant="free" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Used for your payouts
                    </Badge>
                  ) : (
                    o.done && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {o.doneLabel}
                      </Badge>
                    )
                  )}
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  {o.description}
                </span>
              </span>
            </label>

            {selected && (
              <div className="mt-5 sm:pl-7">
                {o.key === "stripe" ? stripeContent : manualContent}
                {o.key === "stripe" && stripeError && (
                  <div className="mt-4">
                    <Alert variant="error">{stripeError}</Alert>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
