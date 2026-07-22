'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_USER_ID = 'd9551cbb-f954-4287-b4b2-342755626fd2';

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) redirect('/login');
}

export type ActionResult = {
  error?: string;
  ok?: boolean;
  email?: string;
  password?: string;
};

export async function createStoreAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = (formData.get('name') as string).trim();
  const cuit = (formData.get('cuit') as string).trim() || null;
  if (!name) return { error: 'El nombre es requerido' };

  const admin = createAdminClient();
  const { error } = await admin.from('stores').insert({ name, cuit });
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { ok: true };
}

export async function createUserAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const email = (formData.get('email') as string).trim().toLowerCase();
  const password = (formData.get('password') as string).trim();
  const storeId = formData.get('store_id') as string;

  if (!email || !password || !storeId) return { error: 'Faltan campos' };
  if (password.length < 6) return { error: 'Contraseña mínimo 6 caracteres' };

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return { error: authError.message };

  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({ user_id: authData.user.id, role: 'store_user', store_id: storeId });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/admin');
  return { ok: true, email, password };
}
