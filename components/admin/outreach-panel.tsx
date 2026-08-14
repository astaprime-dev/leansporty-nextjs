"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Copy, Check, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { renderTouch } from "@/lib/outreach-templates";
import type { TouchNumber } from "@/lib/outreach-templates";
import type { ProspectRow, TerritoryRow } from "@/lib/outreach";

/**
 * The nav mirrors the actual working loop, in order: Find (feed the list, city
 * by city) → Review (fits / pass) → Send (what's due today). Applications
 * (inbound from /teach) and All (the ledger) sit after the numbered flow.
 */
type View = "find" | "new" | "queue" | "inbound" | "all";

type InboundApplication = {
  id: string;
  email: string;
  name: string | null;
  social: string | null;
  handle: string | null;
  about: string | null;
  created_at: string;
  inList: boolean;
};

type ListResponse = {
  prospects: ProspectRow[];
  territories: TerritoryRow[];
  counts: Record<string, number>;
  truncated: boolean;
};

type ImportResponse = {
  added: number;
  duplicates: number;
  rejected: string[];
  skippedKnown: string[];
};

type SweepResponse = {
  added?: number;
  duplicates?: number;
  /** Google-index sweep only: rule-filtered vs. left for human review. */
  toReview?: number;
  autoRejected?: number;
  /** null once the last seeded query for the city has run. */
  nextQueryIndex: number | null;
  /** Places sweep only: set while the current query still has sites to fetch. */
  nextSiteOffset?: number | null;
};

const STATUS_BADGE: Record<
  string,
  "default" | "secondary" | "outline" | "brand" | "free" | "destructive"
> = {
  new: "secondary",
  qualified: "brand",
  rejected: "outline",
  contacted: "default",
  replied: "free",
  invited: "brand",
  activated: "free",
  passed: "outline",
};

/**
 * The founder's outreach console (see app/admin/outreach). Four views over one
 * deduplicated prospect list; every write goes through the admin API routes and
 * this component only renders their results.
 */
