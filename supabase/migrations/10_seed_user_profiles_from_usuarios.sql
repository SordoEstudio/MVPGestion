-- Asignar roles a los usuarios de docs/Usuarios.txt
-- Contador: contador@demo.com -> UUID e0403666-883f-4e84-9e24-d6ecd0126c11
-- Comerciante: user@demo.com   -> UUID aeeb9d5d-fc09-4d68-b173-2b292bc1112a

-- 1. Vincular usuario Auth al registro de contador
update public.accountants
set auth_user_id = 'e0403666-883f-4e84-9e24-d6ecd0126c11'::uuid
where email = 'contador@demo.com';

-- 2. Perfil contador (acceso a todos sus comercios)
insert into public.user_profiles (user_id, role, accountant_id)
values ('e0403666-883f-4e84-9e24-d6ecd0126c11'::uuid, 'accountant', 'a0000000-0000-0000-0000-000000000001'::uuid)
on conflict (user_id) do update set
  role = excluded.role,
  accountant_id = excluded.accountant_id,
  store_id = null;

-- 3. Perfil comerciante (acceso al comercio demo)
insert into public.user_profiles (user_id, role, store_id)
values ('aeeb9d5d-fc09-4d68-b173-2b292bc1112a'::uuid, 'store_user', 'b0000000-0000-0000-0000-000000000001'::uuid)
on conflict (user_id) do update set
  role = excluded.role,
  store_id = excluded.store_id,
  accountant_id = null;
