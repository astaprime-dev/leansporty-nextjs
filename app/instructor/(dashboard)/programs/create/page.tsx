"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { EarnPreview } from "@/components/instructor/earn-preview";

/**
 * Create a DRAFT program: title, price, structure. Everything else (lessons,
 * description, cover, publishing) happens on the manage page it redirects to.
 * Copy is deliberately plain — instructors are often non-native speakers.
 */
export default function CreateProgramPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("29");
  const [structure, setStructure] = useState<"list" | "days">("list");
  const [lengthDays, setLengthDays] = useState("21");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceCents = Math.round(Number(price.replace(",", ".")) * 100);
    if (!Number.isFinite(priceCents)) {
      setError("Please enter a valid price.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/instructor/programs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priceCents,
          structure,
          ...(structure === "days" ? { programLengthDays: Number(lengthDays) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/instructor/programs/${data.programId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/instructor/programs"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-pink-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Programs
      </Link>

      <h1 className="text-3xl font-display font-light text-gray-900 mb-2">
        Create a Program
      </h1>
      {/* Cap numbers mirror PROGRAM_CAPS (lib/programs.ts is server-only —
          keep these in sync by hand). */}
      <p className="text-gray-600 mb-8">
        A program is a set of videos your students buy once and follow at their
        own pace. You add the videos in the next step — up to 30 lessons of 45
        minutes each, and up to 3 programs in total.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Program name</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 4-Week Dance Sculpt"
            maxLength={255}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (€)</Label>
          <Input
            id="price"
            type="number"
            min="19"
            max="500"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <EarnPreview priceEuros={price} />
          <p className="text-sm text-gray-500">
            Between €19 and €500. You keep 80% of every sale after VAT (85% as
            a featured instructor), same as with paid classes.
          </p>
        </div>

        <div className="space-y-2">
          <Label>How should lessons be organized?</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStructure("list")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                structure === "list"
                  ? "border-pink-400 bg-pink-50"
                  : "border-pink-100 bg-white hover:border-pink-200"
              }`}
            >
              <p className="font-medium text-gray-900">Simple list</p>
              <p className="text-sm text-gray-600 mt-1">
                Lessons in order. Students watch them any way they like.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setStructure("days")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                structure === "days"
                  ? "border-pink-400 bg-pink-50"
                  : "border-pink-100 bg-white hover:border-pink-200"
              }`}
            >
              <p className="font-medium text-gray-900">Day-by-day plan</p>
              <p className="text-sm text-gray-600 mt-1">
                Each lesson gets a day, like a &quot;21-day challenge&quot;. Rest
                days allowed.
              </p>
            </button>
          </div>
        </div>

        {structure === "days" && (
          <div className="space-y-2">
            <Label htmlFor="lengthDays">Program length (days)</Label>
            <Input
              id="lengthDays"
              type="number"
              min="1"
              max="90"
              value={lengthDays}
              onChange={(e) => setLengthDays(e.target.value)}
              required
            />
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <Button type="submit" variant="brand" disabled={submitting || !title.trim()}>
          {submitting ? "Creating…" : "Create Program"}
        </Button>
      </form>
    </div>
  );
}
