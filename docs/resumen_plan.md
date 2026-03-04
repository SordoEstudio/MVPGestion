Perfecto. Con todo el contexto (estado actual + visión de negocio + alianza con contadores), voy a ordenarlo en **4 capas**:

1. **Modelo conceptual del sistema (operativo vs estratégico)**
2. **Arquitectura multi-tenant para contadores**
3. **Sistema de reportes y dashboard (MVP → Fase 2)**
4. **Roadmap priorizado y decisiones estructurales**

---

# 1️⃣ Modelo conceptual: Operativo vs Estratégico

Hoy tu sistema está muy bien parado en la capa **operativa**.

Tomando el documento actual :

## 🔹 Capa Operativa (ya desarrollada en gran parte)

Objetivo: registrar correctamente la realidad.

Incluye:

* Ventas (`SALE`)
* Compras (`EXPENSE`)
* Pagos y cobros (`DEBT_PAYMENT`, `DEBT_COLLECTION`)
* Caja manual (`INCOME`)
* Personas (clientes/proveedores)
* Productos + stock
* Movimientos
* Reporte simple de ventas

Esta capa responde a:

> ¿Qué pasó?

---

## 🔹 Capa Estratégica (lo que viene ahora)

Objetivo: interpretar datos y asistir decisiones.

Incluye:

* Punto de equilibrio
* Proyección de facturación
* Control de categoría de monotributo
* Indicadores de margen
* Alertas
* Comparativas temporales
* Reportes para contador

Esta capa responde a:

> ¿Qué significa lo que pasó?
> ¿Qué puede pasar si sigo así?
> ¿Estoy en riesgo fiscal?
> ¿Estoy ganando dinero realmente?

---

# 2️⃣ Arquitectura: Contador como SuperAdmin (Multi-Tenant real)

Hoy el sistema es mono-negocio. Para que el modelo de negocio funcione con contadores, necesitás formalizar esto:

## 🎯 Modelo conceptual correcto

```
Contador (Accountant)
    ├── Comercio A (Store)
    ├── Comercio B
    ├── Comercio C
```

---

## 🔹 Nueva entidad necesaria

### accountant

* id
* name
* email
* plan (opcional futuro SaaS)

### stores (comercios)

* id
* name
* cuit
* categoria_monotributo
* limite_anual_categoria
* accountant_id (FK)
* created_at

---

## 🔹 Ajuste clave en el modelo actual

Todas las tablas actuales deben tener:

```
store_id (FK)
```

Ejemplo:

* transactions
* products
* people
* categories
* units (opcional compartida global)
* payments

Esto convierte el sistema en **multi-tenant por store**.

---

## 🔹 MVP inteligente

En MVP:

* Login simple con Supabase Auth
* Rol: `accountant` o `store_user`
* Si accountant:

  * ve lista de stores
  * al seleccionar uno → setea store_id en sesión
* Si store_user:

  * entra directo a su store

Nada más.

La estadística cross-store puede esperar.

---

# 3️⃣ Sistema de Reportes y Dashboard Estratégico

Vamos a dividirlo por perfil.

---

# 🧾 DASHBOARD DEL COMERCIO

Debe tener 3 bloques:

---

## 🔹 1. Fiscal / Monotributo

**Indicadores clave:**

* Facturación acumulada anual
* Límite categoría actual
* % usado
* Proyección anual lineal

### Fórmula proyección simple:

```
facturacion_actual / meses_transcurridos * 12
```

### Indicadores visuales:

* Barra de progreso %
* Semáforo:

  * 🟢 <70%
  * 🟡 70–90%
  * 🔴 >90%

Esto es oro para el contador.

---

## 🔹 2. Negocio (Punto de equilibrio)

Necesitás clasificar gastos:

Agregar a categorías:

```
type: FIXED | VARIABLE
```

### Punto de equilibrio mensual:

```
PE = Gastos Fijos / (1 - (Gastos Variables / Ventas))
```

Versión MVP simplificada:

Si no querés margen variable:

