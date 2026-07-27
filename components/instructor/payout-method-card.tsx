"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConnectOnboardingCard } from "@/components/instructor/connect-onboarding-card";
import {
  PayoutDetailsForm,
  type BillingInitial,
} from "@/components/instructor/payout-details-form";
import { COUNTRIES } from "@/lib/countries";
import type { ConnectState } from "@/lib/connect-accounts";

/**
 * "How you get paid" — the single card on payout-details. Both payout options
 * are always visible; picking one opens ONE combined form for that path:
 *
 * - Via Stripe: tax details first (required before any payout), then straight
 *   on to Stripe's hosted onboarding for bank + identity.
 * - By bank transfer: tax details + bank account together, one save.
 *
 * The instructor's country is ONLY what they declare in the form's
 * country-of-tax-residence selector — never the browser, IP, or locale.
 * Stripe availability is enforced server-side with a plain-English message
 * when onboarding is attempted from an unsupported declared country.
 */
export function PayoutMethodCard({
  defaultMethod,
  connectState,
  initial,
}: {
  defaultMethod: "stripe" | "manual";
  connectState: ConnectState;
  initial: BillingInitial;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"stripe" | "manual">(defaultMethod);
  const [editing, setEditing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const countryName =
    COUNTRIES.find((c) => c.code === initial?.country)?.name ?? initial?.country;
  const bankOnFile = !!initial?.iban;
  const last4 = (initial?.iban ?? "").replace(/\s+/g, "").slice(-4);

  // After tax details are saved on the Stripe path, continue straight to
  // Stripe's hosted onboarding — one flow, no second step to find.
  const startStripeOnboarding = async () => {
    setStripeError(null);
    try {
      const res = await fetch("/api/instructor/connect/onboarding", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setStripeError(data.error ?? "Could not open Stripe. Please try again.");
        router.refresh();
        return;
      }
      window.location.href = data.url;
    } catch {
      setStripeError("Could not open Stripe. Please try again.");
      router.refresh();
    }
  };

  const options = [
    {
      key: "stripe" as const,
      label: "Via Stripe",
      recommended: true,
      description:
        "Automatic monthly payouts straight to your bank. Available in the EU/EEA countries, the UK, Switzerland, the US, and Canada.",
      done: connectState === "active",
      doneLabel: "Active",
    },
    {
      key: "manual" as const,
      label: "By bank transfer",
      recommended: false,
      description:
        "For countries where Stripe payouts aren't available — we send your earnings to your bank account manually once a month.",
      done: bankOnFile,
      doneLabel: "Bank account added",
    },
  ];

  const stripeContent =
    !initial || editing ? (
            <div className="space-y-4">
              {!initial && (
                <p className="text-sm text-gray-600">
                  First, your details for tax reporting — required before any
                  payout. Save them and you&apos;ll continue on Stripe&apos;s
                  secure page to add your bank account and confirm your
                  identity (about 5 minutes).
                </p>
              )}
              <PayoutDetailsForm
                initial={initial}
                includeBank={false}
                submitLabel={
                  initial ? "Save details" : "Save and continue to Stripe"
                }
                onSaved={async () => {
                  if (initial) {
                    setEditing(false);
                    router.refresh();
                  } else {
                    await startStripeOnboarding();
                  }
                }}
                onCancel={initial ? () => setEditing(false) : undefined}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <ConnectOnboardingCard state={connectState} />
              <p className="text-sm text-gray-500">
                Your tax details are saved ({initial.legal_name}, {countryName}
                ).{" "}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="font-medium text-pink-600 underline underline-offset-2 transition-colors hover:text-pink-500"
                >
                  Update
                </button>
              </p>
            </div>
          );

  const manualContent =
    initial && bankOnFile && !editing ? (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          We send your earnings to{" "}
          <span className="font-mono">•••• {last4}</span> (
          {initial.account_holder}) once a month. Your tax details are saved (
          {initial.legal_name}, {countryName}).
        </p>
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          Update details
        </Button>
      </div>
    ) : (
      <div className="space-y-4">
        {!(initial && bankOnFile) && (
          <p className="text-sm text-gray-600">
            Your bank account and your details for tax reporting — one form,
            required before your first payout (about 3 minutes).
          </p>
        )}
        <PayoutDetailsForm
          initial={initial}
          includeBank
          submitLabel="Save payout details"
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
          onCancel={initial && bankOnFile ? () => setEditing(false) : undefined}
        />
      </div>
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
                onChange={() => {
                  setMethod(o.key);
                  setEditing(false);
                  setStripeError(null);
                }}
                className="mt-1.5 accent-pink-500"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {o.label}
                  </span>
                  {o.recommended && <Badge variant="brand">Recommended</Badge>}
                  {o.done && (
                    <Badge variant="free" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {o.doneLabel}
                    </Badge>
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
