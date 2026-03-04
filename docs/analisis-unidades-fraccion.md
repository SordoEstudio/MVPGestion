# Análisis: unidades con fracción y venta por fracción

## Objetivo
- Precio por unidad base (ej. $/kg, $/m) pero permitir venta en fracción (ej. gramos, cm, mm).
- Incluir unidades como **docena** y **½ docena** (y opcionalmente otras: 1/4 doc, etc.).

## 1. Unidades fraccionables (peso / longitud)

### Modelo de datos sugerido
- **Unidad base**: la que define el precio en el producto (ej. kg, m).
- **Subunidad / fracción**: misma magnitud, factor de conversión a la base.
  - kg ↔ g: 1 kg = 1000 g → factor 0.001 para g.
  - m ↔ cm: 1 m = 100 cm → factor 0.01 para cm.
  - m ↔ mm: 1 m = 1000 mm → factor 0.001 para mm.

Opciones:

**A) Columnas en `units`:**
- `base_unit_id` (FK a units, nullable): si no es null, esta unidad es fracción de la base.
- `factor_to_base` (numeric): cuántas unidades base son 1 de esta. Ej: para g, factor_to_base = 0.001 (1 g = 0.001 kg).

Así el producto tiene `unit_id` = kg (precio por kg). En la venta el usuario puede elegir "kg" o "g"; si elige g, se convierte: cantidad_g * 0.001 = cantidad_kg, y el total = cantidad_kg * precio_por_kg.

**B) Tabla de conversiones:**
- `unit_conversions (from_unit_id, to_unit_id, factor)`.
- Ej: (g, kg, 0.001), (cm, m, 0.01). El producto tiene unit_id = kg; en front se permiten unidades “compatibles” (misma magnitud).

La opción A es más simple si cada unidad pertenece a una sola base (kg o g, no ambas). La B permite más flexibilidad (varias bases).

### En la UI (ventas)
- Producto con unidad kg: precio $/kg. Al agregar al carrito:
  - Selector: "Cantidad en" → [kg | g].
  - Si elige g: input en gramos; total = (cantidad_g / 1000) * precio_por_kg.
- Igual para m: opciones m, cm, mm con factores 1, 0.01, 0.001.

## 2. Docena y ½ docena

- **Docena**: 1 doc = 12 unidades. Precio por docena en el producto; venta por docena o por unidad (1 u = 1/12 doc).
- **½ docena**: 1/2 doc = 6 unidades. Puede modelarse como:
  - Unidad aparte "½ doc" con factor_to_base = 0.5 (respecto de docena), o
  - Solo "docena" y "unidad", y en venta permitir cantidad en fracción (ej. 0.5 doc = ½ doc).

Recomendación:
- Incluir en `units`: **Docena** (symbol `doc`) y **½ docena** (symbol `½ doc` o `1/2 doc`).
- Si la base es "docena":
  - Docena: factor 1.
  - ½ docena: factor 0.5.
  - Unidad (u): factor 1/12 ≈ 0.0833 (opcional, si se vende por unidad dentro del mismo producto).

En producto: precio por docena; en venta se puede cargar "1 doc", "½ doc" o "2 doc" usando la misma base.

## 3. Resumen de cambios técnicos

| Área | Cambio |
|------|--------|
| **BD** | En `units`: añadir `base_unit_id` (nullable), `factor_to_base` (default 1). Seed: g (base kg, 0.001), cm (base m, 0.01), mm (base m, 0.001), docena, ½ doc (base doc, 0.5). |
| **Productos** | Mantener `unit_id` = unidad de precio (kg, m, doc). Opcional: indicar "permite venta en subunidades" o derivar de base_unit_id de la unidad. |
| **Ventas / carrito** | Para unidades con subunidades: selector "Vender en" (base o fracción) y cantidad; calcular total = (cantidad_en_fraccion * factor_to_base) * precio. |
| **Informes** | Mantener coherencia: guardar en una unidad canónica (ej. siempre kg o siempre la unidad base) para totales. |

## 4. Orden de implementación sugerido
1. Migración: agregar `base_unit_id` y `factor_to_base` a `units`; actualizar seed (g, cm, mm, doc, ½ doc).
2. Productos: en alta/edición, si la unidad tiene subunidades, opcionalmente mostrar "Se puede vender por: kg, g" (consultando unidades con esa base).
3. Ventas: en el ítem del carrito (o al agregar), si el producto tiene unidad base con fracciones, mostrar selector de unidad de venta y convertir cantidad para el total.
4. Docena/½ doc: mismo mecanismo; precio por docena, venta por doc o ½ doc.
