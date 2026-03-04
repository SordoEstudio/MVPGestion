# Plan de implementación técnica — tareas4.md

Orden de ejecución y decisiones técnicas según la especificación.

---

## Principios

- **DRY:** Reutilizar componentes; componentizar cuando aporte claridad.
- **KISS:** No complejizar; cada decisión debe ser la más simple que cumpla el objetivo.
- **UX/UI:** Buen contraste, claridad, consistencia de indicadores (colores).

---

## 1. Arquitectura de rutas (Next.js App Router)

```
/app
  /accountant                    → contexto estudio (solo rol accountant)
    layout.tsx                  → AccountantLayout
    page.tsx                    → Dashboard estudio
    /clients
      page.tsx                  → Tabla clientes (stores)
    /[storeId]                  → contexto cliente activo
      layout.tsx                → ClientLayout
      page.tsx                  → Resumen (vista operativa)
      /fiscal
        page.tsx
      /impositivo
        page.tsx
      /negocio
        page.tsx
      /informes
        page.tsx
```

- **Store_user (comercio):** Se mantiene el flujo actual: `/dashboard`, `/ventas`, `/compras`, etc. con el layout actual (sidebar operativo). No se duplica bajo `/accountant`.
- **Accountant:** Entra por `/accountant` (dashboard estudio). Elige cliente en `/accountant/clients` y pasa a `/accountant/[storeId]` (resumen) o a fiscal/impositivo/negocio/informes.
- **Redirecciones:** Login contador → `/accountant`. Selección de store en clients → `/accountant/[storeId]`. "Cambiar cliente" → `/accountant/clients`.

---

## 2. Layouts

### AccountantLayout (nivel estudio)

- **Topbar:** Estudio + usuario (y logout).
- **Sidebar:** Dashboard (link a `/accountant`), Clientes (link a `/accountant/clients`).
- **Contenido:** `children` (dashboard o tabla clientes).

### ClientLayout (nivel cliente, `/accountant/[storeId]/*`)

- **Topbar:** Nombre del cliente activo (store name) + botón "Cambiar" → `/accountant/clients`. Indicador de riesgo global (BadgeRiesgo).
- **Sidebar:** Resumen, Fiscal, Impositivo, Negocio, Informes (links a `/accountant/[storeId]`, `.../fiscal`, etc.).
- **Contenido:** `children`.

El `storeId` viene de la URL; el layout debe leerlo y cargar el store en contexto (o pasar por props) para el topbar y para las pantallas hijas.

---

## 3. Componentes reutilizables (orden de creación)

| Componente | Props / contrato | Uso |
|------------|------------------|-----|
| **KpiCard** | `title`, `value`, `subtitle?`, `trend?`, `severity?` ('normal' \| 'warning' \| 'danger') | KPIs en dashboard estudio y pantallas cliente. |
| **BarraProgresoTope** | `percentage: number` | Verde &lt;70, amarillo 70–85, rojo &gt;85. |
| **BadgeRiesgo** | Regla: ≥90 Alto, 80–90 Medio, &lt;80 Bajo. Recibe `percentage` o nivel. | Tabla prioridad fiscal, topbar cliente. |
| **AlertCard** | Mensaje, severidad, opcional link/acción. | Feed de alertas en dashboard estudio. |
| **DataTable** | Columnas, datos, orden, paginación opcional, filtros opcionales. | Tabla prioridad fiscal, tabla clientes, informes. |

Carpeta: `src/components/` (o `src/components/dashboard/` si se prefiere agrupar).

---

## 4. Pantallas y datos

### 4.1 Dashboard estudio (`/accountant`)

- **Sección 1 — KPIs globales (KpiCard):**
  - Total facturación acumulada (suma de todos los stores del contador).
  - Promedio % uso tope.
  - Clientes en riesgo (count % ≥ 85).
  - Clientes con pérdida mensual (count resultado mes &lt; 0).
- **Sección 2 — Tabla prioridad fiscal:**  
  Comercio | Facturación | Límite | % Tope | Proyección | Resultado Mes | Riesgo.  
  Orden por defecto: % Tope desc. Componentes: DataTable, BadgeRiesgo, BarraProgresoTope (en columna %).
- **Sección 3 — Alertas globales:** Lista tipo feed con AlertCard (ej.: "Cliente X superó 90%", "Cliente Y 3 meses en pérdida").

Datos: reutilizar lógica actual de `view_annual_sales_by_store`, `stores`, y cálculos de resultado mensual por store. Todo vía Supabase desde el cliente (RLS ya filtra por contador).

### 4.2 Clientes (`/accountant/clients`)

- Tabla o lista de stores del contador.
- Al hacer clic en un store → `setStoreId(storeId)` y redirigir a `/accountant/[storeId]`.

Puede reutilizar la misma DataTable o una lista de cards (como el selector actual mejorado).

### 4.3 Resumen (`/accountant/[storeId]`)

- Solo lectura. Ventas mes, Compras mes, Resultado mes, Caja actual, Próximos cobros, Gráfico ventas 12 meses.
- Reutilizar contenido actual del dashboard “resumen” del comercio, pero con datos del `storeId` de la URL (ya filtrados por RLS si el contador tiene acceso).

### 4.4 Fiscal (`/accountant/[storeId]/fiscal`)

