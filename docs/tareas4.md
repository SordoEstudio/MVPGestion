a continuacion las tareas para mejoras, tener en cuenta: 
Priorizar la reutilizacion de componentes, componentizar codigo siempre que sea necesario (DRY).
Mantener la filosofia KISS en cada desicion sin complejizar innecesariamente codigo ni funcionalidades.
Priorizar buenas practicas de codigo, ux/ui, contraste y demas.
Cuando haya opciones para hacerlo diferente o mejor, plantearlo.

Estructura:

1. Arquitectura de routing y layout
2. Layout exacto por nivel (Estudio vs Cliente)
3. Definición pantalla por pantalla
4. Componentes reutilizables
5. KPIs exactos y fórmulas
6. Endpoints necesarios

---

# 1️⃣ Arquitectura de Routing (Next.js App Router)

Propuesta clara y escalable:

```txt
/app
  /accountant
    layout.tsx
    page.tsx                 → Dashboard estudio
    /clients
      page.tsx               → Tabla clientes
    /[storeId]
      layout.tsx             → Layout cliente activo
      page.tsx               → Resumen (vista operativa)
      /fiscal
        page.tsx
      /impositivo
        page.tsx
      /negocio
        page.tsx
      /informes
        page.tsx
```

Claves:

* `/accountant` → contexto estudio
* `/accountant/[storeId]/*` → contexto cliente
* El layout cambia automáticamente según nivel

---

# 2️⃣ Layout Exacto

## 🧭 Layout Nivel Estudio (AccountantLayout)

### Estructura visual:

```txt
------------------------------------------------
Topbar: Estudio + usuario
------------------------------------------------
Sidebar:
- Dashboard
- Clientes
------------------------------------------------
Main Content
------------------------------------------------
```

---

## 🧭 Layout Nivel Cliente (ClientLayout)

```txt
------------------------------------------------
Topbar:
Cliente activo: Panadería López   [Cambiar]
Indicador riesgo general
------------------------------------------------
Sidebar:
- Resumen
- Fiscal
- Impositivo
- Negocio
- Informes
------------------------------------------------
Main Content
------------------------------------------------
```

Muy importante:

* El cliente activo SIEMPRE visible.
* Botón “Cambiar cliente” vuelve a `/accountant/clients`.

---

# 3️⃣ Definición exacta de pantallas

---

# 🏢 NIVEL ESTUDIO

---

## 3.1 Dashboard Estudio `/accountant`

### Objetivo:

Priorización y control global.

---

### 🔹 Sección 1 — KPIs Globales

Componentes: `KpiCard`

Mostrar:

* Total facturación acumulada (sum stores)
* Promedio % uso tope
* Clientes en riesgo (>=85%)
* Clientes con pérdida mensual

---

### 🔹 Sección 2 — Tabla Prioridad Fiscal

Tabla:

| Comercio | Facturación | Límite | % Tope | Proyección | Resultado Mes | Riesgo |

Componentes:

* DataTable
* BadgeRiesgo
* BarraProgresoTope

Orden default:

* % Tope desc

---

### 🔹 Sección 3 — Alertas Globales

Lista tipo feed:

* Cliente X superó 90%
* Cliente Y 3 meses en pérdida
* Cliente Z caída abrupta 40%

---

# 🧾 NIVEL CLIENTE

---

# 3.2 Resumen (Vista Operativa)

Es el dashboard del comerciante.
Solo lectura.

Componentes:

* Ventas mes
* Compras mes
* Resultado mes
* Caja actual
* Próximos cobros
* Gráfico ventas 12 meses

No agregar nada extra aquí.

---

# 3.3 Fiscal `/[storeId]/fiscal`

🎯 Orientado 100% a control impositivo.

---

## 🔹 Bloque 1 — Monotributo

KPIs:

* Facturación anual acumulada
* Límite categoría
* % usado
* Proyección anual
* Diferencia restante

Componentes:

* KpiCard grande
* BarraProgreso
* SemaforoFiscal
* LineChart mensual

