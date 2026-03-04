-- Seed demo: datos de prueba para el Comercio Demo (un cliente, un contador).
-- Borra datos operativos del store demo y vuelve a insertar productos, personas, movimientos.
-- Ejecutar una sola vez o cuando se quiera resetear el demo.

do $$
declare
  v_store_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_cat_pan bigint;
  v_cat_lac bigint;
  v_cat_beb bigint;
  v_cat_alm bigint;
  v_unit_kg bigint;
  v_person1 bigint;  -- cliente
  v_person2 bigint;  -- cliente
  v_person3 bigint;  -- proveedor
  v_person4 bigint;  -- proveedor
  v_tx uuid;
  v_created date;
  i int;
begin
  -- 1. Borrar datos del store demo (respeta FKs: items y payments vía transaction)
  delete from public.payments where transaction_id in (select id from public.transactions where store_id = v_store_id);
  delete from public.transaction_items where transaction_id in (select id from public.transactions where store_id = v_store_id);
  delete from public.transactions where store_id = v_store_id;
  delete from public.products where store_id = v_store_id;
  delete from public.people where store_id = v_store_id;
  delete from public.categories where store_id = v_store_id;

  -- 2. Categorías
  insert into public.categories (name, color, store_id) values
    ('Panadería', 'bg-amber-200 text-amber-900', v_store_id),
    ('Lácteos', 'bg-blue-100 text-blue-900', v_store_id),
    ('Bebidas', 'bg-purple-100 text-purple-900', v_store_id),
    ('Almacén', 'bg-gray-100 text-gray-900', v_store_id);
  select id into v_cat_pan from public.categories where store_id = v_store_id and name = 'Panadería' limit 1;
  select id into v_cat_lac from public.categories where store_id = v_store_id and name = 'Lácteos' limit 1;
  select id into v_cat_beb from public.categories where store_id = v_store_id and name = 'Bebidas' limit 1;
  select id into v_cat_alm from public.categories where store_id = v_store_id and name = 'Almacén' limit 1;
  select id into v_unit_kg from public.units where symbol = 'kg' limit 1;

  -- 3. Personas (clientes y proveedores)
  insert into public.people (name, phone, type, balance, store_id) values
    ('Juan Pérez (vecino)', '11 1234-5678', 'CLIENT', 0, v_store_id),
    ('Kiosco La Esquina', null, 'CLIENT', 0, v_store_id),
    ('Mayorista Lácteos SA', '11 9876-5432', 'PROVIDER', 0, v_store_id),
    ('Distribuidora Bebidas', null, 'PROVIDER', 0, v_store_id),
    ('Panadería Central', null, 'PROVIDER', 0, v_store_id);
  select id into v_person1 from public.people where store_id = v_store_id and name = 'Juan Pérez (vecino)' limit 1;
  select id into v_person2 from public.people where store_id = v_store_id and name = 'Kiosco La Esquina' limit 1;
  select id into v_person3 from public.people where store_id = v_store_id and name = 'Mayorista Lácteos SA' limit 1;
  select id into v_person4 from public.people where store_id = v_store_id and name = 'Distribuidora Bebidas' limit 1;

  -- 4. Productos
  insert into public.products (name, price, category_id, stock, unit_id, store_id) values
    ('Pan francés (kg)', 1800, v_cat_pan, 0, v_unit_kg, v_store_id),
    ('Medialunas x6', 1200, v_cat_pan, 0, null, v_store_id),
    ('Leche entera 1L', 950, v_cat_lac, 0, null, v_store_id),
    ('Yogur frutilla 190g', 450, v_cat_lac, 0, null, v_store_id),
    ('Coca Cola 2.25L', 2200, v_cat_beb, 0, null, v_store_id),
    ('Agua mineral 2L', 650, v_cat_beb, 0, null, v_store_id),
    ('Yerba mate 500g', 2800, v_cat_alm, 0, null, v_store_id),
    ('Galletitas oreo', 1100, v_cat_alm, 0, null, v_store_id),
    ('Arroz 1kg', 850, v_cat_alm, 0, null, v_store_id),
    ('Aceite 900ml', 2100, v_cat_alm, 0, null, v_store_id);

  -- 5. Transacciones de los últimos 4 meses (ventas, gastos, cobros, pagos)
  for i in 0..3 loop
    v_created := (current_date - (i * 30 + (i * 2))::int);  -- ~ hace 0, 32, 64, 96 días

    -- Venta 1 (efectivo)
    insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
    values ('SALE', 3500, 'COMPLETED', v_store_id, null, (v_created - 2)::timestamp with time zone)
    returning id into v_tx;
    insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
    values (v_tx, 'Leche entera 1L', 2, 950, 1900), (v_tx, 'Pan francés (kg)', 1, 1600, 1600);
    insert into public.payments (transaction_id, amount, method) values (v_tx, 3500, 'CASH');

    -- Venta 2 (mixto, cliente fiado)
    insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
    values ('SALE', 5500, 'COMPLETED', v_store_id, v_person1, (v_created - 1)::timestamp with time zone)
    returning id into v_tx;
    insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
    values (v_tx, 'Coca Cola 2.25L', 1, 2200, 2200), (v_tx, 'Yerba mate 500g', 1, 2800, 2800), (v_tx, 'Galletitas oreo', 1, 500, 500);
    insert into public.payments (transaction_id, amount, method) values (v_tx, 3000, 'CASH'), (v_tx, 2500, 'CREDIT_CUSTOMER');

    -- Venta 3 (transferencia)
    insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
    values ('SALE', 4200, 'COMPLETED', v_store_id, v_person2, v_created::timestamp with time zone)
    returning id into v_tx;
    insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
    values (v_tx, 'Medialunas x6', 2, 1200, 2400), (v_tx, 'Cafe y leche', 1, 1800, 1800);
    insert into public.payments (transaction_id, amount, method) values (v_tx, 4200, 'TRANSFER');

    -- Gasto (proveedor)
    insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
    values ('EXPENSE', 15000, 'COMPLETED', v_store_id, v_person3, (v_created + 1)::timestamp with time zone)
    returning id into v_tx;
    insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
    values (v_tx, 'Reposición Lácteos', 1, 15000, 15000);
    insert into public.payments (transaction_id, amount, method) values (v_tx, 10000, 'TRANSFER'), (v_tx, 5000, 'CREDIT_PROVIDER');

    -- Gasto (proveedor 2)
    insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
    values ('EXPENSE', 8500, 'COMPLETED', v_store_id, v_person4, (v_created + 2)::timestamp with time zone)
    returning id into v_tx;
    insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
    values (v_tx, 'Reposición Bebidas', 1, 8500, 8500);
    insert into public.payments (transaction_id, amount, method) values (v_tx, 8500, 'CASH');

    -- Ingreso manual (caja)
    insert into public.transactions (type, total_amount, status, store_id, created_at)
    values ('INCOME', 2000, 'COMPLETED', v_store_id, (v_created + 3)::timestamp with time zone)
    returning id into v_tx;
    insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
    values (v_tx, '[MANUAL] Aporte caja', 1, 2000, 2000);
    insert into public.payments (transaction_id, amount, method) values (v_tx, 2000, 'CASH');
  end loop;

  -- 6. Cobro de deuda (DEBT_COLLECTION) - un par para que haya saldo actualizado
  v_created := current_date - 15;
  insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
  values ('DEBT_COLLECTION', 2500, 'COMPLETED', v_store_id, v_person1, v_created::timestamp with time zone)
  returning id into v_tx;
  insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
  values (v_tx, 'Cobro deuda cliente', 1, 2500, 2500);
  insert into public.payments (transaction_id, amount, method) values (v_tx, 2500, 'CASH');

  -- 7. Pago a proveedor (DEBT_PAYMENT)
  insert into public.transactions (type, total_amount, status, store_id, entity_id, created_at)
  values ('DEBT_PAYMENT', 5000, 'COMPLETED', v_store_id, v_person3, (v_created + 1)::timestamp with time zone)
  returning id into v_tx;
  insert into public.transaction_items (transaction_id, product_name, quantity, unit_price, total_price)
  values (v_tx, 'Pago deuda proveedor', 1, 5000, 5000);
  insert into public.payments (transaction_id, amount, method) values (v_tx, 5000, 'TRANSFER');

  -- 8. Actualizar saldos: un cliente con deuda (a cobrar) y un proveedor al que les debemos (a pagar)
  update public.people set balance = 0 where store_id = v_store_id and name = 'Kiosco La Esquina';
  update public.people set balance = 0 where store_id = v_store_id and name = 'Mayorista Lácteos SA';
  update public.people set balance = 0 where store_id = v_store_id and name = 'Panadería Central';
  update public.people set balance = 3500 where store_id = v_store_id and name = 'Juan Pérez (vecino)';   -- nos debe (para probar Cobrar)
  update public.people set balance = 3000 where store_id = v_store_id and name = 'Distribuidora Bebidas'; -- les debemos (para probar Pagar)

end $$;
