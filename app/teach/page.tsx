import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  Check,
  Film,
  Globe,
  LifeBuoy,
  MonitorPlay,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeachApplyForm } from "@/components/teach/apply-form";
import { EarningsCalculator } from "@/components/teach/earnings-calculator";
import { StickyApplyBar } from "@/components/teach/sticky-apply";

export const metadata: Metadata = {
  // `absolute`: the title already carries the brand — the root template
  // would double it.
  title: { absolute: "Teach on Lean Sporty — keep 85% of every sale" },
  description:
    "Live-stream your dance & fitness classes, sell your own on-demand programs, and get paid for every sale. No tech setup, no monthly fee — you teach, we run everything else.",
  alternates: { canonical: "/teach" },
  twitter: { card: "summary_large_image" },
};

/**
 * Instructor recruiting landing page. Copy source of truth: INSTRUCTOR_PITCH.md
 * (repo root) — keep numbers and promises in sync when the deal changes.
 * CTA is an application (leads table, source 'teach-apply'), not self-serve
 * signup: instructor activation stays curated/invite-only.
 */

const PLATFORM_FEATURES = [
  {
    icon: MonitorPlay,
    title: "Go live from your browser",
    body: "One click and you're streaming in broadcast quality. Prefer OBS? That works too. No software to learn, no setup calls.",
  },
  {
    icon: Film,
    title: "Sell programs, not just classes",
    body: "Upload your videos, arrange them into a program — a simple list or a day-by-day plan — set one price, and publish it on your profile. Programs sell around the clock, even while you sleep.",
  },
  {
    icon: Store,
    title: "Your storefront, built for you",
    body: "Every class and program gets a clean sales page with your profile, a free preview lesson, checkout, and student reviews — plus private per-lesson feedback only you see. No website builder, ever.",
  },
  {
    icon: Banknote,
    title: "Payments handled for you",
    body: "Students pay by card; we collect the money, handle receipts and refunds, and send your share to your bank every month. No invoices, no chasing.",
  },
  {
    icon: Video,
    title: "Every class is recorded",
    body: "Your live classes are saved automatically in full quality — and you can reuse any recording as a lesson in your paid programs.",
  },
  {
    icon: LifeBuoy,
    title: "Support handled",
    body: "Failed cards, refunds, “I can’t log in” emails — our problem, not yours. You show up and teach.",
  },
];

const DIY_LIST = [
  "A streaming service subscription",
  "A payment provider and checkout setup",
  "A website with a booking page",
  "A course platform for your video programs",
  "Sending invoices and chasing payments",
  "Refunds and customer-support emails",
  "Hosting and protecting your recordings",
];

const STEPS = [
  {
    n: "1",
    title: "Set up once — about 10 minutes",
    body: "Create your profile — a photo, a few lines about you — and claim your page address (leansporty.com/@your-name). No bank forms, no paperwork.",
  },
  {
    n: "2",
    title: "Create a class or a program",
    body: "Schedule a live class, or upload videos and arrange them into a program. Set your price — we handle checkout, access, and receipts.",
  },
  {
    n: "3",
    title: "Teach",
    body: "Go live from your browser or OBS. Programs sell on their own from your profile. Only people who paid can watch — access is our job.",
  },
  {
    n: "4",
    title: "Get paid monthly",
    body: "Every sale appears in your earnings dashboard the moment it happens, and we send your share to your bank once a month by bank transfer.",
  },
];

/** Real Studio screenshots, captured in a live production walkthrough (1440px). */
const PROOF_SHOTS = [
  {
    src: "/teach-shot-dashboard.jpg",
    title: "Your Studio dashboard",
    body: "A getting-started checklist walks you from empty page to first class.",
  },
  {
    src: "/teach-shot-broadcast.jpg",
    title: "Go live from your browser",
    body: "Set up your camera, press Start Broadcast — that's the whole setup. OBS optional.",
  },
  {
    src: "/teach-shot-profile.jpg",
    title: "Your public page",
    body: "leansporty.com/@your-name — your photo, classes, and programs in one link.",
  },
];

const OPPORTUNITIES = [
  {
    icon: Globe,
    title: "Teach beyond your city",
    body: "Your in-person class holds 20 people. Online, your audience is anyone, anywhere — without you leaving your living room.",
  },
  {
    icon: TrendingUp,
    title: "Your classes compound",
    body: "Every recording can become a lesson in a paid program — so one night of teaching keeps earning long after the live class ends.",
  },
  {
    icon: Users,
    title: "Grow with the platform",
    body: "As Lean Sporty's member base grows, our audience discovers your classes too — students you'd never have reached on your own.",
  },
];

