-- Undo scripts/copy-goals.sql for one destination user.
--
-- Removes only rows the copy created (ids starting cpt_/cpg_/cpa_/cpc_),
-- scoped to :dst_user. Periods go with their goals (cascade). Created
-- accounts/categories are removed only if nothing else uses them. Rows the
-- user added to those goals themselves are kept, just unlinked.
--
--   docker compose exec -T postgres psql -U postgres -d costkeeper \
--     -v dst_user=user_DESTINATION -f - < scripts/undo-copy-goals.sql

\set ON_ERROR_STOP on
\if :{?dst_user} \else \echo 'Pass -v dst_user=<clerk user id>' \quit \endif

begin;

create temp table cp_goals on commit drop as
select id from goals where user_id = :'dst_user' and id like 'cpg\_%';

delete from transactions
where id like 'cpt\_%' and goal_id in (select id from cp_goals);

-- Anything else linked to these goals stays in the ledger.
update transactions set goal_id = null, goal_role = null
where goal_id in (select id from cp_goals);

delete from goals where id in (select id from cp_goals);

delete from accounts a
where a.user_id = :'dst_user' and a.id like 'cpa\_%'
  and not exists (select 1 from transactions t where t.account_id = a.id)
  and not exists (select 1 from goals g where g.account_id = a.id);

delete from categories c
where c.user_id = :'dst_user' and c.id like 'cpc\_%'
  and not exists (select 1 from transactions t where t.category_id = c.id)
  and not exists (select 1 from goals g where g.category_id = c.id);

select
    (select count(*) from goals where user_id = :'dst_user' and id like 'cpg\_%') as goals_left,
    (select count(*) from accounts where user_id = :'dst_user' and id like 'cpa\_%') as accounts_left,
    (select count(*) from categories where user_id = :'dst_user' and id like 'cpc\_%') as categories_left;

commit;
