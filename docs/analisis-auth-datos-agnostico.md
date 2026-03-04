# Análisis: Auth, JWT y arquitectura agnóstica para migración

## Estado actual del proyecto

### Autenticación
- **No se usa Supabase Auth ni JWT.** La “sesión” es solo un rol guardado en `localStorage` (`user_role`: `OWNER` o `ACCOUNTANT`).
- La pantalla de entrada (`src/app/page.tsx`) solo elige rol y redirige; no hay login real ni validación en servidor.
- Cualquiera puede cambiar el rol desde DevTools; no hay seguridad real.

### Datos
- Todas las pantallas importan `supabase` desde `@/lib/supabase` y llaman directamente a `supabase.from('tabla').select()`, `.insert()`, etc.
- Se usa la **anon key** en el cliente; las políticas de fila (RLS) de Supabase, si las hay, son las que protegen los datos.
- No hay capa de abstracción: la lógica de datos está acoplada al cliente de Supabase.

### Conclusión
Hoy el proyecto depende de Supabase **solo para la base de datos**. Auth es simulado en el frontend. Por tanto, una migración a “servidor propio + otra BD SQL” afecta sobre todo a la **capa de datos**; el “auth” actual se reemplazaría por un auth real (p. ej. JWT en tu backend).

---

## ¿Se puede hacer agnóstico? Sí, y es viable

La idea es introducir **interfaces/capas** para:

1. **Datos**: que las páginas no llamen a `supabase` sino a un servicio/repositorio que pueda implementarse con Supabase, PostgreSQL directo, otro backend REST, etc.
2. **Auth**: que la app use “sesión/usuario” a través de un provider/contexto que pueda implementarse con Supabase Auth, tu propio backend con JWT, etc.

Así, cambiar de Supabase a “servidor propio + otra BD” se reduce a **cambiar implementaciones**, no a reescribir toda la app.

---

## Cómo hacer la capa de datos agnóstica

### Opción A: Servicios + inyección por env

```ts
// src/lib/data/types.ts
export interface DataClient {
  from(table: string): TableClient;
  // o métodos por dominio: getProducts(), getTransactions(), etc.
}

// src/lib/data/supabase-client.ts
export function createSupabaseDataClient(): DataClient { ... }

// src/lib/data/index.ts
const impl = process.env.NEXT_PUBLIC_DATA_PROVIDER === 'supabase'
  ? createSupabaseDataClient()
  : createRestDataClient(); // tu API futura
export const db = impl;
```

Las páginas usan `db` (o hooks que usan `db`) en lugar de `supabase` directo. Al migrar, creas `createRestDataClient()` que llame a tu API.

### Opción B: API routes de Next.js como única fuente de datos

- El frontend **nunca** habla con Supabase (ni con otra BD) directo.
- Todas las lecturas/escrituras pasan por `fetch('/api/...')` (o un cliente tipo `getProducts()`, `createSale()`, etc. que llamen a esas rutas).
- Hoy las API routes pueden usar Supabase por detrás; mañana las reemplazás por conexión a tu PostgreSQL/MySQL u otro servicio.

Ventaja: el cliente no conoce Supabase; la migración es solo en el servidor (API routes o backend externo).

---

## Cómo hacer el auth agnóstico

Cuando quieras auth real (login, permisos, multi-tenant, etc.):

1. **Definir una interfaz de “AuthProvider”**  
   Por ejemplo: `getSession()`, `signIn()`, `signOut()`, `user`, `loading`.

2. **Implementaciones**  
   - `SupabaseAuthProvider`: usa `supabase.auth.getSession()`, JWT de Supabase, etc.  
   - `CustomAuthProvider`: llama a tu API (`POST /api/auth/login`), guardas un JWT (httpOnly cookie o memoria) y en cada request lo validás en el servidor.

3. **Next.js**  
   - Si usas JWT en cookie, podés validarlo en middleware o en `getServerSession()` (o equivalente) y proteger rutas/server components.  
   - El frontend solo usa el contexto “auth” (quién está logueado, rol, etc.); no sabe si eso viene de Supabase o de tu backend.

Así podés empezar con Supabase Auth y después cambiar a “servidor propio” sin tocar la UI, solo cambiando el provider y el backend que emite/verifica el JWT.

---

## Migrar a servidor propio + otra BD SQL

### Es posible y viable si:

1. **Datos**  
   - Tenés el esquema (ya lo tenés en `supabase/migrations/`).  
   - Podés llevarlo a PostgreSQL/MySQL en tu servidor (mismo esquema o con ajustes mínimos).  
   - La app ya no depende de Supabase client: o usás la capa agnóstica (servicios/API) o solo API routes.