const FAQ = [
  {
    q: "Could I ever end up owing money or earning nothing on a sale?",
    a: "No. Your share is a percentage of every sale, so you're always positive. If a class doesn't sell, you've spent your time — never your money. There's no listing fee and no monthly fee.",
  },
  {
    q: "Do I have to deal with refunds, failed cards, or support emails?",
    a: "No. We handle payment problems, refunds, and customer support. You teach.",
  },
  {
    q: "Different countries and currencies — do I have to figure that out?",
    a: "No. You set one price in euros, and students anywhere pay by card — their bank handles any conversion. Your percentage applies to every sale. (On very small prices we apply a small minimum fee of about €1.50 so card fees don't eat the sale — you still always earn.)",
  },
  {
    q: "Does my share ever change?",
    a: "Your 85% (featured 90%) applies to students you bring — your classes, your Instagram, your community. When our own marketing brings you students you'd never have reached, we keep a larger share on those specific sales — bonus income on top, never a cut of what your audience pays you.",
  },
  {
    q: "When do I actually get paid?",
    a: "Once a month, by bank transfer, for everything you earned that month. You see every sale in your earnings dashboard the moment it happens — the monthly transfer is just when the money moves.",
  },
  {
    q: "Why do you keep the recordings?",
    a: "It's the heart of the deal — and why we charge 15% instead of the 30–50% others take. Your recordings grow the members' library, the library grows the audience, and that audience keeps finding you. And you can bundle those same recordings into your own paid programs and sell them from your profile.",
  },
  {
    q: "What about taxes?",
    a: "You're paid as an independent instructor, so your earnings are yours to report — you get the records you need. Your share is your share; nothing surprising is deducted.",
  },
];

