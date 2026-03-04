# Análisis del sistema — Pantallas y funcionalidades

Documento informativo sobre el estado actual de la aplicación: pantallas, flujos y datos. Sin carácter comercial.

---

## 1. Visión general

Aplicación web de gestión para un negocio local (ventas, compras, caja, personas, productos). Next.js (App Router), Supabase como backend. Dos perfiles de acceso: **Local/Dueño** y **Contador/Administrador**, elegidos en la pantalla de entrada y guardados en `localStorage` (no hay autenticación real).

---

## 2. Pantallas y funcionalidades

### 2.1 Entrada (raíz `/`)

- **Qué hace:** Pantalla de selección de perfil. Dos botones: "Local / Dueño" y "Contador / Administrador". Guarda el rol en `localStorage` y redirige a `/dashboard` o `/contador`.
- **Nota:** No hay login con usuario/contraseña ni gestión de sesión.

---

### 2.2 Panel / Dashboard (`/dashboard`)

- **Qué hace:** Panel con varias vistas en pestañas (mismo filtro temporal Hoy / Este mes donde aplica).
  - **Resumen:** KPIs del período (ventas totales, gastos/compras, cobros recibidos, pendiente de cobro), gráfico de ventas últimos 12 meses, estado de caja (efectivo vs transferencias), lista de próximos cobros (clientes con balance > 0), enlace a Informes.
  - **Ventas:** Total ventas del período, cantidad de ventas, desglose efectivo/transferencias, últimas ventas (lista). Enlace a Ventas.
  - **Compras:** Total compras, cantidad, promedio por compra, desglose por proveedor (si tienen `entity_id`), últimas compras. Enlace a Compras.
  - **Caja:** Saldo total teórico, efectivo entrado/salido, neto transferencias, últimos 10 movimientos (tipo + monto; ingresos en verde, egresos en rojo con -$). Enlace a Caja.
  - **Personas:** Total a cobrar (clientes), total a pagar (proveedores), cantidad de deudores/acreedores, listas de principales deudores y acreedores. Enlace a Personas. Sin filtro de fecha (saldos actuales).
  - **Productos:** Valor inventario, total productos, productos con stock bajo (<5), más vendidos en el período, lista de stock bajo. Enlace a Productos.
- **Filtro temporal:** Hoy / Este mes (salvo en Personas). Fechas se envían en UTC para consultas a Supabase.

---

### 2.3 Ventas (`/ventas`)

- **Qué hace:** Carga de ventas con carrito.
  - Listado de productos (grid o lista), filtro por categoría y búsqueda. Productos con `unit_id` (ej. kg, g) muestran badge de unidad.
  - Al agregar producto: si tiene precio 0 o unidad de venta, abre modal para ingresar precio y/o cantidad (gramaje u otra unidad; atajos 250g, 500g, 1kg para peso). Si no, suma 1 al carrito.
  - Carrito lateral: cantidad, nombre, subtotal; para productos con unidad se muestra cantidad + símbolo (ej. 0.5 kg). Botones +/- y quitar.
  - Al cobrar: modal de pago. Opciones efectivo, transferencia, QR, fiado (CREDIT_CUSTOMER). Permite dividir pago en varios métodos. Opcional: elegir cliente (para fiado o registro); se puede crear cliente nuevo en modal.
  - Al confirmar: se crea transacción tipo SALE, `transaction_items` por línea del carrito, uno o más `payments`. Si hay fiado, se actualiza `balance` del cliente (persona tipo CLIENT). Si se eligió proveedor no se usa para ventas (solo compras).
- **Datos:** Productos con categoría y unidad; personas tipo CLIENT para fiado y selección.

---

### 2.4 Compras (`/compras`)

- **Qué hace:** Registro de gastos/compras.
  - Selección de proveedor (personas tipo PROVIDER). Carrito de ítems: manual (descripción + monto + categoría: Reposición, Alquiler, Servicios, etc.) o desde producto (reposición con precio del producto).
  - Modal de pago: efectivo, transferencia, a cuenta (CREDIT_PROVIDER). División de pago permitida.
  - Al confirmar: transacción tipo EXPENSE, `transaction_items` por línea, `payments`. Si hay CREDIT_PROVIDER se actualiza `balance` del proveedor (persona tipo PROVIDER). La transacción guarda `entity_id` = proveedor.