2. **Auth**  
   - Implementás login en tu backend (email/contraseña, etc.), emisión de JWT y validación en cada request.  
   - Next.js puede hacer de backend (API routes + middleware) o podés tener un API separado (Node, Go, etc.).

3. **Funcionalidad**  
   - No estés usando cosas muy específicas de Supabase (Realtime, Storage, Edge Functions, etc.). En tu código actual solo se ve uso de BD vía cliente; eso es fácil de reemplazar.

### Esfuerzo aproximado

- **Solo BD + capa agnóstica (sin auth real):** bajo/medio (refactor a servicios o API routes + migrar esquema y datos).  
- **Auth real agnóstico (Supabase Auth hoy, tu JWT mañana):** medio (diseño del provider + implementar login y middleware en tu servidor).  
- **Migración completa (servidor propio + PostgreSQL/MySQL + auth propio):** medio/alto según cuánto quieras conservar (p. ej. reportes, RLS equivalente en tu API, etc.).

---

## Supabase vs servidor propio + BD propia

### Quedarse con Supabase (Auth + DB)

| Ventajas | Desventajas |
|----------|-------------|
| Menos infra que mantener (hosting, backups, escalado inicial). | Vendor lock-in moderado: esquema y cliente JS acoplados a Supabase. |
| Auth listo (JWT, magic link, OAuth, RLS con `auth.uid()`). | Límites del plan gratuito; costos al crecer. |
| Realtime y Storage si los necesitás. | Menos control sobre dónde corren datos y auth. |
| RLS para seguridad por fila sin escribir backend. | Si mañana querés moverte, hay que abstraer y migrar. |

### Servidor propio + BD SQL (PostgreSQL/MySQL en tu VPS/cloud)

| Ventajas | Desventajas |
|----------|-------------|
| Control total: datos, región, backups, compliance. | Tenés que montar y mantener servidor, BD, backups, SSL, etc. |
| Sin dependencia de un BaaS; podés cambiar de host o de BD. | Auth lo implementás vos (login, JWT, refresh, recuperación de contraseña). |
| Costos predecibles a largo plazo (servidor fijo vs consumo). | Más tiempo de desarrollo y operación al inicio. |
| Podés usar cualquier SQL y optimizar a tu gusto. | Escalar (réplicas, caché) es cosa tuya. |

### Enfoque híbrido (recomendable para migración futura)

- **Corto plazo:** seguir con Supabase para datos (y opcionalmente Supabase Auth cuando quieras auth real).  
- **Diseño agnóstico ya:**  
  - Que el frontend hable con **API routes** o con una **capa de servicios** que oculten Supabase.  
  - Que el “auth” (rol, usuario) se consuma vía un **contexto/provider** con interfaz única.  
- **Largo plazo:** cuando tengas motivo (costos, control, compliance), reemplazás en el servidor:  
  - La implementación que detrás de las API routes usa Supabase por una que use tu PostgreSQL/MySQL.  
  - El provider de auth por tu propio backend que emite/verifica JWT.

---

## Recomendación práctica

1. **No usar Supabase Auth “a lo bestia”** si tu idea es migrar: usalo detrás de una **interfaz de auth** (provider) para poder cambiar después a JWT propio sin reescribir la app.  
2. **Aislar el acceso a datos**  
   - Opción más limpia: **API routes** en Next.js que hoy usen Supabase y mañana tu BD.  
   - Alternativa: capa de servicios que abstraigan el cliente (Supabase vs REST) y que las páginas usen solo esa capa.  
3. **Auth real**  
   - Si hoy solo necesitás roles (OWNER/CONTADOR) en un entorno controlado, podés seguir con localStorage un tiempo, pero con la idea de que luego el “rol” venga del JWT/sesión del backend.  
   - Cuando quieras seguridad seria (multi-usuario, multi-tenant), implementá auth en tu backend (o Supabase Auth detrás del provider) y que el frontend solo use “sesión/rol” desde el provider.  
4. **Documentar**  
   - En el código: “toda lectura/escritura de datos va por `api/` o por `dataService`”.  
   - Un pequeño doc (como este) de “cómo cambiaríamos a servidor propio” para que el siguiente paso sea solo implementar la otra cara de las interfaces.

Resumen: **sí es posible y viable** manejar auth y datos de forma agnóstica en Next.js (con o sin Supabase). Lo más conveniente es introducir esa abstracción **ya** (API o servicios + provider de auth) y así poder migrar a servidor propio y otra BD SQL más adelante con poco impacto en el resto de la aplicación.
