"use client";

import { instructorShare } from "@/lib/instructor-share";

/**
 * Live "you receive ≈€X per sale" line under a price input, so an instructor
 * sees what a price actually pays before saving it (the price itself is what
 * the student pays, VAT included). Renders nothing for free/empty/invalid
 * prices.
 */
export function EarnPreview({ priceEuros }: { priceEuros: string | number }) {
  const price =
    typeof priceEuros === "string"
      ? Number(priceEuros.replace(",", "."))
      : priceEuros;
  if (!Number.isFinite(price) || price <= 0) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);

  return (
    <p className="text-xs font-medium text-pink-600">
      Students pay {fmt(price)} — you receive about{" "}
      {fmt(instructorShare(price, 80))} per sale (
      {fmt(instructorShare(price, 85))} as a featured instructor).
    </p>
  );
}
