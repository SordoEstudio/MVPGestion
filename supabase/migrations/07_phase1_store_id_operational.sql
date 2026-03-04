-- Fase 1: Añadir store_id a tablas operativas y backfill

-- Store por defecto (debe existir tras 06)
do $$
declare
  default_store_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
begin
  if not exists (select 1 from public.stores where id = default_store_id) then
    insert into public.stores (id, name, limite_anual) values (default_store_id, 'Comercio Demo', 12000000);
  end if;
end $$;

-- 1. categories
alter table public.categories add column if not exists store_id uuid references public.stores(id) on delete cascade;
update public.categories set store_id = 'b0000000-0000-0000-0000-000000000001'::uuid where store_id is null;
alter table public.categories alter column store_id set not null;

-- 2. products
alter table public.products add column if not exists store_id uuid references public.stores(id) on delete cascade;
update public.products set store_id = 'b0000000-0000-0000-0000-000000000001'::uuid where store_id is null;
alter table public.products alter column store_id set not null;

-- 3. people
alter table public.people add column if not exists store_id uuid references public.stores(id) on delete cascade;
update public.people set store_id = 'b0000000-0000-0000-0000-000000000001'::uuid where store_id is null;
alter table public.people alter column store_id set not null;

-- 4. transactions
alter table public.transactions add column if not exists store_id uuid references public.stores(id) on delete cascade;
update public.transactions set store_id = 'b0000000-0000-0000-0000-000000000001'::uuid where store_id is null;
alter table public.transactions alter column store_id set not null;

-- 5. transaction_items (store_id vía transaction; opcional denormalizar - por ahora no, RLS por transaction)
-- No añadimos store_id a transaction_items; el filtro se hace por transaction.store_id

-- 6. payments (store_id vía transaction; opcional - RLS por transaction)
-- No añadimos store_id a payments; el filtro se hace por transaction.store_id

-- units se dejan globales (sin store_id)
