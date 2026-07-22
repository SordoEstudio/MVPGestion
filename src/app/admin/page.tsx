import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import NewStoreForm from './NewStoreForm';
import StoreCard from './StoreCard';
import LogoutButton from './LogoutButton';

const ADMIN_USER_ID = 'd9551cbb-f954-4287-b4b2-342755626fd2';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) redirect('/login');

  const admin = createAdminClient();
  const [{ data: stores }, { data: profiles }, { data: authData }] = await Promise.all([
    admin.from('stores').select('id, name, cuit').order('created_at'),
    admin.from('user_profiles').select('user_id, store_id').eq('role', 'store_user'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = Object.fromEntries(
    (authData?.users ?? []).map(u => [u.id, u.email ?? ''])
  );

  const storesWithUsers = (stores ?? []).map(store => ({
    ...store,
    cuit: store.cuit ?? null,
    users: (profiles ?? [])
      .filter(p => p.store_id === store.id)
      .map(p => ({ user_id: p.user_id, email: emailMap[p.user_id] ?? '' })),
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {storesWithUsers.length} comercios
            </span>
            <LogoutButton />
          </div>
        </div>

        <NewStoreForm />

        <div className="space-y-3">
          {storesWithUsers.map(store => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </div>
    </main>
  );
}