- Bloque 1 — Monotributo: facturación anual, límite, % usado, proyección, diferencia restante. KpiCard, BarraProgresoTope, SemaforoFiscal, LineChart mensual.
- Bloque 2 — Control mensual: ventas mes actual/anterior, variación %, compras mes, resultado mes.
- Bloque 3 — Riesgo fiscal: % efectivo vs transferencia, picos anormales, crecimiento &gt;40%. Tarjetas de alerta.

### 4.5 Impositivo (`/accountant/[storeId]/impositivo`)

- Filtro período: Mes, Año, Personalizado.
- Cards descargables: Facturación detallada, Resumen mensual, Libro ingresos, Estado cuentas cobrar/pagar. Cada una: descripción, Descargar Excel, Ver preview (opcional). Sin gráficos.

### 4.6 Negocio (`/accountant/[storeId]/negocio`)

- KPIs: Resultado mensual, Margen %, Ticket promedio, Punto equilibrio (MVP = gastos fijos mes), Diferencia vs PE.
- Gráficos: Tendencia resultado 6 meses, Evolución ventas vs gastos.
- Caja de texto con análisis automático (lógica fija, sin IA): ej. “Las ventas cubren el punto de equilibrio en un 112%. Margen promedio 18%.”

### 4.7 Informes (`/accountant/[storeId]/informes`)

- Tabla: Tipo | Período | Fecha generación | Descargar. Permite regenerar.

---

## 5. Fórmulas (recordatorio)

- **Facturación anual:** SUM(transactions.total_amount) WHERE type=SALE, status=COMPLETED, year=current.
- **Proyección:** facturacion_actual / meses_transcurridos * 12.
- **Resultado mensual:** ventas_mes - gastos_mes.
- **Margen %:** resultado_mes / ventas_mes * 100.
- **Ticket promedio:** ventas_mes / cantidad_ventas_mes.
- **Punto equilibrio (MVP):** gastos_fijos_mes.

---

## 6. Endpoints / datos

- Mantener **Supabase desde el cliente** con RLS (sin API propia por ahora) para cumplir KISS. Las “rutas API” del doc se traducen en:
  - **Nivel estudio:** Mismas tablas/vistas (`stores`, `view_annual_sales_by_store`, etc.) con filtros que ya aplica RLS por contador.
  - **Nivel cliente:** Mismas tablas con `store_id` en contexto (el `storeId` de la URL); RLS ya restringe por stores del contador.
- Si más adelante se necesitan agregaciones pesadas o reportes, se pueden añadir API routes que usen Supabase server-side.

---

## 7. Orden de implementación

1. **Componentes reutilizables** (KpiCard, BarraProgresoTope, BadgeRiesgo, AlertCard, DataTable).
2. **Rutas y layouts:** Crear estructura de carpetas, `AccountantLayout`, `ClientLayout`, y redirecciones contador.
3. **Dashboard estudio:** Contenido de `/accountant` con KPIs globales, tabla prioridad fiscal, alertas.
4. **Clientes:** `/accountant/clients` con tabla/lista y navegación a `/accountant/[storeId]`.
5. **Resumen:** `/accountant/[storeId]/page.tsx` reutilizando lógica y componentes del resumen actual.
6. **Fiscal:** `/accountant/[storeId]/fiscal` con los tres bloques.
7. **Impositivo:** Filtro período + cards descargables.
8. **Negocio:** KPIs, gráficos, texto de análisis.
9. **Informes:** Tabla histórico y descarga/regenerar.
10. **Ajustes finales:** Redirecciones desde `/contador` y desde el selector actual a la nueva estructura; ocultar o adaptar rutas antiguas del contador.

---

## 8. Criterios de aceptación (resumen)

- Contador entra por `/accountant` y ve dashboard estudio con KPIs y tabla prioridad fiscal.
- Desde "Clientes" va a `/accountant/clients` y al elegir un store llega a `/accountant/[storeId]`.
- En contexto cliente, topbar muestra nombre del store y "Cambiar"; sidebar muestra Resumen, Fiscal, Impositivo, Negocio, Informes.
- Todas las pantallas cliente usan el mismo `storeId` de la URL y componentes reutilizables.
- Indicadores de riesgo y colores coherentes en toda la app (BarraProgresoTope, BadgeRiesgo, AlertCard).

---

## Estado de implementación

- **Plan:** Documento creado y orden de tareas definido.
- **Componentes:** KpiCard, BarraProgresoTope, BadgeRiesgo, AlertCard, DataTable en `src/components/`.
- **Rutas:** `/accountant` (layout estudio), `/accountant/clients`, `/accountant/[storeId]` (layout cliente), `/accountant/[storeId]/fiscal`, `.../impositivo`, `.../negocio`, `.../informes`.
- **Layouts:** AccountantLayout (sidebar Dashboard, Clientes). ClientLayout (topbar con nombre del cliente + BadgeRiesgo, sidebar Resumen, Fiscal, Impositivo, Negocio, Informes; "Cambiar" → `/accountant/clients`).
- **Pantallas:** Dashboard estudio (KPIs globales, tabla prioridad fiscal ordenable, alertas). Clientes (DataTable, entrada a `/accountant/[storeId]`). Resumen (ventas/compras/resultado/caja/próximos cobros/gráfico 12 meses). Fiscal (monotributo, control mensual, riesgo fiscal). Impositivo (filtro período, cards descargables Excel). Negocio (KPIs, tendencia resultado, ventas vs gastos, análisis texto). Informes (tabla tipos, descargar).
- **Redirección:** Contador que inicia sesión va a `/accountant` (raíz con perfil accountant redirige). Store_user sigue yendo a `/dashboard`.
