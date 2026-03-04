-- Fase 1: Tablas accountants, stores, user_profiles (multi-tenant + auth)

-- 1. Contadores
create table if not exists public.accountants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  auth_user_id uuid unique,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Comercios
create table if not exists public.stores (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  cuit text,
  categoria_monotributo text,
  limite_anual numeric(14,2),
  accountant_id uuid references public.accountants(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Perfil de usuario (vincula auth.uid() con rol y store/accountant)
create table if not exists public.user_profiles (
  user_id uuid primary key,
  role text not null check (role in ('store_user', 'accountant')),
  store_id uuid references public.stores(id) on delete set null,
  accountant_id uuid references public.accountants(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint store_user_has_store check (
    (role = 'store_user' and store_id is not null and accountant_id is null) or
    (role = 'accountant' and accountant_id is not null and store_id is null)
  )
);

alter table public.accountants enable row level security;
alter table public.stores enable row level security;
alter table public.user_profiles enable row level security;

-- Políticas básicas: user_profiles solo lectura propia (auth.uid() = user_id)
create policy "Users read own profile" on public.user_profiles
  for select using (auth.uid() = user_id);

-- Seed: un contador y un comercio por defecto (para migración)
insert into public.accountants (id, name, email) values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Contador Demo', 'contador@demo.com')
on conflict (email) do nothing;

insert into public.stores (id, name, accountant_id, limite_anual)
select 'b0000000-0000-0000-0000-000000000001'::uuid, 'Comercio Demo', 'a0000000-0000-0000-0000-000000000001'::uuid, 12000000
where not exists (select 1 from public.stores where id = 'b0000000-0000-0000-0000-000000000001'::uuid);
