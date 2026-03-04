# Viabilidad: datos y movimientos mock para cliente "Demo"

## Objetivo
Tener un cliente inventado "Demo" con datos y movimientos de ejemplo para mostrar el sistema en funcionamiento, sobre todo la parte de **contadores** (vista estudio, clientes, fiscal, informes).

## Enfoques posibles

### 1. **Store "Demo" + seed en base de datos (recomendado)**
- Crear una tienda "Cliente Demo" asociada al estudio (o a un contador de prueba).
- Ejecutar una migración o script SQL que:
  - Inserte productos, categorías, personas (clientes/proveedores) de ejemplo.
  - Inserte transacciones de los últimos meses (ventas, gastos, cobros, pagos) con montos y fechas coherentes.
- **Pros**: datos reales en Supabase, RLS y flujos reales (contador ve el cliente, dashboard, fiscal, etc.).  
- **Contras**: hay que mantener el script y, si se ejecuta en prod, limpiar o marcar claramente como "demo".

### 2. **Datos mock solo en front (sin BD)**
- Pantallas de contador (dashboard estudio, vista cliente) consumen JSON estático o generado en memoria.
- **Pros**: no toca la BD, fácil de resetear.  
- **Contras**: no prueba RLS, ni informes reales, ni flujos de anulación/caja; experiencia menos fiel.

### 3. **Híbrido: store Demo con seed + opción "Resetear demo"**
- Igual que 1, pero en la UI (solo para rol contador o en desarrollo) un botón "Resetear datos demo" que:
  - Borra o reemplaza transacciones/ítems del store Demo.
  - Vuelve a insertar el seed (o una versión reducida).
- **Pros**: siempre se puede volver a un estado conocido para demos.  
- **Contras**: requiere permisos y cuidado en producción (solo para store Demo).

## Viabilidad técnica

- **Backend**: Supabase ya tiene multi-tenant por `store_id`; un store "Demo" es un caso más. Las migraciones pueden insertar en `products`, `categories`, `people`, `transactions`, `transaction_items`, `payments` con `store_id` del Demo.
- **RLS**: si el contador tiene acceso al store Demo (vía `stores` / `accountants`), verá todos los datos de ese store sin cambios adicionales.
- **Volumen**: un seed razonable (20–30 productos, 5–10 personas, 50–100 transacciones en 3–6 meses) es manejable y da buena sensación de uso real.
- **Fiscal**: la vista `view_annual_sales_by_store` y los KPIs de tope monotributo funcionan igual; solo hay que generar ventas con totales que den un gráfico creíble.

## Recomendación
- **Implementar opción 1**: migración `11_seed_demo_store.sql` (o similar) que:
  1. Cree o reutilice un store "Cliente Demo".
  2. Asigne ese store a un contador de prueba (o al primer contador).
  3. Inserte categorías, productos, personas y transacciones de ejemplo con fechas en el pasado reciente.
- Opcional después: botón "Resetear demo" en la vista del contador para ese store (opción 3), con confirmación y solo para stores marcados como demo.

## Implementado
- **Migración `11_seed_demo_data.sql`**: Seed demo para el Comercio Demo (`store_id` fijo). Al ejecutarla:
  1. Borra todos los datos operativos de ese store (categorías, productos, personas, transacciones, ítems, pagos).
  2. Inserta 4 categorías, 5 personas (2 clientes, 3 proveedores), 10 productos.
  3. Inserta ~26 transacciones repartidas en los últimos ~4 meses: ventas (efectivo, mixto con fiado, transferencia), gastos (con fiado y al contado), ingresos manuales, un cobro de deuda y un pago a proveedor.
  4. Deja un cliente (Juan Pérez) con saldo 3500 (a cobrar) y un proveedor (Distribuidora Bebidas) con saldo 3000 (a pagar) para probar Cobrar/Pagar.
- Se puede volver a ejecutar la migración para resetear el demo al mismo estado.

## Resumen
**Sí es viable** y encaja bien con la arquitectura actual. El trabajo principal es redactar el script SQL de seed y decidir si el store Demo se crea en cada entorno (dev/staging) o solo en demos.
