"use client";

import { useState } from "react";

/**
 * Interactive "your numbers" calculator for /teach. Pure arithmetic on the
 * prices the instructor sets — the split minus the ~€1.50 minimum fee on
 * small prices, identical to the worked-example table above it. Deliberately
 * NOT an income projection: the fine print says so, the defaults mirror the
 * table's scale, and the standard 85% tier is the default (featured is a
 * conscious upgrade tap).
 */

const FEE_FLOOR = 1.5;

function share(price: number, split: number): number {
  if (price <= 0) return 0;
  return Math.max(price - Math.max(price * (1 - split), FEE_FLOOR), 0);
}

function fmtWhole(n: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtCents(n: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function Row({
  label,
  value,
  display,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold tabular-nums text-gray-900">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-1 w-full accent-pink-500"
        aria-label={label}
      />
    </label>
  );
}

export function EarningsCalculator() {
  const [featured, setFeatured] = useState(false);
  const [seatPrice, setSeatPrice] = useState(12);
  const [seats, setSeats] = useState(15);
  const [classesPerMonth, setClassesPerMonth] = useState(4);
  const [programPrice, setProgramPrice] = useState(49);
  const [programSales, setProgramSales] = useState(5);

  const split = featured ? 0.9 : 0.85;
  const seatShare = share(seatPrice, split);
  const programShare = share(programPrice, split);
  const monthly =
    seats * classesPerMonth * seatShare + programSales * programShare;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
      <div className="grid md:grid-cols-[3fr,2fr]">
        {/* Inputs */}
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Try your own numbers
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag the sliders — same math as the table above.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              Live classes
            </p>
            <Row
              label="Price per seat"
              value={seatPrice}
              display={`€${seatPrice}`}
              min={5}
              max={49}
              onChange={setSeatPrice}
            />
            <Row
              label="People per class"
              value={seats}
              display={`${seats}`}
              min={1}
              max={50}
              onChange={setSeats}
            />
            <Row
              label="Classes per month"
              value={classesPerMonth}
              display={`${classesPerMonth}`}
              min={0}
              max={12}
              onChange={setClassesPerMonth}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              Programs
            </p>
            <Row
              label="Program price"
              value={programPrice}
              display={`€${programPrice}`}
              min={19}
              max={99}
              onChange={setProgramPrice}
            />
            <Row
              label="Program sales per month"
              value={programSales}
              display={`${programSales}`}
              min={0}
              max={30}
              onChange={setProgramSales}
            />
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center gap-4 bg-gradient-to-br from-pink-500 to-rose-400 p-6 text-white sm:p-8">
          <div className="flex gap-2" role="group" aria-label="Your share tier">
            <button
              type="button"
              onClick={() => setFeatured(false)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                !featured
                  ? "bg-white text-pink-600"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Standard 85%
            </button>
            <button
              type="button"
              onClick={() => setFeatured(true)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                featured
                  ? "bg-white text-pink-600"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Featured 90%
            </button>
          </div>

          <div>
            <p className="text-sm text-pink-100">Your share, every month</p>
            <p className="mt-1 text-5xl font-semibold tabular-nums">
              ≈ {fmtWhole(monthly)}
            </p>
          </div>

          <p className="text-sm text-pink-100">
            {fmtCents(seatShare)} per seat · {fmtCents(programShare)} per
            program sale — paid monthly by bank transfer.
          </p>
        </div>
      </div>

      <p className="border-t border-pink-50 bg-pink-50/40 px-6 py-3 text-xs text-muted-foreground sm:px-8">
        Simple arithmetic on prices you set: your share minus the ~€1.50
        minimum fee on small prices, nothing hidden. It&apos;s math, not an
        income promise — how many people show up is your superpower, not ours.
        Earnings are before your own taxes.
      </p>
    </div>
  );
}
