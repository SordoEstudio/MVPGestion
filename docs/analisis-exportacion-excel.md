# Análisis: secciones y datos exportables a Excel

Además de **Informes** (reportes de facturación ya existentes) y **Productos** (export/import implementado), estas son las secciones y datos que conviene poder exportar a Excel para uso práctico del usuario.

## Ya implementado
- **Informes / Reportes**: facturación por período (mensual/anual), desglose por método de pago.
- **Productos**: exportar lista (Nombre, Precio, Categoría, Stock, Unidad); importar desde Excel con el mismo formato.
- **Contador – Impositivo**: ventas, resumen mensual, libro de ingresos, cuentas a cobrar/pagar por período.

## Recomendado para implementar

### 1. **Personas (clientes y proveedores)**
- **Exportar**: nombre, teléfono, tipo (cliente/proveedor), saldo pendiente.
- **Uso**: enviar a contador, conciliar saldos, listados para cobranza o pago.

### 2. **Movimientos / Historial**
- **Exportar**: filtrado por tipo (ventas, gastos, ingresos) y rango de fechas; columnas: fecha, tipo, descripción, monto, entidad (cliente/proveedor), estado (normal/anulado).
- **Uso**: auditoría, backup, análisis en Excel o Google Sheets.

### 3. **Caja (movimientos de caja)**
- **Exportar**: ingresos y egresos del período seleccionado (Hoy / Este mes), con fecha, concepto, monto, método de pago.
- **Uso**: arqueo, cierre de caja, conciliación bancaria.

### 4. **Ventas (resumen o detalle)**
- **Exportar**: por rango de fechas; opción “resumen” (total por día o por mes) o “detalle” (cada venta con ítems).
- **Uso**: análisis de ventas, comparativas, presentaciones.

### 5. **Compras / Gastos**
- **Exportar**: gastos por período, proveedor, categoría, monto, fecha.
- **Uso**: control de gastos, informe a contador, presupuesto.

### 6. **Categorías**
- **Exportar**: nombre, color (opcional); poco volumen pero útil para backup o migración.
- **Importar**: ya se puede hacer vía productos (columna Categoría); import masivo de solo categorías sería opcional.

## Prioridad sugerida
1. **Personas** – alto uso (cobranzas, pagos, contador).
2. **Movimientos** – alto uso (auditoría y respaldo).
3. **Caja** – medio (cierre de caja).
4. **Ventas (detalle)** – medio (análisis).
5. **Compras** – medio (control de gastos).
6. **Categorías** – bajo (backup).

## Notas técnicas
- Reutilizar el patrón de **Productos** y **Reportes**: `xlsx` en cliente, columnas claras, nombre de archivo con fecha o período.
- Para listados grandes (movimientos), valorar paginación o límite (ej. último año) para no saturar memoria y descarga.
