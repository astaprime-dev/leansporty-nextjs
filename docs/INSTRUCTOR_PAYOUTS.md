# Instructor payouts (monthly, dual rail)

Every paid-class sale writes an `instructor_payouts` row (migrations `20260705000000`,
`20260727000000`, `20260728000000`) recording the instructor's share of the amount
actually charged. Payouts run monthly from `/admin/payouts` over two rails:

- **Stripe rail (automatic)** — instructors in countries Stripe Connect can pay from
  a PL platform (EEA + UK at 0% cross-border fee, CH/US/CA at 0.25% —
  `lib/payout-regions.ts`). They onboard once via Stripe-hosted Connect onboarding
  (`/instructor/earnings/payout-details` → "Payouts via Stripe"); the run creates one
  Stripe **transfer per pending sale** tied to the original charge
  (`source_transaction`), so runs never wait on platform balance and every refund can
  be reversed against exactly one transfer.
- **Manual rail** — instructors anywhere else (e.g. Ukraine, Brazil; Argentina is
  hard everywhere due to currency controls — likely Payoneer/USD if it ever comes
  up). Their bank details stay in `instructor_billing`; the founder sends the money
  via Wise/SEPA and clicks **Mark paid** on the admin page. Automate with the Wise
  Platform API only once ~3+ out-of-region instructors have regular sales. (The
  platform is merchant of record with self-billing, so these are ordinary contractor
  payments — accounts payable, not money transmission.)

The Stripe webhook is the only ledger writer for sales. Instructors see their own
totals at `/instructor/earnings`.

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
`20260727010000`).

## Ledger statuses (rows are never deleted)

| status | meaning |
|---|---|
| `pending` | sale recorded, not yet paid out |
| `paid` | paid — `paid_via` says which rail (`stripe_connect` sets `stripe_transfer_id`; `manual` = founder marked it) |
| `refunded` | refund/chargeback arrived **before** any payout — excluded from runs, kept for audit |
| `reversed` | refund after a Stripe transfer; the transfer reversal succeeded (money clawed back automatically) |
| `reversal_failed` | refund after payout that could **not** be clawed back (connected balance already paid out, or the row was paid manually) — flagged on `/admin/payouts`; net it from the instructor's next payout |

## Monthly run (`/admin/payouts`)

Prerequisite (one-time): give your own auth user the admin role — Supabase
dashboard → Authentication → your user → edit `raw_app_meta_data` →
`{"roles": ["admin"]}` (the same DEF-2 guard as `/api/admin/instructor/grant`).

**0. OSS threshold glance** (while not OSS-registered): in the Stripe Dashboard,
check calendar-YTD revenue from **EU billing countries other than PL** stays under
**€10,000**. Below it, flat PL 23% on EU sales is correct. Crossing it makes
destination rates mandatory from the crossing transaction: register for OSS and set
`VAT_DESTINATION_RATES=true`.

**1. Open `/admin/payouts`.** The preview lists every instructor with pending
earnings, split by rail. €20 minimum per instructor — smaller balances show as
"rolls over". Instructors without an active rail (Stripe onboarding unfinished, or
no bank details) are listed but not payable — the Studio nudges them.

**2. Stripe rail: click "Run payouts".** One transfer per pending sale, batch id
defaults to `YYYY-MM`. Safe to re-run after a partial failure — paid rows are
excluded and transfer creation is idempotent per row (`payout-transfer-<row id>`;
transfers also carry `metadata.payout_id` for reconciliation). Per-row errors land
in `transfer_error` and in the result panel; fix and re-run. Stripe then pays each
instructor's bank on the connected account's own (daily) payout schedule.

**3. Manual rail: send each transfer via Wise/SEPA** using the bank details shown
(from `instructor_billing`; **no details = don't pay**), then click **Mark paid** —
it stamps the instructor's pending rows `paid`/`paid_via='manual'` with the batch id.

**4. Reconcile `reversal_failed`** rows if the banner shows any: reduce the
instructor's next manual payout by that amount, or recover directly; then update the
row's status by hand (SQL) once settled.

## Self-billed settlement statement (samofakturowanie) — per instructor, per run

Legal basis: instructor agreement §7 (prior written self-billing authorization,
accepted at activation; acceptance procedure = 14 days to object, silence accepts).
While instructor count is small this is **manual**.

**Statement lines** (the run sets `payout_batch_id` on both rails):

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
- Supplier: instructor's legal name, address, NIP/TIN — all in `instructor_billing`
  (`business_status` tells you which VAT treatment line applies).
- Recipient: Astaprime Sp. z o.o. (+ NIP).
- Service: "Instructor teaching services provided via the Lean Sporty platform,
  period <month>", with the lines above and the total = the transfer amount.
- VAT treatment (per instructor status, confirmed by accountant):
  **exempt** (most PL instructors, "zwolnienie") · **PL VAT-registered** → VAT added
  on top of the share (deductible input VAT for us — net cost zero) ·
  **EU foreign** → reverse charge.
- Footer: "Issued by the recipient on behalf of the supplier under the self-billing
  authorization in the Instructor Agreement §7. Objections within 14 days;
  otherwise the statement is accepted."

**The statement is now auto-generated in the Studio**: after a payout run, each
instructor sees the batch under "Payout history" on `/instructor/earnings`, and
"View statement" renders the numbered self-billed document
(`/instructor/earnings/statements/<batch>`, print → PDF). Set `ASTAPRIME_NIP` in
the environment to print the company NIP on it. Emailing a copy is optional —
same YouTube/OnlyFans pattern of self-serve monthly earnings statements, with
the samofakturowanie wording kept for PL cost documentation. The SQL below
remains for reconciliation.

## Appendix: SQL fallback / reconciliation

The admin page replaces the old SQL runbook; these queries remain for
reconciliation or if the page is ever unavailable.

Payable balance per instructor:

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

Bank + tax details (manual rail):

```sql
select ib.legal_name, ib.business_name, ib.business_status, ib.tin, ib.vat_number,
       ib.iban, ib.account_holder, ib.address_line, ib.city, ib.postal_code, ib.country
from public.instructor_billing ib
where ib.instructor_id = '<instructor uuid>';
```

Mark a manual batch paid (what the "Mark paid" button does):

```sql
update public.instructor_payouts
set status = 'paid', paid_via = 'manual',
    payout_batch_id = '2026-07', paid_at = now()
where instructor_id = '<instructor uuid>' and status = 'pending';
```

Notes:

- Amounts are the instructor's **share**, already net of VAT and the platform fee —
  transfer exactly `owed`.
- `gross_cents` is what Stripe charged; reconcile the sum of gross against your Stripe
  payout balance if numbers look off. `vat_cents` is the VAT portion to remit — sum it
  per period for the VAT return.
- Find a transfer in the Stripe Dashboard by its ledger row: search transfers for
  `metadata.payout_id = <row id>`, or use the row's `stripe_transfer_id`.
