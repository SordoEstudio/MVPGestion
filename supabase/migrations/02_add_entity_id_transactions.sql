
-- Add entity_id to transactions to link Sales to Clients and Expenses to Providers
alter table public.transactions 
add column entity_id bigint references public.people(id) on delete set null;
