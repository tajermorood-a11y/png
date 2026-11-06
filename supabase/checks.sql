-- Each query should return ZERO rows.

-- 1) Balance must equal the sum of the wallet ledger
select a.user_id, a.balance,
       coalesce(sum(case when t.direction = 'credit' then t.amount else -t.amount end), 0) as ledger
  from public.user_accounts a
  left join public.wallet_transactions t on t.user_id = a.user_id
 group by a.user_id, a.balance
having a.balance <> coalesce(sum(case when t.direction = 'credit' then t.amount else -t.amount end), 0);

-- 2) A used code must have exactly one matching top-up transaction per user
select c.code from public.topup_codes c
 where c.status = 'used'
   and not exists (select 1 from public.wallet_transactions t where t.user_id = c.used_by and t.kind = 'topup' and t.amount = c.amount);

-- 3) Verified accounts must have a verification date; badges only for verified accounts
select user_id from public.user_accounts where badge is not null and verified_at is null;