export default function TeachPage() {
  return (
    <div className="w-full">
      <StickyApplyBar />
      {/* Hero */}
      <section className="bg-gradient-to-b from-pink-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid items-center gap-10 md:grid-cols-[3fr,2fr]">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                <Sparkles className="h-3.5 w-3.5" /> For dance &amp; fitness
                instructors
              </span>
              <h1 className="font-display animate-fade-up mt-5 text-4xl font-light tracking-tight text-gray-900 sm:text-6xl">
                You{" "}
                <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                  teach
                </span>
                . We run everything else.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:mx-0">
                Live-stream your classes, sell your own on-demand programs, and
                get paid monthly — while you keep{" "}
                <strong className="font-semibold text-gray-900">
                  85% of every sale
                </strong>
                . No website to build, no payments to chase, no monthly fee.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
                <Button
                  asChild
                  variant="brand"
                  className="h-12 px-8 text-base font-semibold"
                >
                  <Link href="#apply">Apply to teach</Link>
                </Button>
                <Button
                  asChild
                  variant="brandOutline"
                  className="h-12 px-8 text-base"
                >
                  <Link href="#how-it-works">See how it works</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Free to join · no listing fees · featured instructors keep 90%
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                Already teach on Lean Sporty?{" "}
                <Link
                  href="/instructor"
                  className="font-semibold text-pink-600 transition-colors hover:text-pink-500"
                >
                  Sign in to your Studio
                </Link>
              </p>
            </div>

            <div className="relative hidden aspect-[3/4] overflow-hidden rounded-3xl md:block">
              <Image
                src="/teach-hero-reach.jpg"
                alt="Dance instructor mid-class, one arm raised"
                fill
                priority
                sizes="(max-width: 768px) 0px, 400px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform features — the convenience */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-center text-3xl font-light text-gray-900">
          Everything you&apos;d have to build — already running
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          The entire operation behind a paid online class, done for you from
          day one.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIY comparison */}
      <section className="bg-pink-50/50 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-light text-gray-900">
                Doing it yourself means juggling all of this
              </h2>
              <ul className="mt-6 space-y-3">
                {DIY_LIST.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-pink-400" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
                On Lean Sporty
              </p>
              <p className="font-display mt-3 text-3xl font-light text-gray-900">
                You set one price and press &ldquo;go live&rdquo;.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Most platforms charge a monthly fee whether or not anyone shows
                up. Here you pay nothing up front — ever. We only earn a small
                share when you do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-center text-3xl font-light text-gray-900">
          From idea to money in the bank
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-sm font-semibold text-white">
                {s.n}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The deal — worked example */}
      <section className="bg-pink-50/50 py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-center text-3xl font-light text-gray-900">
            The deal, in real numbers
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            You teach a live class at €15 a seat, and your 4-week program sells
            for €49 on your profile — you keep 85% of every sale.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pink-100 bg-pink-50/60 text-left">
                  <th className="p-4 font-semibold text-gray-900">What you sell</th>
                  <th className="p-4 font-semibold text-gray-900">Price</th>
                  <th className="p-4 font-semibold text-gray-900">
                    Your 85%
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {[
                  ["A seat in your live class", "€15", "€12.75"],
                  ["Your 4-week program", "€49", "€41.65"],
                  ["The same program, as a featured instructor (90%)", "€49", "€44.10"],
                ].map(([what, paid, share]) => (
                  <tr key={what}>
                    <td className="p-4 text-gray-700">{what}</td>
                    <td className="p-4 text-gray-700">{paid}</td>
                    <td className="p-4 font-semibold text-gray-900">{share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-pink-100 bg-pink-50/40 p-4 text-center text-sm text-gray-700">
              30 seats at €15 plus 10 program sales at €49 ≈{" "}
              <strong className="font-semibold text-gray-900">
                €940 collected → ~€799 to your bank
              </strong>{" "}
              — and the program keeps selling after class night.
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Every sale puts money in your pocket. On very small prices a small
            minimum fee (~€1.50 per sale) applies so card fees don&apos;t eat
            the sale — you still always earn.
          </p>

          <EarningsCalculator />
        </div>
      </section>

      {/* Product proof — real screenshots, not promises */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-center text-3xl font-light text-gray-900">
          This is what you get
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Real screenshots — your Studio, your broadcast screen, and the public
          page your followers see.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PROOF_SHOTS.map((s) => (
            <figure
              key={s.src}
              className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm"
            >
              <div className="flex gap-1.5 border-b border-pink-100/60 bg-pink-50/50 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-pink-200" />
                <span className="h-2 w-2 rounded-full bg-pink-200" />
                <span className="h-2 w-2 rounded-full bg-pink-200" />
              </div>
              <Image
                src={s.src}
                alt={s.title}
                width={1200}
                height={631}
                className="w-full border-b border-pink-50"
              />
              <figcaption className="p-4">
                <p className="font-semibold text-gray-900">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Opportunities */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-center text-3xl font-light text-gray-900">
          What teaching here opens up
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {OPPORTUNITIES.map((o) => (
            <div
              key={o.title}
              className="rounded-2xl border border-pink-100 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                <o.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{o.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who's behind this — small team, direct line */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-pink-100 bg-pink-50/40 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <Image
            src="/teach-founder-team.jpg"
            alt="Dance instructor smiling with arms crossed"
            width={128}
            height={170}
            className="h-40 w-32 shrink-0 rounded-xl object-cover object-top"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              A tiny team you can actually reach
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Lean Sporty is built hands-on. Join now and you talk directly to
              the founder — the same person who reads your application, sends
              your invite, and sets up the platform around how you teach. No
              ticket queues, no support bots.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-display text-center text-3xl font-light text-gray-900">
          The worries you probably have — answered
        </h2>
        <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {FAQ.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="text-lg font-semibold text-gray-900">{f.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="border-y border-pink-100/70 bg-pink-50/40 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-[2fr,3fr]">
            <div className="relative hidden aspect-[3/4] overflow-hidden rounded-2xl md:block">
              <Image
                src="/teach-apply-pointing.jpg"
                alt="Dance instructor pointing toward the application form"
                fill
                sizes="(max-width: 768px) 0px, 360px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-center md:text-left">
                <Badge variant="brand" className="mb-4">
                  Featured instructors keep 90%
                </Badge>
                <h2 className="font-display text-3xl font-light text-gray-900">
                  Become a featured instructor
                </h2>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                  We&apos;re featuring a small number of instructors to start: keep 90%
                  of every sale, work directly with the founder, and shape the platform
                  around how you actually teach. Tell us a little about yourself — it
                  takes a minute.
                </p>
              </div>
              <div className="mt-8 rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
                <TeachApplyForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