export function OutreachPanel() {
  const [view, setView] = useState<View>("queue");
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Guards against a slow earlier request landing after a newer one and
  // overwriting it — switching tabs quickly used to show an empty list because
  // the previous tab's response arrived last.
  const requestId = useRef(0);
  // On first load only: land on the first step of the flow that actually has
  // work — Send if something is due, else Review if leads wait, else Find.
  const autoRouted = useRef(false);

  const load = useCallback(async (v: View) => {
    // The non-list tabs still need the territory board and the counts, so they
    // load the same payload and just don't render the prospect list.
    const listView = v === "queue" || v === "new" || v === "all" ? v : "queue";
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/outreach?view=${listView}`);
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const json = await res.json();
      if (id !== requestId.current) return; // superseded
      setData(json);
      if (!autoRouted.current) {
        autoRouted.current = true;
        if (v === "queue" && (json.prospects?.length ?? 0) === 0) {
          setView((json.counts?.new ?? 0) > 0 ? "new" : "find");
        }
      }
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(view);
  }, [load, view]);

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      setError("Couldn't reach the clipboard — copy it by hand.");
    }
  }, []);

  const patchProspect = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      setBusyId(id);
      setError(null);
      try {
        const res = await fetch(`/api/admin/outreach/prospect/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`Update failed (${res.status})`);
        await load(view);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setBusyId(null);
      }
    },
    [load, view]
  );

  const mintInvite = useCallback(
    async (p: ProspectRow) => {
      setBusyId(p.id);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/outreach/prospect/${p.id}/invite`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error(`Mint failed (${res.status})`);
        const { inviteLink } = await res.json();
        await copy(`invite-${p.id}`, inviteLink);
        await load(view);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Mint failed");
      } finally {
        setBusyId(null);
      }
    },
    [copy, load, view]
  );

  const counts = data?.counts ?? {};

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["find", "1 · Find"],
            ["new", `2 · Review${counts.new ? ` (${counts.new})` : ""}`],
            ["queue", "3 · Send"],
            ["inbound", "Applications"],
            ["all", `All${counts.total ? ` (${counts.total})` : ""}`],
          ] as [View, string][]
        ).map(([v, label]) => (
          <Button
            key={v}
            type="button"
            size="sm"
            variant={view === v ? "brand" : "outline"}
            onClick={() => setView(v)}
          >
            {label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => load(view)}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <StatusStrip counts={counts} />

      {view === "find" && (
        <>
          <InboxView
            territories={data?.territories ?? []}
            onImported={() => load("find")}
          />
          <TerritoriesView
            territories={data?.territories ?? []}
            copied={copied}
            onCopy={copy}
            onSwept={() => load("find")}
          />
        </>
      )}

      {view === "inbound" && <InboundView onAdded={() => load("new")} />}

      {(view === "queue" || view === "new" || view === "all") && (
        <>
          {loading && !data && <p className="text-gray-500">Loading…</p>}
          {data && data.prospects.length === 0 && (
            <EmptyState
              title={
                view === "queue"
                  ? "Nothing to send today"
                  : "Nothing to review"
              }
              description={
                view === "queue" && (counts.new ?? 0) > 0
                  ? `${counts.new} lead${(counts.new ?? 0) === 1 ? " is" : "s are"} waiting in Review — qualify them and they land here.`
                  : view === "queue"
                    ? "Either everyone is waiting on a reply, or the list needs feeding."
                    : "Feed the list: sweep a city or paste handles in Find."
              }
              action={
                view === "queue" && (counts.new ?? 0) > 0 ? (
                  <Button
                    type="button"
                    variant="brand"
                    onClick={() => setView("new")}
                  >
                    Go to Review
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="brand"
                    onClick={() => setView("find")}
                  >
                    Find leads
                  </Button>
                )
              }
            />
          )}
          <div className="space-y-4">
            {(data?.prospects ?? []).map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                busy={busyId === p.id}
                copied={copied}
                onCopy={copy}
                onPatch={patchProspect}
                onMint={mintInvite}
              />
            ))}
          </div>
          {data?.truncated && (
            <p className="text-sm text-gray-500">
              Showing the first 100 — narrow the view to see the rest.
            </p>
          )}
          {view === "all" && (data?.prospects.length ?? 0) > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportCsv(data!.prospects)}
            >
              Export CSV
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function StatusStrip({ counts }: { counts: Record<string, number> }) {
  const order = [
    ["new", "New"],
    ["qualified", "Qualified"],
    ["contacted", "Contacted"],
    ["replied", "Replied"],
    ["invited", "Invited"],
    ["activated", "Activated"],
  ] as const;
  const any = order.some(([k]) => (counts[k] ?? 0) > 0);
  if (!any) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
      {order.map(([key, label]) => (
        <span key={key}>
          {label}: <span className="font-semibold text-gray-900">{counts[key] ?? 0}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * The paste box. This is the piece that ends the duplicate problem: dump
 * whatever you copied — handles, @handles, share-sheet URLs, all mixed — and
 * find out immediately what's new.
 */
function InboxView({
  territories,
  onImported,
}: {
  territories: TerritoryRow[];
  onImported: () => void;
}) {
  const [blob, setBlob] = useState("");
  const [sourceDetail, setSourceDetail] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cityOptions = useMemo(
    () =>
      [...territories].sort(
        (a, b) =>
          a.priority - b.priority ||
          (a.city ?? a.country).localeCompare(b.city ?? b.country)
      ),
    [territories]
  );

  const submit = async () => {
    if (!blob.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/outreach/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: sourceDetail.trim().startsWith("#") ? "hashtag" : "manual",
          sourceDetail: sourceDetail.trim() || null,
          territoryId: territoryId || null,
          blob,
        }),
      });
      if (!res.ok) throw new Error(`Import failed (${res.status})`);
      const data: ImportResponse = await res.json();
      setResult(data);
      setBlob("");
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-6 space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {result && (
        <Alert variant={result.added > 0 ? "success" : "info"}>
          <p className="font-semibold">
            {result.added} added · {result.duplicates} already had ·{" "}
            {result.rejected.length} not a handle
          </p>
          {result.skippedKnown.length > 0 && (
            <p className="text-sm mt-1">
              Skipped {result.skippedKnown.length} who already applied or
              already teach here: {result.skippedKnown.join(", ")}
            </p>
          )}
          {result.rejected.length > 0 && (
            <p className="text-sm mt-1 opacity-80">
              Ignored: {result.rejected.slice(0, 10).join(", ")}
              {result.rejected.length > 10 ? "…" : ""}
            </p>
          )}
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="outreach-blob">Handles</Label>
        <Textarea
          id="outreach-blob"
          value={blob}
          onChange={(e) => setBlob(e.target.value)}
          rows={6}
          placeholder={"@annadance\ninstagram.com/kasia.fit\nhttps://www.instagram.com/marta.pilates/?igsh=abc"}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          One per line or all jumbled — @handles, bare names and share-sheet
          links all work.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="outreach-city">City (optional)</Label>
          <select
            id="outreach-city"
            value={territoryId}
            onChange={(e) => setTerritoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
          >
            <option value="">— no city —</option>
            {cityOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.city ?? t.country}, {t.country}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Stamps city &amp; country on the whole batch, so pasted handles are
            as organised as swept ones.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="outreach-source">Where from (optional)</Label>
          <Input
            id="outreach-source"
            value={sourceDetail}
            onChange={(e) => setSourceDetail(e.target.value)}
            placeholder="#bachatawarszawa"
            maxLength={200}
          />
          <p className="text-xs text-gray-500">
            Start with # and it&rsquo;s logged as a hashtag sweep, so you can
            see later which tags actually produce instructors.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="brand"
        onClick={submit}
        disabled={busy || !blob.trim()}
      >
        {busy ? "Checking…" : "Add to list"}
      </Button>
    </div>
  );
}

/**
 * Applications from /teach. They arrive in `leads` and previously had no UI —
 * the founder worked them out of the alert email. Showing them next to the
 * outbound queue is what stops an applicant from also getting a cold DM.
 */
function InboundView({ onAdded }: { onAdded: () => void }) {
  const [apps, setApps] = useState<InboundApplication[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/inbound");
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = await res.json();
      setApps(data.applications);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addToList = async (a: InboundApplication) => {
    if (!a.handle) return;
    setBusy(a.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "inbound",
          sourceDetail: `/teach application ${a.created_at.slice(0, 10)}`,
          prospects: [{ handle: a.handle, displayName: a.name }],
        }),
      });
      if (!res.ok) throw new Error(`Add failed (${res.status})`);
      await load();
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(null);
    }
  };

  if (!apps) return <p className="text-gray-500">Loading applications…</p>;
  if (apps.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Anyone who applies through /teach shows up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {apps.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">
                {a.name ?? "(no name)"}
              </p>
              <p className="text-sm text-gray-600">
                <a
                  href={`mailto:${a.email}`}
                  className="hover:text-pink-600 underline"
                >
                  {a.email}
                </a>
                {a.social && ` · ${a.social}`}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(a.created_at).toLocaleDateString()}
            </span>
          </div>

          {a.about && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
              {a.about}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {a.inList ? (
              <Badge variant="free">In the list</Badge>
            ) : a.handle ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy === a.id}
                onClick={() => addToList(a)}
              >
                {busy === a.id ? "Adding…" : "Add to list"}
              </Button>
            ) : (
              <span className="text-xs text-gray-500">
                No Instagram handle on the application — add her by hand if you
                want her tracked.
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Client-side CSV, same approach as the stream roster export: no server round
 * trip, no file written anywhere we'd have to clean up.
 */
function exportCsv(rows: ProspectRow[]) {
  const headers = [
    "handle",
    "name",
    "followers",
    "discipline",
    "city",
    "country",
    "score",
    "status",
    "specific_thing",
    "t1",
    "t2",
    "t3",
    "invite_code",
    "source",
  ];
  const cell = (v: unknown) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [
        p.handle,
        p.display_name,
        p.followers,
        p.discipline,
        p.city,
        p.country,
        p.score,
        p.status,
        p.specific_thing,
        p.t1_at?.slice(0, 10),
        p.t2_at?.slice(0, 10),
        p.t3_at?.slice(0, 10),
        p.invite_code,
        p.source,
      ]
        .map(cell)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `outreach-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TerritoriesView({
  territories,
  copied,
  onCopy,
  onSwept,
}: {
  territories: TerritoryRow[];
  copied: string | null;
  onCopy: (key: string, text: string) => void;
  onSwept: () => void;
}) {
  const [sweeping, setSweeping] = useState<string | null>(null);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [sweepError, setSweepError] = useState<string | null>(null);

  /** Walks every seeded Places query for one city, one request per query. */
  const sweep = async (t: TerritoryRow) => {
    setSweeping(t.id);
    setSweepError(null);
    setSweepResult(null);
    let added = 0;
    let duplicates = 0;
    let queryIndex: number | null = 0;
    let siteOffset = 0;
    try {
      // Walks every seeded query, and every page of studio sites within each
      // query, until the city is actually exhausted.
      while (queryIndex !== null) {
        const res = await fetch("/api/admin/outreach/sweep/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ territoryId: t.id, queryIndex, siteOffset }),
        });
        if (!res.ok) throw new Error(`Sweep failed (${res.status})`);
        const data: SweepResponse = await res.json();
        added += data.added ?? 0;
        duplicates += data.duplicates ?? 0;
        siteOffset = data.nextSiteOffset ?? 0;
        queryIndex = data.nextQueryIndex;
      }
      setSweepResult(
        `${t.city ?? t.country}: ${added} new, ${duplicates} already had`
      );
      onSwept();
    } catch (e) {
      setSweepError(e instanceof Error ? e.message : "Sweep failed");
    } finally {
      setSweeping(null);
    }
  };

  /**
   * The no-AI lane: walks every Google-index query for one city. Same walker
   * shape as the Places sweep, but the interesting number is how many results
   * survived the rules into the review queue.
   */
  const sweepGoogle = async (t: TerritoryRow) => {
    setSweeping(`g-${t.id}`);
    setSweepError(null);
    setSweepResult(null);
    let added = 0;
    let duplicates = 0;
    let toReview = 0;
    let autoRejected = 0;
    let queryIndex: number | null = 0;
    try {
      while (queryIndex !== null) {
        const res = await fetch("/api/admin/outreach/sweep/google-index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ territoryId: t.id, queryIndex }),
        });
        if (!res.ok) throw new Error(`Sweep failed (${res.status})`);
        const data: SweepResponse = await res.json();
        added += data.added ?? 0;
        duplicates += data.duplicates ?? 0;
        toReview += data.toReview ?? 0;
        autoRejected += data.autoRejected ?? 0;
        queryIndex = data.nextQueryIndex;
      }
      setSweepResult(
        `${t.city ?? t.country}: ${added} new — ${toReview} to review, ${autoRejected} auto-filtered, ${duplicates} already had`
      );
      onSwept();
    } catch (e) {
      setSweepError(e instanceof Error ? e.message : "Sweep failed");
    } finally {
      setSweeping(null);
    }
  };
  // The city list is the founder's own, added one at a time — no imposed
  // priority bands, just his cities in a flat grid, worked in order.
  const rows = useMemo(
    () =>
      [...territories].sort(
        (a, b) =>
          a.priority - b.priority ||
          (a.city ?? a.country).localeCompare(b.city ?? b.country)
      ),
    [territories]
  );

  return (
    <div className="space-y-4">
      {sweepError && <Alert variant="error">{sweepError}</Alert>}
      {sweepResult && <Alert variant="success">{sweepResult}</Alert>}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Your cities
          </h2>
          <AddCityForm onAdded={onSwept} />
        </div>
        {territories.length === 0 && (
          <EmptyState
            title="No cities yet"
            description="Add your first city above — hashtags and localized search queries are generated for it automatically."
          />
        )}
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-pink-100 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    {t.city ?? t.country}{" "}
                    <span className="text-gray-400 font-normal">
                      {t.country}
                    </span>
                  </p>
                  <Badge variant={t.prospects_found > 0 ? "free" : "secondary"}>
                    {t.prospects_found} found
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t.last_swept_at
                    ? `Last swept ${new Date(t.last_swept_at).toLocaleDateString()}`
                    : "Never swept"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.hashtags.map((tag) => (
                    <a
                      key={tag}
                      href={`https://www.instagram.com/explore/tags/${tag.replace(/^#/, "")}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-pink-800 hover:bg-pink-100"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {t.search_queries[0] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2"
                      onClick={() => onCopy(`q-${t.id}`, t.search_queries[0])}
                    >
                      {copied === `q-${t.id}` ? (
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Google query
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={sweeping !== null}
                    onClick={() => sweep(t)}
                  >
                    {sweeping === t.id ? "Sweeping…" : "Sweep studios"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={sweeping !== null}
                    onClick={() => sweepGoogle(t)}
                  >
                    {sweeping === `g-${t.id}` ? "Sweeping…" : "Sweep Google"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
      </section>
    </div>
  );
}

/**
 * The fit score with its own explainer. Colored by tier (green = in-band,
 * amber = edge case, gray = below band). The popover is React-state driven —
 * opens on hover, click/tap, or keyboard focus — because it must work on
 * phones and regardless of CSS-hover quirks.
 */
function ScoreBadge({ score }: { score: number }) {
  const [open, setOpen] = useState(false);
  const tone =
    score >= 70
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : score >= 55
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-help ${tone}`}
        aria-expanded={open}
        aria-label={`Fit score ${score} — what does this mean?`}
      >
        {score}
        <Info className="h-3 w-3 opacity-60" />
      </button>
      {open && (
      <span className="pointer-events-none absolute right-0 top-full z-50 mt-2 block w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
        <span className="block text-xs font-semibold text-gray-900 mb-2">
          Fit score — sorts the queue, not a verdict
        </span>
        <span className="flex items-start gap-2 text-xs text-gray-700 mb-1.5">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          <span>
            <b>70+</b> — verified, inside the 5k–50k follower band. Standard
            playbook send.
          </span>
        </span>
        <span className="flex items-start gap-2 text-xs text-gray-700 mb-1.5">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <span>
            <b>55–69</b> — edge case: band edge, or valuable for another reason
            (e.g. a studio partnership).
          </span>
        </span>
        <span className="flex items-start gap-2 text-xs text-gray-700 mb-2">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-400" />
          <span>
            <b>40–54</b> — real instructor, below the band. Send only as a
            deliberate exception.
          </span>
        </span>
        <span className="block text-[11px] text-gray-500 border-t border-gray-100 pt-1.5">
          The italic line on the card explains this card&rsquo;s number.
        </span>
      </span>
      )}
    </span>
  );
}

/** Two fields and a button: "Brno" + "CZ" → a seeded, sweepable city card. */
function AddCityForm({ onAdded }: { onAdded: () => void }) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!city.trim() || country.trim().length !== 2) {
      setError("City name + 2-letter country (CZ, PL, UA…)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/territories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), country: country.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Failed (${res.status})`);
      setCity("");
      setCountry("");
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Brno"
        className="h-9 w-32"
        maxLength={120}
      />
      <Input
        value={country}
        onChange={(e) => setCountry(e.target.value.toUpperCase())}
        placeholder="CZ"
        className="h-9 w-14 uppercase"
        maxLength={2}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={submit}
      >
        {busy ? "Adding…" : "Add city"}
      </Button>
    </div>
  );
}

function ProspectCard({
  prospect: p,
  busy,
  copied,
  onCopy,
  onPatch,
  onMint,
}: {
  prospect: ProspectRow;
  busy: boolean;
  copied: string | null;
  onCopy: (key: string, text: string) => void;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onMint: (p: ProspectRow) => void;
}) {
  const [specificThing, setSpecificThing] = useState(p.specific_thing ?? "");
  const [name, setName] = useState(p.display_name ?? "");
  const [notes, setNotes] = useState(p.notes ?? "");
  const [showNotes, setShowNotes] = useState(!!p.notes);
  // Inline, not window.alert(): a modal dialog blocks the page (and would block
  // an automated session outright), and you'd have to dismiss it every time.
  const [warning, setWarning] = useState<string | null>(null);

  const inviteLink = p.invite_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/welcome/${p.invite_code}`
    : null;

  // The stages where the founder is actively working her: personalization
  // fields and the due touch live here. 'new' shows only fits/pass; 'replied'
  // only the invite; terminal states show nothing.
  const working = ["qualified", "contacted", "invited"].includes(p.status);

  const slots = {
    name: name.trim().split(" ")[0] || null,
    style: p.discipline,
    specific_thing: specificThing,
    invite_link: inviteLink,
  };

  // Which touch is next: the first one not yet sent.
  const nextTouch: TouchNumber | null = !p.t1_at
    ? 1
    : !p.t2_at
      ? 2
      : !p.t3_at
        ? 3
        : null;

  const copyTouch = (n: TouchNumber) => {
    const { text, missing } = renderTouch(n, slots);
    if (missing.length > 0) {
      // Refuse rather than hand over a draft with "{name}" still in it — that
      // is exactly the message you'd paste without re-reading.
      const readable = missing
        .map((m) =>
          m === "specific_thing"
            ? "one specific thing of hers"
            : m === "invite_link"
              ? "an invite (mint one first)"
              : m === "name"
                ? "her first name"
                : m
        )
        .join(" and ");
      setWarning(`Not copied — fill in ${readable} first.`);
      return;
    }
    setWarning(null);
    onCopy(`t${n}-${p.id}`, text);
  };

  const due = !!p.next_touch_at && new Date(p.next_touch_at) <= new Date();

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={p.profile_url ?? `https://instagram.com/${p.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-pink-600 inline-flex items-center gap-1"
          >
            @{p.handle}
            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
          </a>
          <p className="text-sm text-gray-600 mt-0.5">
            {[
              p.display_name,
              p.followers ? `${formatFollowers(p.followers)} followers` : null,
              p.discipline,
              [p.city, p.country].filter(Boolean).join(", ") || null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {typeof p.score === "number" && <ScoreBadge score={p.score} />}
          <Badge variant={STATUS_BADGE[p.status] ?? "secondary"}>
            {p.status}
          </Badge>
          {due && <Badge variant="live">due</Badge>}
        </div>
      </div>

      {p.score_reason && (
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-medium text-gray-500">Why: </span>
          {p.score_reason}
        </p>
      )}

      {/* Notes — approach/angle the founder jots on the go. Collapsed by
          default (unless it already has content) to keep the card scannable on
          a phone; the field is the same `notes` column the PATCH route saves. */}
      {showNotes ? (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if ((p.notes ?? "") !== notes) onPatch(p.id, { notes });
          }}
          rows={2}
          placeholder="Notes — approach, angle, anything you spot. Saved automatically."
          className="mt-2 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="mt-2 text-xs text-gray-400 hover:text-pink-600"
        >
          + note
        </button>
      )}

      {/* One stage, one action. The full lifecycle used to be visible on every
          card — nine controls at once — and the founder rightly called it
          overengineered. Now: new → fits/pass; qualified/contacted/invited →
          the ONE due touch; replied → the invite. */}

      {working && (
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,10rem)_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor={`nm-${p.id}`} className="text-xs">
              Her first name
            </Label>
            <Input
              id={`nm-${p.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if ((p.display_name ?? "") !== name) {
                  onPatch(p.id, { displayName: name });
                }
              }}
              placeholder="Anna"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`st-${p.id}`} className="text-xs">
              One specific thing of hers (goes into Touch 1)
            </Label>
            <Input
              id={`st-${p.id}`}
              value={specificThing}
              onChange={(e) => setSpecificThing(e.target.value)}
              onBlur={() => {
                if ((p.specific_thing ?? "") !== specificThing) {
                  onPatch(p.id, { specificThing });
                }
              }}
              placeholder="your Tuesday bachata reel with the beginner breakdown"
              maxLength={500}
            />
          </div>
        </div>
      )}

      {warning && (
        <p className="mt-2 text-sm text-amber-700">{warning}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.status === "new" && (
          <Button
            type="button"
            size="sm"
            variant="brand"
            disabled={busy}
            onClick={() => onPatch(p.id, { status: "qualified" })}
          >
            {busy ? "Saving…" : "She fits"}
          </Button>
        )}

        {working && nextTouch && (
          <>
            <Button
              type="button"
              size="sm"
              variant="brandOutline"
              onClick={() => copyTouch(nextTouch)}
            >
              {copied === `t${nextTouch}-${p.id}` ? (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              Copy Touch {nextTouch}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="brand"
              disabled={busy}
              onClick={() => onPatch(p.id, { markTouch: nextTouch })}
            >
              {busy ? "Saving…" : `Mark ${nextTouch} sent`}
            </Button>
          </>
        )}

        {/* The invite appears when it's actually needed: she replied, or
            Touch 3 is next (it goes out with her personal link). */}
        {(p.status === "replied" ||
          (working && (nextTouch === 3 || !nextTouch))) &&
          (!p.invite_code ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onMint(p)}
            >
              Mint invite
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onCopy(`invite-${p.id}`, inviteLink ?? "")}
            >
              {copied === `invite-${p.id}` ? (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              Invite link
            </Button>
          ))}

        <span className="flex-1" />

        {(p.status === "contacted" || p.status === "invited") && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onPatch(p.id, { status: "replied" })}
          >
            Replied
          </Button>
        )}
        {!["activated", "rejected", "passed"].includes(p.status) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onPatch(p.id, { status: "passed" })}
          >
            Pass
          </Button>
        )}
      </div>

      {(p.t1_at || p.next_touch_at) && p.status !== "new" && (
        <p className="text-xs text-gray-400 mt-3">
          {[
            p.t1_at && `T1 ${short(p.t1_at)}`,
            p.t2_at && `T2 ${short(p.t2_at)}`,
            p.t3_at && `T3 ${short(p.t3_at)}`,
            p.next_touch_at && `next ${short(p.next_touch_at)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

function short(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
