# 🧱 FASE 1 — Fundacional (Multi-tenant real + Auth)

## 🎯 Objetivo

Convertir el sistema mono-negocio actual  en un sistema multi-tenant con autenticación real y separación estricta por comercio (`store_id`).

---

## 📦 Entregables

* Sistema con autenticación Supabase Auth
1. **No usar Supabase Auth “a lo bestia”** si tu idea es migrar: usalo detrás de una **interfaz de auth** (provider) para poder cambiar después a JWT propio sin reescribir la app.  (analisis-auth-datos-agnostico.md)
* Tabla `accountants`
* Tabla `stores`
* Todas las tablas operativas con `store_id`
* RLS por `store_id`
* Pantalla selector de comercio para contador

---

## 🛠 Tareas técnicas

### 1. Autenticación

* Integrar Supabase Auth
* Eliminar rol en `localStorage`
* Implementar login con email/password
* Crear middleware para proteger rutas

---

### 2. Modelo de datos nuevo

Crear tablas:

```sql
accountants (
  id uuid PK,
  name text,
  email text unique,
  created_at timestamptz
)

stores (
  id uuid PK,
  name text,
  cuit text,
  categoria_monotributo text,
  limite_anual numeric,
  accountant_id uuid FK accountants,
  created_at timestamptz
)
```

---

### 3. Migración estructural

Agregar `store_id` a:

* transactions
* transaction_items
* payments
* products
* categories
* people
* units (evaluar si global o por store)

Crear FK:

```sql
store_id uuid references stores(id)
```

---

### 4. RLS

Políticas:

* Store user → solo su `store_id`
* Accountant → solo stores asociados

Verificar:

* No se puede consultar otro store vía API directa
* No se pueden insertar registros con store_id ajeno

---

### 5. Selector de comercio (contador)

Pantalla:

```
/accountant
```

Funcionalidad:

* Lista de stores del accountant
* Al seleccionar → guardar `current_store_id` en sesión
* Redirigir a dashboard filtrado

---

## ✅ Criterios de aceptación

* [ ] Un usuario store_user solo ve sus datos
* [ ] Un accountant puede ver solo sus stores
* [ ] No existen consultas sin filtro `store_id`
* [ ] Dashboard funciona igual que antes pero filtrado
* [ ] No hay uso de `localStorage` para rol

---

## 🔎 Dependencias

Ninguna. Es la base del sistema.

---

# 📊 FASE 2 — Módulo Fiscal (Monotributo + Proyección)

## 🎯 Objetivo

Convertir ventas en inteligencia fiscal preventiva.

---

## 📦 Entregables

* KPI facturación anual acumulada
* % del tope usado
* Proyección anual
* Semáforo fiscal
* Dashboard fiscal para contador

---

## 🛠 Tareas técnicas

### 1. Cálculo facturación anual

Query:

* SUM(transactions.total_amount)
* type = SALE
* status = COMPLETED
* año actual
* agrupado por store

Crear vista SQL:

```sql
view_annual_sales_by_store
```

---

### 2. Cálculo proyección lineal

Fórmula:

```
facturacion_actual / meses_transcurridos * 12
```

Debe ignorar meses sin actividad inicial (mejora futura).

---

### 3. KPI adicionales

* % del tope:

```
facturacion_actual / limite_anual * 100
```

* Diferencia restante

---

### 4. UI Dashboard Fiscal (Store)

Mostrar:

* Facturación acumulada
* Límite
* % usado
* Proyección
* Barra progreso
* Semáforo

---

### 5. Vista resumida contador

Tabla:

| Store | Facturación | % tope | Proyección | Riesgo |

Ordenable por % descendente.

---

## ✅ Criterios de aceptación

* [ ] Facturación anual coincide con reporte ventas existente
* [ ] % se calcula correctamente
* [ ] Proyección responde dinámicamente
* [ ] Cambiar límite modifica indicadores
* [ ] Contador ve resumen multi-store

---

## 🔎 Dependencias

Fase 1 completa (multi-tenant).

---

# 📈 FASE 3 — Módulo Negocio (Punto de equilibrio + Resultado)

## 🎯 Objetivo

Transformar el sistema en herramienta estratégica.

---

## 📦 Entregables

* Clasificación gastos FIXED / VARIABLE
* Resultado mensual
* Punto de equilibrio
* Dashboard negocio

---

## 🛠 Tareas técnicas

### 1. Modificar categorías

Agregar campo:

```sql
expense_type text check (FIXED, VARIABLE)
```

Solo aplica a categorías usadas en compras.

---

### 2. Resultado mensual

Vista SQL:

```
ventas_mes - gastos_mes
```

Separar:

* ventas
* gastos
* resultado

---

### 3. Punto de equilibrio (versión MVP)

Versión simple:

```
PE = gastos_fijos_mensuales
```

Versión avanzada:

```
PE = Gastos Fijos / (1 - (Gastos Variables / Ventas))
```

---

### 4. Dashboard negocio

Mostrar:

* Ventas mes
* Gastos mes
* Resultado
* PE
* Diferencia
* Tendencia 6 meses

---

### 5. Alertas básicas

Reglas:

* 3 meses negativos consecutivos
* PE no alcanzado
* Crecimiento > 40% mensual

Crear tabla:

```sql
alerts (
  id,
  store_id,
  type,
  severity,
  created_at,
  resolved boolean
)
```

---

## ✅ Criterios de aceptación

* [ ] Clasificación FIXED/VARIABLE persistente
* [ ] Resultado mensual coincide con sumatorias reales
* [ ] PE responde a cambios de gastos
* [ ] Alertas se generan automáticamente
* [ ] Contador puede ver alertas por store

---

## 🔎 Dependencias

Fase 2 implementada (vistas agregadas).

---

# 🚀 FASE 4 — Capa SaaS y Diferenciación

## 🎯 Objetivo

Convertirlo en producto escalable para estudios contables.

---

## 📦 Entregables

* Dashboard cross-store comparativo
* Benchmark por rubro
* Onboarding por rubro
* Dark mode
* Roles avanzados

---

## 🛠 Tareas técnicas

### 1. Comparativa cross-store

Vista SQL:

* Promedio facturación por rubro
* Promedio margen por rubro

Agregar campo `rubro` en `stores`.

---

### 2. Benchmark

Indicador:

```
Store vs promedio rubro
```

Mostrar:

* +X% sobre promedio
* -X% bajo promedio

---

### 3. Onboarding por rubro

Plantillas:

* Categorías predefinidas
* Gastos típicos
* Productos base

Tabla:

```
industry_templates
```

---

### 4. Dark mode

* Tailwind config
* Persistencia en user preferences

---

### 5. Roles avanzados

* accountant_owner
* accountant_staff
* store_manager

---

## ✅ Criterios de aceptación

* [ ] Contador ve comparativa agregada
* [ ] No hay filtraciones de datos entre estudios
* [ ] Onboarding crea estructura automáticamente
* [ ] UI soporta dark mode sin errores visuales

---

# 📌 Resumen estratégico del roadmap

| Fase | Tipo         | Impacto               | Riesgo |
| ---- | ------------ | --------------------- | ------ |
| 1    | Arquitectura | Crítico               | Alto   |
| 2    | Fiscal       | Diferencial comercial | Medio  |
| 3    | Negocio      | Valor estratégico     | Medio  |
| 4    | SaaS         | Escalabilidad         | Bajo   |

---
