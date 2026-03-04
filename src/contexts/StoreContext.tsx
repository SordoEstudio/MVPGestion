'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const STORE_KEY = 'current_store_id';

type Store = { id: string; name: string };

const StoreContext = createContext<{
  storeId: string | null;
  store: Store | null;
  stores: Store[];
  setStoreId: (id: string) => void;
  loading: boolean;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const setStoreId = useCallback((id: string) => {
    setStoreIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORE_KEY, id);
  }, []);

  useEffect(() => {
    if (!profile) {
      setStoreIdState(null);
      setStores([]);
      setLoading(false);
      return;
    }

    if (profile.role === 'store_user' && profile.store_id) {
      setStoreIdState(profile.store_id);
      setStores([{ id: profile.store_id, name: '' }]);
      setLoading(false);
      return;
    }

    if (profile.role === 'accountant') {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
      (async () => {
        try {
          const { data } = await supabase.from('stores').select('id, name').order('name');
          const list = (data ?? []).map((r) => ({ id: r.id, name: r.name ?? '' }));
          setStores(list);
          if (saved && list.some((s) => s.id === saved)) {
            setStoreIdState(saved);
          } else if (list.length > 0) {
            setStoreIdState(list[0].id);
            if (typeof window !== 'undefined') localStorage.setItem(STORE_KEY, list[0].id);
          } else {
            setStoreIdState(null);
          }
        } catch {
          setStores([]);
          setStoreIdState(null);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    setLoading(false);
  }, [profile]);

  const store = storeId ? stores.find((s) => s.id === storeId) ?? { id: storeId, name: '' } : null;

  const value = {
    storeId,
    store,
    stores,
    setStoreId,
    loading,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