- **Datos:** Personas PROVIDER, productos (opcional para ítems de reposición).

---

### 2.5 Caja (`/caja`)

- **Qué hace:** Vista de caja por medio de pago.
  - Tarjetas: Saldo total teórico (efectivo + transferencias, entradas menos salidas), Efectivo (entrada/salida, neto), Transferencias (idem). Al hacer clic en Efectivo o Transferencias se abre detalle con lista de movimientos de ese método.
  - Movimientos manuales: botón "Movimiento" → modal Ingreso/Egreso, monto, descripción, método (efectivo/transferencia). Crea transacción INCOME o EXPENSE, un `transaction_item` de tipo “[MANUAL] descripción” y un `payment`.
- **Cálculo:** Los totales se obtienen sumando todos los `payments` según tipo de transacción (SALE, INCOME, DEBT_COLLECTION = entrada; EXPENSE, DEBT_PAYMENT = salida) y método (CASH/QR vs TRANSFER).

---

### 2.6 Personas (`/personas`)

- **Qué hace:** ABM de personas (clientes y proveedores).
  - Listado con filtro por tipo (Todos, Clientes, Proveedores) y búsqueda por nombre.
  - Alta/edición: nombre, teléfono, tipo (CLIENT/PROVIDER). El balance no se edita directo; se modifica con ventas fiado, cobros, compras a cuenta y pagos a proveedor.
  - Modal de cobro/pago de deuda: seleccionar persona, monto, método (efectivo/transferencia). Crea transacción DEBT_COLLECTION (cliente) o DEBT_PAYMENT (proveedor) y el `payment` correspondiente; actualiza `balance` de la persona.
- **Datos:** Tabla `people`: id, name, phone, type, balance.

---

### 2.7 Productos (`/productos`)

- **Qué hace:** ABM de productos.
  - Listado en grid o lista, búsqueda por nombre. Productos con unidad muestran símbolo (kg, g, m, etc.).
  - Alta/edición: nombre, categoría, precio, stock, unidad de venta (select desde tabla `units`: unidad, g, kg, m, L, etc.). Si no se elige unidad = “pieza”.
- **Datos:** `products` (category_id, unit_id), `categories`, `units`.

---

### 2.8 Categorías (`/categorias`)

- **Qué hace:** ABM de categorías de productos. Nombre y color (paleta predefinida: amarillo, azul, verde, etc.). Sin más lógica; se usan en productos y en filtros de ventas.

---

### 2.9 Movimientos (`/movimientos`)

- **Qué hace:** Listado de transacciones con paginación (25 por página).
  - Filtros: tipo (Todas, SALE, EXPENSE, etc.), fecha desde/hasta.
  - Cada fila: fecha, tipo, monto, estado, ítems (producto, cantidad, total), pagos (método, monto), entidad (cliente/proveedor si hay `entity_id`). Transacciones anuladas se muestran con estado y estilo diferenciado.
  - Anulación: botón en transacciones con monto positivo que no sean ya una anulación. Modal con motivo. Crea transacción de contra-asiento (mismo tipo, monto negativo, `related_transaction_id` apuntando a la original, `description` “ANULACIÓN: …”). Para ventas con ítems se contempla reversión de stock (lógica en código). No se cambia `status` de la transacción original a ANNULLED en BD (el esquema tiene status pero las migraciones no lo modifican para anulaciones).
- **Datos:** `transactions` con `transaction_items`, `payments`, relación `entity` (people).

---

### 2.10 Informes (`/reportes`)

- **Qué hace:** Reporte de facturación por ventas.
  - Período: mensual (mes/año) o anual (año). Solo transacciones tipo SALE y status COMPLETED.
  - Muestra: total ventas, cantidad de transacciones, desglose por método de pago (Efectivo, Transferencia, QR, Fiado). Si es anual, desglose por mes.
  - Exportar Excel (xlsx): mismo resumen + desglose por método y, si aplica, por mes.
  - No hay exportación PDF implementada en el flujo actual (el CTA del dashboard lleva aquí).
