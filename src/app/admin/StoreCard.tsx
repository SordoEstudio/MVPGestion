'use client';

import { useActionState, useState } from 'react';
import { createUserAction, type ActionResult } from './actions';
import { UserPlus, Copy, Check, Users } from 'lucide-react';

interface StoreUser { user_id: string; email: string }
interface Store { id: string; name: string; cuit: string | null; users: StoreUser[] }

const initial: ActionResult = {};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={copy} className="p-1 hover:bg-gray-100 rounded">
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

function AddUserForm({ storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUserAction, initial);

  return (
    <div className="mt-3">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          Agregar usuario
        </button>
      )}

      {open && (
        <form action={action} className="mt-2 space-y-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <input type="hidden" name="store_id" value={storeId} />
          {state.error && (
            <p className="text-xs text-red-600 font-medium">{state.error}</p>
          )}
          {state.ok && state.email && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1.5">
              <p className="text-xs font-bold text-green-700">Usuario creado</p>
              <div className="flex items-center gap-1 text-xs text-gray-700">
                <span className="font-mono">{state.email}</span>
                <CopyButton text={state.email} />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700">
                <span className="font-mono">{state.password}</span>
                <CopyButton text={state.password!} />
              </div>
            </div>
          )}
          {!state.ok && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Contraseña temporal</label>
                <input
                  name="password"
                  type="text"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono focus:ring-2 focus:ring-blue-500"
                  placeholder="abc123"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-bold rounded-lg"
                >
                  {pending ? 'Creando...' : 'Crear usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
          {state.ok && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export default function StoreCard({ store }: { store: Store }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-gray-900">{store.name}</h2>
          {store.cuit && <p className="text-xs text-gray-500 mt-0.5">CUIT: {store.cuit}</p>}
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{store.id}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5" />
          {store.users.length}
        </span>
      </div>

      {store.users.length > 0 && (
        <ul className="mt-3 space-y-1">
          {store.users.map(u => (
            <li key={u.user_id} className="text-xs text-gray-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              {u.email || <span className="font-mono text-gray-400">{u.user_id}</span>}
            </li>
          ))}
        </ul>
      )}

      <AddUserForm storeId={store.id} />
    </div>
  );
}
