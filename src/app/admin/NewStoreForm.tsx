'use client';

import { useActionState, useState } from 'react';
import { createStoreAction, type ActionResult } from './actions';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

const initial: ActionResult = {};

export default function NewStoreForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createStoreAction, initial);

  return (
    <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 text-blue-700 font-semibold text-sm"
      >
        <PlusCircle className="w-5 h-5" />
        Nuevo comercio
        {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {open && (
        <form action={action} className="px-4 pb-4 space-y-3">
          {state.error && (
            <p className="text-sm text-red-600 font-medium">{state.error}</p>
          )}
          {state.ok && (
            <p className="text-sm text-green-600 font-medium">Comercio creado.</p>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Nombre *</label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="Almacén Don Pedro"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">CUIT (opcional)</label>
            <input
              name="cuit"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="20-12345678-9"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-bold rounded-lg"
          >
            {pending ? 'Creando...' : 'Crear comercio'}
          </button>
        </form>
      )}
    </div>
  );
}
