create or replace function public.finalize_sale(
  p_store_id  uuid,
  p_total_amount numeric,
  p_entity_id bigint,
  p_items     jsonb,
  p_payments  jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_transaction_id uuid;
  v_credit_total   numeric;
begin
  insert into public.transactions (type, total_amount, status, entity_id, store_id)
  values ('SALE', p_total_amount, 'COMPLETED', p_entity_id, p_store_id)
  returning id into v_transaction_id;

  insert into public.transaction_items
    (transaction_id, product_id, product_name, quantity, unit_price, total_price)
  select
    v_transaction_id,
    (item->>'product_id')::bigint,
    item->>'product_name',
    (item->>'quantity')::numeric,
    (item->>'unit_price')::numeric,
    (item->>'total_price')::numeric
  from jsonb_array_elements(p_items) item;

  insert into public.payments (transaction_id, amount, method)
  select
    v_transaction_id,
    (p->>'amount')::numeric,
    p->>'method'
  from jsonb_array_elements(p_payments) p;

  select coalesce(sum((p->>'amount')::numeric), 0)
  into v_credit_total
  from jsonb_array_elements(p_payments) p
  where p->>'method' = 'CREDIT_CUSTOMER';

  if v_credit_total > 0 and p_entity_id is not null then
    update public.people
    set balance = balance + v_credit_total
    where id = p_entity_id;
  end if;

  return v_transaction_id;
end;
$$;
