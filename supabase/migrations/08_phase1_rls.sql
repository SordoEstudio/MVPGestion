-- Fase 1: RLS por store_id (función get_my_store_ids + políticas)

-- Función que devuelve los store_id a los que el usuario actual tiene acceso
create or replace function public.get_my_store_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select store_id from public.user_profiles where user_id = auth.uid() and store_id is not null
  union
  select s.id from public.stores s
  inner join public.user_profiles up on up.accountant_id = s.accountant_id and up.user_id = auth.uid();
$$;

-- Revocar políticas públicas existentes si las hay (depende del estado del proyecto)
-- drop policy if exists "Allow public access" on public.categories;
-- etc.

-- categories
alter table public.categories enable row level security;
drop policy if exists "Allow public access" on public.categories;
create policy "store_scoped" on public.categories for all
  using (store_id in (select get_my_store_ids()))
  with check (store_id in (select get_my_store_ids()));

-- products
alter table public.products enable row level security;
drop policy if exists "Allow public access" on public.products;
create policy "store_scoped" on public.products for all
  using (store_id in (select get_my_store_ids()))
  with check (store_id in (select get_my_store_ids()));

-- people
alter table public.people enable row level security;
drop policy if exists "Allow public access" on public.people;
create policy "store_scoped" on public.people for all
  using (store_id in (select get_my_store_ids()))
  with check (store_id in (select get_my_store_ids()));

-- transactions
alter table public.transactions enable row level security;
drop policy if exists "Allow public access" on public.transactions;
create policy "store_scoped" on public.transactions for all
  using (store_id in (select get_my_store_ids()))
  with check (store_id in (select get_my_store_ids()));

-- transaction_items: acceso vía transaction
alter table public.transaction_items enable row level security;
drop policy if exists "Allow public access" on public.transaction_items;
create policy "store_scoped" on public.transaction_items for all
  using (
    transaction_id in (select id from public.transactions where store_id in (select get_my_store_ids()))
  )
  with check (
    transaction_id in (select id from public.transactions where store_id in (select get_my_store_ids()))
  );

-- payments: acceso vía transaction
alter table public.payments enable row level security;
drop policy if exists "Allow public access" on public.payments;
create policy "store_scoped" on public.payments for all
  using (
    transaction_id in (select id from public.transactions where store_id in (select get_my_store_ids()))
  )
  with check (
    transaction_id in (select id from public.transactions where store_id in (select get_my_store_ids()))
  );

-- stores: contador ve sus stores; store_user no necesita listar stores (solo su store_id en profile)
create policy "accountant_own_stores" on public.stores for select
  using (accountant_id in (select accountant_id from public.user_profiles where user_id = auth.uid()));
create policy "store_user_own_store" on public.stores for select
  using (id in (select get_my_store_ids()));

-- accountants: solo lectura propia (para mostrar datos del contador)
create policy "accountant_read_own" on public.accountants for select
  using (id in (select accountant_id from public.user_profiles where user_id = auth.uid()));

-- units: lectura global (sin store_id)
drop policy if exists "Allow public access" on public.units;
create policy "read_all" on public.units for select using (true);
