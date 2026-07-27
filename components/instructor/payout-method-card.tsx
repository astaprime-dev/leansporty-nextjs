"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConnectOnboardingCard } from "@/components/instructor/connect-onboarding-card";
import { ManualPayoutCard } from "@/components/instructor/manual-payout-card";
import type { ConnectState } from "@/lib/connect-accounts";

/**
 * "How you get paid" — the first card on payout-details. Both payout options
 * are always visible so nothing depends invisibly on the chosen country:
 * Stripe (recommended, automatic) and bank transfer (manual monthly). Picking
 * an option reveals its flow below the tiles; validation (e.g. Stripe not
 * supporting a country) speaks up in plain English when the button is pressed.
 */
export function PayoutMethodCard({
  defaultMethod,
  connectState,
  initialIban,
  initialHolder,
}: {
  defaultMethod: "stripe" | "manual";
  connectState: ConnectState;
  initialIban: string | null;
  initialHolder: string | null;
}) {
  const [method, setMethod] = useState<"stripe" | "manual">(defaultMethod);

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
      done: !!initialIban,
      doneLabel: "Bank account on file",
    },
  ];

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-gray-900">How you get paid</h2>
      <p className="mt-1 text-sm text-gray-600">
        Choose how we send you your earnings (€20 minimum per payout — smaller
        balances roll over to the next month).
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.key}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
              method === o.key
                ? "border-pink-400 bg-pink-50"
                : "border-pink-100 bg-white hover:border-pink-200"
            }`}
          >
            <input
              type="radio"
              name="payout-method"
              checked={method === o.key}
              onChange={() => setMethod(o.key)}
              className="mt-1 accent-pink-500"
            />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{o.label}</span>
                {o.recommended && (
                  <Badge variant="brand">Recommended</Badge>
                )}
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
        ))}
      </div>

      <div className="mt-5">
        {method === "stripe" ? (
          <ConnectOnboardingCard state={connectState} />
        ) : (
          <ManualPayoutCard
            initialIban={initialIban}
            initialHolder={initialHolder}
          />
        )}
      </div>
    </div>
  );
}