```
PE ≈ Gastos Fijos Mensuales
```

Mostrar:

* Ventas actuales
* PE
* Diferencia
* % de cobertura

---

## 🔹 3. Salud financiera básica

* Resultado mensual (Ventas - Gastos)
* Margen bruto
* Ticket promedio
* Top categorías vendidas
* Tendencia 6 meses

---

# 👨‍💼 DASHBOARD DEL CONTADOR

En MVP:

Cuando entra:

* Lista de stores
* Indicadores por store:

| Comercio | Facturación anual | % tope | Resultado mensual | Alertas |
| -------- | ----------------- | ------ | ----------------- | ------- |

---

## 🔹 Alertas automáticas (clave del modelo de negocio)

Ejemplos:

* ⚠ Está al 85% del tope
* ⚠ 3 meses consecutivos con pérdida
* ⚠ Aumento abrupto de facturación
* ⚠ Mucho fiado acumulado
* ⚠ Stock crítico constante

Esto convierte al sistema en herramienta estratégica, no solo operativa.

---

# 4️⃣ Reportes concretos a implementar

Prioridad alta:

### 1. Reporte Fiscal Anual

* Total ventas
* Desglose mensual
* Métodos de pago
* Export Excel

---

### 2. Reporte Resultado Mensual

* Ventas
* Compras
* Resultado
* Gráfico comparativo meses

---

### 3. Reporte Deudas

* Clientes con saldo
* Proveedores con saldo
* Antigüedad de deuda (fase 2)

---

### 4. Reporte Punto de equilibrio

* Gastos fijos
* Ventas
* Diferencia
* Gráfico

---

# 5️⃣ Arquitectura técnica recomendada

## Backend (Supabase / Postgres)

Crear vistas SQL:

```
view_monthly_sales
view_monthly_expenses
view_annual_sales
view_store_kpis
```

Evita recalcular todo en frontend.

---

## API Layer

Endpoints recomendados:

```
GET /api/stores
GET /api/stores/{id}/dashboard
GET /api/stores/{id}/fiscal-summary
GET /api/stores/{id}/business-summary
GET /api/stores/{id}/reports?type=monthly
```

Separar:

* Queries operativas
* Queries agregadas estratégicas

---

# 6️⃣ Orden de implementación (estratégico)

### FASE 1 — Fundacional (crítica)

* Multi-tenant real (store_id)
* Supabase Auth
* Accountant + Stores
* RLS por store_id

---

### FASE 2 — Fiscal

* Cálculo facturación anual
* Límite categoría monotributo
* Proyección
* Dashboard fiscal comercio
* Vista resumen contador

---

### FASE 3 — Negocio

* Clasificación gastos fijos/variables
* Punto de equilibrio
* Resultado mensual
* Alertas

---

### FASE 4 — Premium SaaS

* Cross-store comparativas
* Benchmark por rubro
* Onboarding por rubro
* Dark mode
* Estadísticas avanzadas

---

# 7️⃣ Decisiones estratégicas importantes

## ❗ 1. ¿El contador ve TODO o solo datos agregados?

Recomendación:

* Puede entrar al store (modo auditor)
* Pero el dashboard principal muestra solo KPIs

---

## ❗ 2. ¿Dónde está el verdadero valor?

No está en registrar ventas.
Está en:

* Alertas fiscales
* Proyecciones
* Punto de equilibrio
* Reportes automáticos

Ese es el diferencial frente a sistemas KISS tradicionales.

---

# 8️⃣ Cómo posicionar el producto

No es:

> "Sistema de gestión simple"

Es:

> "Herramienta de control y previsión fiscal y financiera para pequeños comercios, integrada al estudio contable."

Eso cambia completamente la narrativa comercial.

---

Si querés, en el próximo paso podemos:

* Diseñar el modelo de datos exacto en SQL listo para Supabase
* O definir el esquema completo del Dashboard estratégico con KPIs exactos y fórmulas
* O armar el blueprint SaaS con planes y monetización junto al contador

Decime qué bloque querés profundizar primero.
