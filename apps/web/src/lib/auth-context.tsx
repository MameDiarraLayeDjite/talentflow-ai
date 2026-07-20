"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@talentflow/types";
import { apiFetch } from "./api-client";

interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "talentflow.auth";

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as AuthUser;
    return { sub: data.sub, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

function readStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as AuthTokens) : null;
}

const emptySubscribe = () => () => {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [tokens, setTokens] = useState<AuthTokens | null>(readStoredTokens);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const isLoading = !isClient;

  const persist = useCallback((next: AuthTokens | null) => {
    setTokens(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, role: UserRole) => {
      const result = await apiFetch<AuthTokens>("/auth/register", {
        method: "POST",
        body: { email, password, role },
      });
      persist(result);
      router.push("/dashboard");
    },
    [persist, router],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<AuthTokens>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      persist(result);
      router.push("/dashboard");
    },
    [persist, router],
  );

  const logout = useCallback(async () => {
    if (tokens) {
      await apiFetch("/auth/logout", {
        method: "POST",
        accessToken: tokens.accessToken,
      }).catch(() => undefined);
    }
    persist(null);
    router.push("/login");
  }, [tokens, persist, router]);

  const user = tokens ? decodeJwt(tokens.accessToken) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: tokens?.accessToken ?? null,
        isLoading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
