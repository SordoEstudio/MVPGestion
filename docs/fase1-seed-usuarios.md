# Fase 1 — Cómo dar de alta el primer usuario

Tras aplicar las migraciones 06, 07 y 08:

1. **Crear usuario en Supabase Auth**  
   En el dashboard de Supabase: Authentication → Users → Add user (email + password). Anotar el **User UID** (uuid).

2. **Asignar perfil**
   - **Usuarios de `docs/Usuarios.txt`:** Si creás en Auth los dos usuarios (contador@demo.com y user@demo.com) con los UUID indicados en ese archivo, la **migración 10** (`10_seed_user_profiles_from_usuarios.sql`) asigna automáticamente los roles al aplicar migraciones. No hace falta ejecutar SQL a mano.
   - **Otros usuarios (manual):**
     - **Dueño de comercio:** En SQL Editor (reemplazando `USER_UID` y el `store_id` del comercio):
       ```sql
       insert into public.user_profiles (user_id, role, store_id)
       values ('USER_UID'::uuid, 'store_user', 'b0000000-0000-0000-0000-000000000001'::uuid);
       ```
     - **Contador:**
       ```sql
       update public.accountants set auth_user_id = 'USER_UID'::uuid where email = 'contador@demo.com';
       insert into public.user_profiles (user_id, role, accountant_id)
       values ('USER_UID'::uuid, 'accountant', 'a0000000-0000-0000-0000-000000000001'::uuid);
       ```

3. Iniciar sesión en la app con ese email y contraseña.
