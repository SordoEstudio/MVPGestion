# Plan de implementación — Fase 1 y Fase 2

Orden de ejecución y tareas concretas según `tareas3.md`.

---

## FASE 1 — Fundacional (multi-tenant + auth)

### Orden de tareas

| # | Tarea | Descripción |
|---|--------|-------------|
| 1 | **Auth (interfaz + Supabase)** | Interfaz `AuthProvider`; implementación con Supabase Auth; login email/password; middleware protección rutas; eliminar rol en `localStorage`. |
| 2 | **Tablas nuevas** | `accountants`, `stores`, `user_profiles` (vincula `auth.uid()` con rol y store/accountant). |
| 3 | **Migración store_id** | Añadir `store_id` a tablas operativas; backfill con store por defecto; FKs y NOT NULL. |
| 4 | **RLS** | Función `get_my_store_ids()` (store_user → su store; accountant → stores donde accountant_id); políticas en todas las tablas con `store_id`. |
| 5 | **Selector comercio (contador)** | Contexto `StoreContext` (store actual); pantalla `/accountant` o flujo en contador para elegir store; redirección a dashboard; todas las consultas filtran por `store_id`. |

### Detalles técnicos

- **Auth:** Usar Supabase Auth detrás de una interfaz (recomendación `analisis-auth-datos-agnostico.md`). Login solo email/password; sesión en cookies vía `@supabase/ssr` para que el middleware pueda proteger rutas.
- **Perfil de usuario:** Tabla `user_profiles (user_id, role, store_id, accountant_id)`. Tras el login la app obtiene el perfil para saber si es store_user (un store) o accountant (varios stores).
- **Units:** Se dejan globales (sin `store_id`) para no duplicar catálogo por comercio; si más adelante se quiere por store, se añade en otra migración.
- **Seed inicial:** Un accountant, un store vinculado, y (opcional) un store_user de prueba. Los usuarios se crean en Supabase Auth (dashboard o signup); el vínculo con `user_profiles` puede ser manual o por signup con lógica de invitación.

---

## FASE 2 — Módulo fiscal (monotributo + proyección)

### Orden de tareas

| # | Tarea | Descripción |
|---|--------|-------------|
| 1 | **Vista SQL facturación anual** | `view_annual_sales_by_store`: SUM(transactions.total_amount), type=SALE, status=COMPLETED, año actual, agrupado por store. |
| 2 | **Cálculo proyección y KPIs** | Proyección lineal: `facturacion_actual / meses_transcurridos * 12`. % tope: `facturacion_actual / limite_anual * 100`. Diferencia restante. |
| 3 | **UI Dashboard fiscal (store)** | En dashboard o sección del panel del dueño: facturación acumulada, límite, % usado, proyección, barra de progreso, semáforo. |
| 4 | **Vista resumida contador** | Tabla multi-store: Store \| Facturación \| % tope \| Proyección \| Riesgo; ordenable por % descendente. |

### Dependencia

- Fase 2 se implementa después de Fase 1 (multi-tenant y `store_id` operativos).

---

## Estado de implementación

- **Fase 1:** Implementada (auth con provider + Supabase, tablas accountants/stores/user_profiles, store_id en tablas operativas, RLS, selector de comercio, StoreContext e inserts con store_id). Ver `docs/fase1-seed-usuarios.md` para dar de alta el primer usuario.
- **Fase 2:** Implementada (vista `view_annual_sales_by_store`, bloque fiscal en dashboard Resumen con facturación/límite/%/proyección/semáforo, tabla resumen fiscal en `/contador` ordenable por % tope).

---

## Criterios de aceptación (recordatorio)

**Fase 1**
- Usuario store_user solo ve sus datos.
- Accountant solo ve stores asociados.
- No hay consultas sin filtro `store_id` (o equivalente vía RLS).
- Dashboard y flujos existentes funcionan igual pero filtrados por store.
- No se usa `localStorage` para rol.

**Fase 2**
- Facturación anual coherente con reporte de ventas.
- % y proyección correctos y dinámicos.
- Cambiar límite actualiza indicadores.
- Contador ve resumen multi-store.
