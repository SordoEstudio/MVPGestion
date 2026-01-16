
-- Update constraints to support new features

-- 1. Allow 'CREDIT_PROVIDER' in payments.method
alter table public.payments drop constraint payments_method_check;
alter table public.payments add constraint payments_method_check 
check (method in ('CASH', 'TRANSFER', 'QR', 'CREDIT_CUSTOMER', 'CREDIT_PROVIDER'));

-- 2. Allow 'DEBT_PAYMENT' and 'DEBT_COLLECTION' in transactions.type
alter table public.transactions drop constraint transactions_type_check;
alter table public.transactions add constraint transactions_type_check 
check (type in ('SALE', 'EXPENSE', 'MANUAL_ENTRY', 'DEBT_PAYMENT', 'DEBT_COLLECTION', 'INCOME'));
-- Note: 'INCOME' added for positive manual entries if needed, or we can use MANUAL_ENTRY for both with sign.
-- Let's stick to MANUAL_ENTRY and use sign? Or allow INCOME.
-- Added DEBT_COLLECTION (Receiving money from client) and DEBT_PAYMENT (Paying money to provider)
