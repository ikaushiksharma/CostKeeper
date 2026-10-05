-- Copy target-style ledger data from one user into another user's Goals.
--
-- For the source user's chosen accounts (default: Assets, Liabilities,
-- Leisures) and the last 2 years (or :since), this creates in the
-- destination user:
--   * accounts with the same names (reused if the destination already has one)
--   * one category per source category (reused on exact name match)
--   * one goal per category, named after the category
--   * goal periods rebuilt from the "target" entries (negative amounts),
--     snapped to calendar half-years, with carry-over chained by goal policy
--   * every transaction copied and linked to its goal:
--       negative rows  -> goal_role 'target'       (hidden bookkeeping)
--       positive rows  -> goal_role 'contribution' (stored as money out)
--
-- Safe to re-run: every created row has a deterministic id (cp*_ + md5), and
-- inserts use ON CONFLICT DO NOTHING. Runs in one transaction. Requires
-- migration 0005_goals. Undo with scripts/undo-copy-goals.sql.
--
-- Run (local Docker):
--   docker compose exec -T postgres psql -U postgres -d costkeeper \
--     -v src_user=user_SOURCE \
--     -v dst_user=user_DESTINATION \
--     -f - < scripts/copy-goals.sql
--
-- Run (prod, prod URL from .env.local, never printed):
--   docker run --rm -i -e DATABASE_URL="$(grep ^DATABASE_URL= .env.local | cut -d= -f2-)" \
--     postgres:16-alpine sh -c 'psql "$DATABASE_URL" -v src_user=... -v dst_user=... -f -' \
--     < scripts/copy-goals.sql
--
-- Optional: -v since=2025-01-01   -v accounts='Assets,Liabilities,Leisures'
--           -v categories='Trips ✈️'  (only these source categories; comma-separated)
--           -v dry_run=1  (prints the plan, then rolls back)
--
-- Re-running restores a deleted goal: the goal and its periods come back with
-- the same ids, and its copied transactions are linked to it again. Goals and
-- periods that still exist are left exactly as they are (renames, edits kept),
-- so use -v categories=... to restore one goal without touching the others.

\set ON_ERROR_STOP on
\if :{?src_user} \else \echo 'Pass -v src_user=<clerk user id>' \quit \endif
\if :{?dst_user} \else \echo 'Pass -v dst_user=<clerk user id>' \quit \endif
\if :{?since} \else \set since '' \endif
\if :{?accounts} \else \set accounts 'Assets,Liabilities,Leisures' \endif
\if :{?categories} \else \set categories '' \endif
\if :{?dry_run} \else \set dry_run 0 \endif

begin;

create temp table cp_params on commit drop as
select
    :'src_user'::text as src,
    :'dst_user'::text as dst,
    coalesce(nullif(:'since', '')::date, (now() - interval '2 years')::date) as since,
    string_to_array(:'accounts', ',') as accts,
    string_to_array(nullif(:'categories', ''), ',') as cats;

-- Calendar half-year helpers (session-only functions).
create function pg_temp.half_start(d date) returns date language sql immutable as
$$ select make_date(extract(year from d)::int, case when extract(month from d) <= 6 then 1 else 7 end, 1) $$;
create function pg_temp.half_end(d date) returns date language sql immutable as
$$ select (pg_temp.half_start(d) + interval '6 months' - interval '1 day')::date $$;
-- A target entered in the last 45 days of a half-year is the plan for the
-- next half (the user sets up H2 in late May / June).
create function pg_temp.anchor(d date) returns date language sql immutable as
$$ select case when pg_temp.half_end(d) - d < 45 then pg_temp.half_end(d) + 1 else pg_temp.half_start(d) end $$;

-- Source rows. Days are IST calendar days (dates are stored as UTC instants).
create temp table cp_tx on commit drop as
select
    t.id, t.amount, t.payee, t.notes, t.date, t.account_id, t.category_id,
    (t.date at time zone 'UTC' at time zone 'Asia/Kolkata')::date as day
from transactions t
join accounts a on a.id = t.account_id
join categories c on c.id = t.category_id
cross join cp_params p
where a.user_id = p.src
  and a.name = any (p.accts)
  and (p.cats is null or c.name = any (p.cats))
  and (t.date at time zone 'UTC' at time zone 'Asia/Kolkata')::date >= p.since;

-- Accounts: reuse a destination account with the same name, else create.
create temp table cp_acc on commit drop as
select distinct on (s.id)
    s.id as src_id, s.name,
    coalesce(d.id, 'cpa_' || left(md5(s.id || p.dst), 24)) as dst_id,
    d.id is null as is_new
from accounts s
cross join cp_params p
left join accounts d on d.user_id = p.dst and d.name = s.name
where s.id in (select account_id from cp_tx)
order by s.id, d.id;

insert into accounts (id, name, user_id)
select dst_id, name, (select dst from cp_params) from cp_acc where is_new
on conflict (id) do nothing;

-- Categories: reuse on exact name match, else create.
create temp table cp_cat on commit drop as
select distinct on (s.id)
    s.id as src_id, s.name,
    coalesce(d.id, 'cpc_' || left(md5(s.id || p.dst), 24)) as dst_id,
    d.id is null as is_new
from categories s
cross join cp_params p
left join categories d on d.user_id = p.dst and d.name = s.name
where s.id in (select category_id from cp_tx)
order by s.id, d.id;

insert into categories (id, name, user_id)
select dst_id, name, (select dst from cp_params) from cp_cat where is_new
on conflict (id) do nothing;

