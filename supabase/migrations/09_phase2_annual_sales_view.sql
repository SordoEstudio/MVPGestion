-- Fase 2: Vista facturación anual por comercio (para monotributo y proyección)

create or replace view public.view_annual_sales_by_store as
select
  t.store_id,
  date_trunc('year', t.created_at)::date as year_start,
  extract(year from t.created_at)::int as year,
  coalesce(sum(t.total_amount), 0) as total_sales,
  count(*)::int as transaction_count
from public.transactions t
where t.type = 'SALE'
  and t.status = 'COMPLETED'
group by t.store_id, date_trunc('year', t.created_at), extract(year from t.created_at);

-- RLS: la vista usa tablas ya protegidas por RLS (transactions), así que el usuario solo ve sus stores
alter view public.view_annual_sales_by_store set (security_invoker = true);
