# Instructor payouts (manual monthly)

Every paid-class sale writes an `instructor_payouts` row (migration `20260705000000`)
recording the instructor's share of the amount actually charged. While instructor
count is small we pay by **manual monthly bank transfer** — Stripe Connect stays
deferred until ~5 active instructors (see `INSTRUCTOR_STUDIO_PLAN.md`).

The webhook is the only writer. Instructors see their own totals at
`/instructor/earnings`.

## The split

For each sale: `platform_fee = max((100 − split_pct)% of gross, €1.50)` (never more
than the sale), and `instructor_share = gross − platform_fee`. `split_pct` is stored
per class product (default **85**; set a founding instructor's `instructors.split_pct`
to **90** and their future classes inherit it). Refunds delete the payout row.

## Monthly run

**1. Payable balance per instructor** (all pending):

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

## Notes

- Amounts are the instructor's **share**, already net of the platform fee — transfer
  exactly `owed`.
- `gross_cents` is what Stripe charged; reconcile the sum of gross against your Stripe
  payout balance if numbers look off.
- A refund after payout is rare; handle it as a manual clawback/credit next run.
