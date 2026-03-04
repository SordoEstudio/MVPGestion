# Diseño del Panel (Dashboard)

Principios: **claridad**, **simplicidad**, **relevancia**.

---

## Filtro temporal común

- **Hoy** / **Este mes**: aplicado en todas las vistas donde tenga sentido (Resumen, Caja, Compras, Productos por ventas). En Personas no filtra por fecha (son saldos actuales).

---

## 1. Vista Resumen

**Objetivo:** Responder “¿Cómo va el negocio?” en un vistazo.

| Dato / KPI         | Descripción                                                                  | Relevancia                        |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------- |
| Ventas totales     | Suma de `transactions` tipo SALE en el período                               | Indicador principal de ingresos   |
| Gastos / Compras   | Suma de EXPENSE en el período                                                | Salida de dinero                  |
| Cobros recibidos   | Suma de pagos (CASH, TRANSFER, QR) de ventas y cobros de deuda en el período | Lo que realmente entró al negocio |
| Pendiente de cobro | Suma de `balance` de personas tipo CLIENT                                    | Dinero por cobrar (fiado)         |

**Gráfico:** Ventas por mes (últimos 12 meses) — ya existente; mantiene contexto histórico.

**Bloques adicionales:**

- **Estado de caja (resumen):** Efectivo vs transferencias en el período (porcentajes o montos). Breve, sin duplicar toda la lógica de /caja.
- **Próximos cobros:** Lista real de clientes con `balance > 0` (nombre, monto), enlace a Personas. Sin placeholders.

**CTA:** Enlace a Informes (PDF/Excel).

---

## 2. Vista Caja

**Objetivo:** Entender entradas/salidas y saldo por tipo de medio (efectivo vs transferencia).

| Dato / KPI              | Descripción                                                       | Relevancia              |
| ----------------------- | ----------------------------------------------------------------- | ----------------------- |
| Saldo total teórico     | (Efectivo entrado − salido) + (Transferencias entradas − salidas) | Estado actual de caja   |
| Efectivo entrado        | Pagos en CASH/QR de ventas, cobros, ingresos manuales             | Cuánto cash entró       |
| Efectivo salido         | Pagos en CASH de gastos y pagos a proveedores                     | Cuánto cash salió       |
| Transferencias entradas | Idem con método TRANSFER (entradas)                               | Flujo bancario entrante |
| Transferencias salidas  | Idem TRANSFER (salidas)                                           | Flujo bancario saliente |

**Contenido secundario:**

- **Últimos movimientos:** Lista corta (ej. 10) de movimientos recientes con tipo (Venta, Gasto, Cobro, etc.) y método. Enlace a **Caja** (/caja) para detalle completo y movimientos manuales.

Sin gráficos complejos aquí; la claridad está en los números y la lista.

---

## 3. Vista Productos

**Objetivo:** Qué se vende y qué hay que reponer.

| Dato / KPI               | Descripción                                                   | Relevancia             |
| ------------------------ | ------------------------------------------------------------- | ---------------------- |
| Valor inventario         | Σ (stock × precio) por producto                               | Valor del stock actual |
| Productos con stock bajo | Cantidad de productos con stock &lt; umbral (ej. 5) o &lt;= 0 | Alerta de reposición   |
| Total productos          | Cantidad de productos activos                                 | Tamaño del catálogo    |

**Contenido:**

- **Más vendidos (período):** Top 5–10 productos por monto o cantidad vendida (desde `transaction_items` + ventas en el período). Tabla simple: nombre, cantidad, monto.
- **Stock bajo:** Lista de productos con stock bajo (nombre, stock actual, opcional categoría). Enlace a Productos para editar.

Opcional: mini gráfico de ventas por categoría (barras). Solo si hay pocas categorías y aporta.

---

## 4. Vista Compras

**Objetivo:** Cuánto se gasta y con quién (proveedores).

| Dato / KPI              | Descripción                                    | Relevancia             |
| ----------------------- | ---------------------------------------------- | ---------------------- |
| Total compras (período) | Suma de `transactions` tipo EXPENSE en Hoy/Mes | Gasto en compras       |
| Cantidad de compras     | Número de transacciones EXPENSE en el período  | Frecuencia             |
| Promedio por compra     | Total compras / cantidad                       | Tamaño medio de compra |

**Contenido:**

- **Por proveedor:** Si las compras tienen `entity_id` (proveedor), tabla o barras: proveedor, monto total en el período. Si no hay entity_id, omitir o mostrar “Sin asignar”.
- **Últimas compras:** Lista (fecha, monto, proveedor si existe). Enlace a Compras (/compras).

---

## 5. Vista Personas

**Objetivo:** Quién me debe (clientes) y a quién debo (proveedores).

| Dato / KPI            | Descripción                                                        | Relevancia            |
| --------------------- | ------------------------------------------------------------------ | --------------------- |
| Total a cobrar        | Suma de `balance` de personas CLIENT (balance &gt; 0 = me deben)   | Fiado pendiente       |
| Total a pagar         | Suma de `balance` de personas PROVIDER (balance &gt; 0 = les debo) | Deuda con proveedores |
| Clientes con deuda    | Cantidad de clientes con balance &gt; 0                            | Cuántos deudores      |
| Proveedores con deuda | Cantidad de proveedores con balance &gt; 0                         | Cuántos acreedores    |

**Contenido:**

- **Principales deudores:** Lista de clientes con balance &gt; 0 ordenados por monto (nombre, monto). Enlace a Personas.
- **Principales acreedores:** Lista de proveedores con balance &gt; 0 (nombre, monto).

Sin filtro temporal; son saldos actuales.

---

## Navegación entre vistas

- En la misma página **Panel** (/dashboard): selector de vista (tabs o pills) **Resumen | Caja | Productos | Compras | Personas**.
- Filtro **Hoy / Este mes** visible en Resumen, Caja, Compras y (donde aplique) Productos; en Personas no se muestra o se desactiva.

---

## Resumen por pantalla

| Vista     | KPIs clave                             | Contenido secundario                           |
| --------- | -------------------------------------- | ---------------------------------------------- |
| Resumen   | Ventas, Gastos, Cobros, Pend. cobro    | Gráfico 12 meses, estado caja, próximos cobros |
| Caja      | Saldo, Efectivo in/out, Transf. in/out | Últimos movimientos                            |
| Productos | Valor inventario, Stock bajo, Total    | Más vendidos, lista stock bajo                 |
| Compras   | Total, Cantidad, Promedio              | Por proveedor, últimas compras                 |
| Personas  | A cobrar, A pagar, Nº deudores         | Lista deudores, lista acreedores               |
