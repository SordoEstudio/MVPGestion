
-- Support for Cancellations / Counter-seats

-- 1. Add columns to transactions
alter table public.transactions 
add column if not exists related_transaction_id uuid references public.transactions(id),
add column if not exists description text;

-- 2. No need to update 'type' constraint if we use the same type (SALE/EXPENSE) with negative amounts, 
-- or we can rely on 'MANUAL_ENTRY' for cancellations. 
-- However, creating a 'SALE' with negative amount is the most accurate "Contra-asiento" for reporting.
-- Existing check: type in ('SALE', 'EXPENSE', 'MANUAL_ENTRY', 'DEBT_PAYMENT', 'DEBT_COLLECTION', 'INCOME')
-- We will stick to using the original type for the reversal to keep "Sales Category" stats correct usage.
