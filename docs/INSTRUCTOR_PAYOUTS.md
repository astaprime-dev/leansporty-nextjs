# Instructor payouts (manual monthly)

Every paid-class sale writes an `instructor_payouts` row (migration `20260705000000`)
recording the instructor's share of the amount actually charged. While instructor
count is small we pay by **manual monthly bank transfer** — Stripe Connect stays
deferred until ~5 active instructors (see `INSTRUCTOR_STUDIO_PLAN.md`).

The webhook is the only writer. Instructors see their own totals at
`/instructor/earnings`.

## The split (net of VAT since 2026-07-27)

The platform is merchant of record, so VAT on the **full** charged amount is owed to
the tax office (CJEU C-695/20 deemed-supplier rule) — the split applies to what's
left. For each sale:

- `vat = Stripe's amount_tax` when automatic tax ran on the session; otherwise backed
  out of the VAT-inclusive gross at the rate from `lib/vat-rates.ts` (buyer's billing
  country: **EU → `PAYOUT_VAT_PCT` (default 23)**, per-country destination rates once
  `VAT_DESTINATION_RATES=true` post-OSS; **non-EU → 0** — outside EU VAT scope, so
  the instructor's share is larger on e.g. US sales).
- `net = gross − vat` (stored: `gross_cents`, `vat_cents`).
- `platform_fee = (100 − split_pct)% of net` and `instructor_share = net − platform_fee`.
  No per-sale fee floor — the **€5 minimum paid price** (enforced at class/program
  create/update/publish) is what keeps fixed per-sale costs covered.
- Invariant: `gross_cents = vat_cents + platform_fee_cents + instructor_share_cents`.
  (Rows from before migration `20260727000000` have `vat_cents = 0` — their split was
  applied to the VAT-inclusive gross.)

`split_pct` is stored per class product (default **80**; set a featured instructor's
`instructors.split_pct` to **85** and their future classes inherit it — migration
`20260727010000`). Refunds delete the payout row.

## Monthly run

**0. OSS threshold glance** (while not OSS-registered): in the Stripe Dashboard,
check calendar-YTD revenue from **EU billing countries other than PL** stays under
**€10,000**. Below it, flat PL 23% on EU sales is correct (remitted via the normal
PL return — no OSS needed). Crossing it makes destination rates mandatory from the
crossing transaction: register for OSS and set `VAT_DESTINATION_RATES=true`.

**1. Payable balance per instructor** (all pending, €20 minimum — smaller balances
roll to the next month so we never make micro bank transfers; the instructor-facing
copy states this):

```sql
select
  i.id                                   as instructor_id,
  up.display_name,
  count(*)                               as sales,
  p.currency,
  sum(p.instructor_share_cents) / 100.0  as owed
from public.instructor_payouts p
join public.instructors i        on i.id = p.instructor_id
left join public.user_profiles up on up.user_id = i.user_id
where p.status = 'pending'
group by i.id, up.display_name, p.currency
having sum(p.instructor_share_cents) >= 2000   -- €20 payout threshold
order by owed desc;
```

**2. Pay each instructor** their `owed` by bank transfer (Stripe records + your bank).

**3. Mark that instructor's batch paid** (use one batch id per run, e.g. a date):

```sql
update public.instructor_payouts
set status = 'paid',
    payout_batch_id = '2026-07',        -- your batch label
    paid_at = now()
where instructor_id = '<instructor uuid>'
  and status = 'pending';
```

After this, the instructor's "Pending payout" drops to €0 and "Paid out" reflects the
transfer. Do steps 2–3 per instructor so a failed transfer doesn't mark others paid.

## Self-billed settlement statement (samofakturowanie) — per instructor, per run

Legal basis: instructor agreement §7 (prior written self-billing authorization,
accepted at activation; acceptance procedure = 14 days to object, silence accepts).
While instructor count is small this is **manual**, like the payout itself.

**Statement lines** (run after step 3 sets the batch id):

```sql
select p.created_at::date as sale_date,
       coalesce(pr.title, 'Class')            as item,
       p.gross_cents / 100.0                  as student_paid,
       p.vat_cents / 100.0                    as vat_remitted_by_platform,
       p.platform_fee_cents / 100.0           as platform_fee,
       p.instructor_share_cents / 100.0       as your_share
from public.instructor_payouts p
left join public.products pr on pr.id = p.product_id
where p.instructor_id = '<instructor uuid>'
  and p.payout_batch_id = '2026-07'
order by p.created_at;
```

**Document template** (email as PDF; keep a copy — both sides must retain):

- Header: **"Samofakturowanie"** (required word) + number `LS-SB/<year>/<month>/<n>`
  (sequential per instructor).
- Supplier: instructor's legal name, address, NIP/TIN (from onboarding data).
- Recipient: Astaprime Sp. z o.o. (+ NIP).
- Service: "Instructor teaching services provided via the Lean Sporty platform,
  period <month>", with the lines above and the total = the bank transfer amount.
- VAT treatment (per instructor status, confirmed by accountant):
  **exempt** (most PL instructors, "zwolnienie") · **PL VAT-registered** → VAT added
  on top of the share (deductible input VAT for us — net cost zero) ·
  **EU foreign** → reverse charge.
- Footer: "Issued by the recipient on behalf of the supplier under the self-billing
  authorization in the Instructor Agreement §7. Objections within 14 days;
  otherwise the statement is accepted."

Send it in the same email that announces the bank transfer. Later (≥5 instructors,
with Stripe Connect) this becomes a generated PDF in the Studio earnings page —
`instructor_payouts` + `payout_batch_id` already carry every number needed.

## Notes

- Amounts are the instructor's **share**, already net of VAT and the platform fee —
  transfer exactly `owed`.
- `gross_cents` is what Stripe charged; reconcile the sum of gross against your Stripe
  payout balance if numbers look off. `vat_cents` is the VAT portion to remit — sum it
  per period for the VAT return.
- A refund after payout is rare; handle it as a manual clawback/credit next run.