- **Datos:** Consulta a `transactions` + `payments` filtrada por tipo SALE y fechas.

---

### 2.11 Contador (`/contador`)

- **Qué hace:** Vista para perfil Contador/Administrador.
  - Listado de clientes (personas tipo CLIENT). Al elegir un cliente se muestra un panel con estadísticas (ventas, compras, cobros, efectivo, crédito). En el código actual las cifras mostradas son **simuladas** (valores fijos), no se filtran transacciones por ese cliente ni por workspace.
  - Gráficos (barras/líneas) con Recharts usando esos datos simulados.
- **Limitación:** No hay multi-tenant ni “clientes del contador”; todos los datos son de un solo negocio. La selección de cliente no cambia los datos reales.

---

## 3. Modelo de datos (resumen)

- **categories:** id, name, color.
- **products:** id, name, price, stock, category_id, unit_id (FK units). Precio por unidad según unidad; en ventas con unidad “kg” la cantidad se guarda en kg (entrada en gramos se divide por 1000).
- **units:** id, name, symbol (u, g, kg, m, L, etc.).
- **people:** id, name, phone, type (CLIENT | PROVIDER), balance. Reemplaza la antigua tabla customers; proveedores en la misma tabla.
- **transactions:** id (uuid), type (SALE | EXPENSE | MANUAL_ENTRY | DEBT_PAYMENT | DEBT_COLLECTION | INCOME), total_amount, status, created_at, entity_id (FK people, opcional), related_transaction_id, description.
- **transaction_items:** transaction_id, product_id (opcional), product_name, quantity, unit_price, total_price.
- **payments:** transaction_id, amount, method (CASH | TRANSFER | QR | CREDIT_CUSTOMER | CREDIT_PROVIDER).

RLS habilitado en todas las tablas; políticas actuales permiten todo (sin restricción por usuario).

---

## 4. Flujos principales

1. **Venta:** Productos al carrito → (opcional cliente/fiado) → Pago (uno o más métodos) → transaction SALE + items + payments; si fiado, balance del cliente aumenta.
2. **Cobro de deuda:** Personas → Cobro/Pago deuda → DEBT_COLLECTION + payment → balance del cliente disminuye.
3. **Compra:** Proveedor + ítems (manual o producto) → Pago (incl. a cuenta) → EXPENSE + items + payments; si a cuenta, balance del proveedor aumenta. entity_id = proveedor.
4. **Pago a proveedor:** Personas → Pago deuda → DEBT_PAYMENT + payment → balance del proveedor disminuye.
5. **Caja manual:** Caja → Movimiento → INCOME o EXPENSE + item “[MANUAL]” + payment.
6. **Anulación:** Movimientos → Anular → nueva transacción mismo tipo, monto negativo, related_transaction_id y description.

---

## 5. Tecnologías y contexto

- **Front:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide icons, react-hot-toast, Recharts (contador e informes), xlsx (export Excel).
- **Back:** Supabase (Postgres, API REST). Autenticación: solo rol en `localStorage`, sin Supabase Auth en uso.
- **Estado:** Context para carrito de ventas (CartContext). Resto en estado local por pantalla.

---

## 6. Limitaciones y detalles a tener en cuenta

- Un solo negocio por base de datos; el perfil Contador no tiene multi-tenant ni datos reales por cliente seleccionado.
- Filtro Hoy/Mes del dashboard usa UTC; correcto si Supabase guarda en UTC y el cliente está en una zona coherente.
- En movimientos, la anulación no pone la transacción original en status ANNULLED; la reversión se identifica por transacción vinculada con monto negativo.
- Stock: se actualiza en anulaciones de ventas; en compras no hay lógica automática de aumento de stock al registrar reposición.
- Reportes: solo ventas (SALE); no hay informe de gastos ni de caja consolidado.
- Unidades: productos con unit_id permiten en ventas cantidad en esa unidad; los atajos 250/500/1000 gr están pensados para kg (conversión a kg automática).

---

*Documento generado a partir del análisis del código y del esquema de base de datos. Refleja el estado actual del sistema.*
