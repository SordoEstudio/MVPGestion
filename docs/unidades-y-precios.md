# Cómo funcionan las medidas de unidad y los precios

## Resumen

- **Precio** del producto: siempre es **por unidad** de la medida elegida (por pieza, por kg, por metro, etc.).
- **Unidad de venta**: se elige al dar de alta/editar el producto. Define “a qué se refiere” el precio.
- En **ventas**, el total de una línea es **precio × cantidad** en esa unidad. No hay conversión automática entre subunidades (ej. gramos ↔ kg) todavía.

---

## 1. Dónde se configuran

### Tabla `units` (configuración global)

En la base de datos existe la tabla **`units`** con unidades disponibles para todos los comercios, por ejemplo:

| name           | symbol |
|----------------|--------|
| Unidad         | u      |
| Gramo          | g      |
| Kilogramo      | kg     |
| Metro          | m      |
| Centímetro     | cm     |
| Litro          | L      |
| Mililitro      | ml     |
| Centímetro cuadrado | cm² |
| Centímetro cúbico   | cm³ |

Se pueden agregar más (por ejemplo docena, ½ docena) insertando filas en `units`.

### Producto: precio y unidad

En **Productos** (alta/edición) cada producto tiene:

- **Precio ($)**: número positivo. Es siempre “por la unidad que elijas abajo”.
- **Unidad de venta**: desplegable que usa la tabla `units`. Opciones típicas:
  - **Unidad (pieza)**: si no elegís ninguna unidad o elegís “Unidad”, el precio es **por unidad** (por 1 ítem).
  - **Kilogramo (kg), Gramo (g), Metro (m), Litro (L)**, etc.: el precio es **por kg**, **por g**, **por m**, **por L**, etc.

Ejemplos:

- Pan lactal, precio 800, unidad “Unidad” → 800 $/unidad (por paquete).
- Naranjas, precio 500, unidad “Kilogramo” → 500 $/kg.
- Tela, precio 1200, unidad “Metro” → 1200 $/m.

El sistema **no** convierte automáticamente entre, por ejemplo, gramos y kilogramos: el precio del producto es “por la unidad que elegiste”. Si cargás “kg”, ese valor es $/kg.

---

## 2. Cómo se usa en ventas

### Productos “por unidad” (sin unidad o unidad “u”)

- Al tocar el producto se agrega al carrito con **cantidad 1** (y se puede sumar más de 1).
- **Total línea** = precio del producto × cantidad.
- Ej.: precio 800, cantidad 3 → 2.400.

### Productos con unidad (kg, g, m, L, etc.) o precio 0

- Al tocar el producto se abre un **modal** para cargar la cantidad en la unidad del producto.
- Ejemplo producto “Naranjas” $/kg:
  - El usuario ingresa la **cantidad en kg** (ej. 2,5).
  - Total línea = 500 × 2,5 = 1.250.
- Si el producto tiene **precio 0**, también se abre el modal: se usa para ingresar precio y/o cantidad (por ejemplo para productos por peso que se taran en balanza y el monto se ingresa manualmente).

En todos los casos el **total del carrito** es la suma de (precio × cantidad) de cada ítem, donde “cantidad” es el número que se cargó (en la unidad en que está definido el producto).

---

## 3. Cómo se guarda en la base de datos

- **`products.price`**: precio por unidad (en la unidad del producto).
- **`products.unit_id`**: referencia a `units.id`. Si es `null`, se considera “por unidad” (pieza).
- En **ventas** se guardan en `transaction_items`:
  - `quantity`: cantidad vendida (en la misma unidad del producto).
  - `unit_price`: precio unitario usado.
  - `total_price`: total de la línea (quantity × unit_price).
  - `product_name`: nombre del producto (y opcionalmente se muestra la unidad en la UI del carrito).

No se guarda “unidad” en cada ítem de venta: se deduce del producto (`product_id` → `products.unit_id` → `units`).

---

## 4. Compras / gastos

En **Compras**, al cargar ítems (manual o por producto):

- Cada línea tiene **costo** y **cantidad**.
- El total de la compra es la suma de (costo × cantidad) por línea.
- Si el ítem tiene `product_id`, puede usarse para actualizar stock u otras lógicas; la unidad del producto no cambia el cálculo del total del gasto (ahí solo importan las cantidades y montos cargados).

---

## 5. Posible extensión: fracciones y subunidades

Hoy **no** hay conversión automática entre, por ejemplo:

- kg ↔ g (precio por kg, vender en gramos),
- m ↔ cm,
- docena ↔ media docena.

Para eso está el análisis en **`docs/analisis-unidades-fraccion.md`**: propone agregar en `units` una unidad base y un factor (ej. gramo = 0,001 kg) y, en ventas, permitir elegir “vender en kg” o “vender en g” y calcular el total con ese factor. Mientras no se implemente, el precio del producto es siempre “por la unidad elegida” y la cantidad se ingresa en esa misma unidad.