---

## 🔹 Bloque 2 — Control mensual

KPIs:

* Ventas mes actual
* Ventas mes anterior
* Variación %
* Compras mes
* Resultado mes

---

## 🔹 Bloque 3 — Riesgo fiscal

Indicadores:

* % efectivo vs transferencia
* Picos anormales
* Crecimiento > 40%

Mostrar como tarjetas alerta.

---

# 3.4 Impositivo `/impositivo`

🎯 Pantalla funcional, orientada a descarga.

Sin gráficos.

---

## 🔹 Filtro período

Selector:

* Mes
* Año
* Personalizado

---

## 🔹 Cards descargables

1️⃣ Facturación detallada
2️⃣ Resumen mensual
3️⃣ Libro ingresos
4️⃣ Estado cuentas cobrar/pagar

Cada card:

* Descripción
* Botón Descargar Excel
* Botón Ver preview (opcional)

---

# 3.5 Negocio `/negocio`

🎯 Estratégico básico.

---

## 🔹 KPIs

* Resultado mensual
* Margen %
* Ticket promedio
* Punto equilibrio
* Diferencia vs PE

---

## 🔹 Gráficos

* Tendencia resultado 6 meses
* Evolución ventas vs gastos

---

## 🔹 Análisis automático

Caja de texto generada por lógica:

Ejemplo:

> Las ventas cubren el punto de equilibrio en un 112%. Margen promedio 18%.

No IA todavía, solo lógica.

---

# 3.6 Informes `/informes`

🎯 Histórico.

Tabla:

| Tipo | Período | Fecha generación | Descargar |

Permite regenerar.

---

# 4️⃣ Componentes Reutilizables

---

## 🔹 KpiCard

Props:

```ts
{
  title: string
  value: number | string
  subtitle?: string
  trend?: number
  severity?: "normal" | "warning" | "danger"
}
```

---

## 🔹 BarraProgresoTope

Props:

```ts
{
  percentage: number
}
```

Colores:

* <70 verde
* 70–85 amarillo
* > 85 rojo

---

## 🔹 BadgeRiesgo

Basado en reglas:

* > =90 → Alto
* 80–90 → Medio
* <80 → Bajo

---

## 🔹 AlertCard

Para feed de alertas.

---

## 🔹 DataTable genérica

Soporte:

* Orden
* Paginación
* Filtros

---

# 5️⃣ KPIs exactos y fórmulas

---

## Facturación anual

```ts
SUM(transactions.total_amount)
WHERE type = SALE
AND status = COMPLETED
AND year = current_year
```

---

## Proyección

```ts
facturacion_actual / meses_transcurridos * 12
```

---

## Resultado mensual

```ts
ventas_mes - gastos_mes
```

---

## Margen %

```ts
resultado_mes / ventas_mes * 100
```

---

## Ticket promedio

```ts
ventas_mes / cantidad_ventas_mes
```

---

## Punto equilibrio (MVP)

```ts
gastos_fijos_mes
```

---

# 6️⃣ Endpoints necesarios

---

## Nivel Estudio

```txt
GET /api/accountant/summary
GET /api/accountant/stores
GET /api/accountant/alerts
```

---

## Nivel Cliente

```txt
GET /api/stores/{id}/summary
GET /api/stores/{id}/fiscal
GET /api/stores/{id}/business
GET /api/stores/{id}/impositivo?period=...
GET /api/stores/{id}/reports
```

---

# 7️⃣ Principios UX finales

* Nunca mostrar datos sin contexto de cliente.
* Priorizar claridad sobre visual atractivo.
* Exportación simple y visible.
* Indicadores con colores consistentes.
* Evitar más de 3 niveles de profundidad.

---

# 🎯 Resultado final

Tendrás:

* Un dashboard estudio que permite priorizar.
* Un entorno cliente compartido.
* Un panel fiscal potente.
* Un módulo impositivo funcional.
* Una capa estratégica sin sobrecargar.

---
