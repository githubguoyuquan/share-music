"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type User = { id: string; phone: string; role: string; nickname?: string | null };

type AuthState = {
  checked: boolean;
  user: User | null;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({ checked: false, user: null, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data?.success ? data.data : null);
    } catch {
      setUser(null);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <AuthCtx.Provider value={{ checked, user, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
