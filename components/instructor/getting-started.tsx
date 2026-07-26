import Link from "next/link";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/instructor/copy-link-button";

/**
 * First-run checklist on the Studio dashboard. All state is DERIVED from data
 * (profile fields, classes, programs) — nothing stored, so it can never lie.
 * The share row is a permanent affordance, not a tracked step: sharing again
 * is always the right move.
 */

function StepCircle({ done, n }: { done: boolean; n: number }) {
  return done ? (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
      <Check className="h-4 w-4" strokeWidth={3} />
    </div>
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-sm font-semibold text-white">
      {n}
    </div>
  );
}

export function GettingStarted({
  profileDone,
  createdSomething,
  taughtSomething,
  slug,
}: {
  profileDone: boolean;
  createdSomething: boolean;
  taughtSomething: boolean;
  slug: string;
}) {
  const doneCount = [profileDone, createdSomething, taughtSomething].filter(
    Boolean
  ).length;

  return (
    <div className="mb-8 rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Getting started</h2>
        <span className="text-sm text-gray-500">{doneCount} of 3 done</span>
      </div>

      <div className="mt-2 divide-y divide-pink-50">
        {/* 1 — public page */}
        <div className="flex items-start gap-4 py-4">
          <StepCircle done={profileDone} n={1} />
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${
                profileDone ? "text-gray-400" : "text-gray-900"
              }`}
            >
              Set up your public page
            </p>
            {!profileDone && (
              <p className="mt-0.5 text-sm text-gray-600">
                Add a photo and a short bio — it&apos;s the first thing your
                followers see.
              </p>
            )}
          </div>
          {!profileDone && (
            <Button asChild variant="brandOutline" size="sm" className="shrink-0">
              <Link href="/instructor/profile">Edit profile</Link>
            </Button>
          )}
        </div>

        {/* 2 — first class or program */}
        <div className="flex items-start gap-4 py-4">
          <StepCircle done={createdSomething} n={2} />
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${
                createdSomething ? "text-gray-400" : "text-gray-900"
              }`}
            >
              Schedule your first class — or create a program
            </p>
            {!createdSomething && (
              <p className="mt-0.5 text-sm text-gray-600">
                A live class takes two minutes to schedule. A program turns
                videos you already have into something people can buy.
              </p>
            )}
          </div>
          {!createdSomething && (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Button asChild variant="brandOutline" size="sm">
                <Link href="/instructor/streams/create">Schedule a class</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/instructor/programs/create">Create a program</Link>
              </Button>
            </div>
          )}
        </div>

        {/* 3 — teach */}
        <div className="flex items-start gap-4 py-4">
          <StepCircle done={taughtSomething} n={3} />
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${
                taughtSomething ? "text-gray-400" : "text-gray-900"
              }`}
            >
              Teach it
            </p>
            {!taughtSomething && (
              <p className="mt-0.5 text-sm text-gray-600">
                Go live from your browser at class time, or publish your
                program when the lessons are up.
              </p>
            )}
          </div>
          {!taughtSomething && (
            <Button asChild variant="brandOutline" size="sm" className="shrink-0">
              <Link href="/instructor/streams">Open your classes</Link>
            </Button>
          )}
        </div>

        {/* Share — always available, never "done" */}
        <div className="flex items-start gap-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Share your page</p>
            <p className="mt-0.5 text-sm text-gray-600">
              Your page is leansporty.com/@{slug} — put it in your Instagram
              bio and share it in your stories.
            </p>
          </div>
          <CopyLinkButton
            path={`/@${slug}`}
            label="Copy your page link"
            variant="brandOutline"
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