-- One goal per category. Kind from the name; carry-over from the kind.
create temp table cp_goal on commit drop as
select
    'cpg_' || left(md5(c.src_id || p.dst), 24) as id,
    c.src_id as src_cat, c.dst_id as dst_cat, c.name,
    k.kind,
    case k.kind when 'save' then 'both' when 'payoff' then 'shortfall' else 'none' end::goal_carry as carry,
    (select a.dst_id from cp_tx t join cp_acc a on a.src_id = t.account_id
      where t.category_id = c.src_id group by a.dst_id order by count(*) desc limit 1) as account_id
from cp_cat c
cross join cp_params p
cross join lateral (
    select (case
        when c.name ~* 'loan|emi|debt|credit' then 'payoff'
        when c.name ~* 'trip|travel|gift|leisure|fun|shopping|entertain' then 'allowance'
        else 'save'
    end)::goal_kind as kind
) k;

insert into goals (id, user_id, name, kind, cadence, carry_over, status, category_id, account_id)
select id, (select dst from cp_params), name, kind, 'half_year', carry, 'active', dst_cat, account_id
from cp_goal
on conflict (id) do nothing;

-- Periods: one per target anchor. A period runs until the next anchor; the
-- first one reaches back to cover earlier contributions and the last one to
-- the half-year end after the latest entry.
create temp table cp_period on commit drop as
with anchors as (
    select g.id as goal_id, g.kind, g.carry, pg_temp.anchor(t.day) as starts_on,
           sum(-t.amount)::int as target_amount
    from cp_tx t join cp_goal g on g.src_cat = t.category_id
    where t.amount < 0
    group by 1, 2, 3, 4
),
bounds as (
    select g.id as goal_id, min(t.day) as first_day, max(t.day) as last_day
    from cp_tx t join cp_goal g on g.src_cat = t.category_id
    group by 1
),
ranged as (
    select a.*,
        row_number() over w as rn,
        case when row_number() over w = 1
             then least(a.starts_on, pg_temp.half_start(b.first_day))
             else a.starts_on end as p_start,
        coalesce(lead(a.starts_on) over w - 1,
                 pg_temp.half_end(greatest(a.starts_on, b.last_day))) as p_end
    from anchors a join bounds b using (goal_id)
    window w as (partition by a.goal_id order by a.starts_on)
)
select r.goal_id, r.kind, r.carry, r.rn, r.p_start as starts_on, r.p_end as ends_on, r.target_amount,
    coalesce((select sum(t.amount) from cp_tx t join cp_goal g on g.src_cat = t.category_id
              where g.id = r.goal_id and t.amount > 0 and t.day between r.p_start and r.p_end), 0)::bigint as done
from ranged r;

-- Chain carry-over: delta = required - done; sign meaning flips for allowances
-- (positive = unspent surplus, negative = overspend shortfall).
create temp table cp_period_final on commit drop as
with recursive chain as (
    select p.*, 0::bigint as carry_in from cp_period p where rn = 1
    union all
    select n.*,
        (case c.carry
            when 'both' then d.delta
            when 'shortfall' then case when c.kind = 'allowance' then least(d.delta, 0) else greatest(d.delta, 0) end
            when 'surplus' then case when c.kind = 'allowance' then greatest(d.delta, 0) else least(d.delta, 0) end
            else 0
        end)::bigint
    from chain c
    cross join lateral (select c.target_amount + c.carry_in - c.done as delta) d
    join cp_period n on n.goal_id = c.goal_id and n.rn = c.rn + 1
)
select * from chain;

insert into goal_periods (id, goal_id, starts_on, ends_on, target_amount, carry_in)
select 'cpp_' || left(md5(goal_id || starts_on::text), 24), goal_id, starts_on, ends_on, target_amount, carry_in::int
from cp_period_final
on conflict (id) do nothing;

-- Transactions, linked to their goal.
insert into transactions (id, amount, payee, notes, date, account_id, category_id, goal_id, goal_role)
select
    'cpt_' || left(md5(t.id || p.dst), 24),
    case when t.amount < 0 then t.amount else -t.amount end,
    coalesce(t.payee, g.name), t.notes, t.date, a.dst_id, c.dst_id, g.id,
    (case when t.amount < 0 then 'target' else 'contribution' end)::goal_role
from cp_tx t
join cp_acc a on a.src_id = t.account_id
join cp_cat c on c.src_id = t.category_id
join cp_goal g on g.src_cat = t.category_id
cross join cp_params p
on conflict (id) do update
    -- Relink rows that lost their goal (e.g. the goal was deleted in the app).
    set goal_id = excluded.goal_id, goal_role = excluded.goal_role
    where transactions.goal_id is null;

-- Report.
\echo
\echo 'Copied:'
select
    (select count(*) from cp_tx) as source_rows,
    (select count(*) from cp_acc where is_new) as new_accounts,
    (select count(*) from cp_cat where is_new) as new_categories,
    (select count(*) from cp_goal) as goals,
    (select count(*) from cp_period_final) as periods;

\echo 'Periods (rupees):'
select g.name as goal, g.kind, f.starts_on, f.ends_on,
    f.target_amount / 1000 as target, f.carry_in / 1000 as carried,
    (f.target_amount + f.carry_in) / 1000 as required, f.done / 1000 as done,
    (f.target_amount + f.carry_in - f.done) / 1000 as remaining
from cp_period_final f join cp_goal g on g.id = f.goal_id
order by g.name, f.starts_on;

\if :dry_run
    \echo 'Dry run: rolling back.'
    rollback;
\else
    commit;
\endif
