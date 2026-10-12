import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, apiFetch, setUnauthorizedHandler } from '@/lib/api';
import type { AuthUser } from '../types';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'error' }
  | { status: 'signedIn'; user: AuthUser };

type AuthContextValue = {
  state: AuthState;
  user: AuthUser | null;
  hasRole: (role: string) => boolean;
  reload: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const LOGIN_PATH = '/api/v1/auth/login';

// A sessão mora no servidor (cookie que o JavaScript não lê). A tela só pergunta "quem sou eu?".
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    apiFetch<{ user: AuthUser }>('/api/v1/auth/me')
      .then((result) => {
        if (active) setState({ status: 'signedIn', user: result.user });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const unauthenticated = error instanceof ApiError && error.status === 401;
        setState({ status: unauthenticated ? 'signedOut' : 'error' });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  // Qualquer resposta 401 depois de entrar (sessão vencida, sessão encerrada em outro lugar).
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'signedOut' }));
    return () => setUnauthorizedHandler(null);
  }, []);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  const signOut = useCallback(async () => {
    let target = '/login';
    try {
      const result = await apiFetch<{ logoutUrl: string }>('/api/v1/auth/logout', {
        method: 'POST',
      });
      target = result.logoutUrl;
    } catch {
      // Sem resposta do servidor: voltamos ao login mesmo assim.
    }
    setState({ status: 'signedOut' });
    window.location.assign(target);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = state.status === 'signedIn' ? state.user : null;
    return {
      state,
      user,
      hasRole: (role) => user?.roles.includes(role) ?? false,
      reload,
      signOut,
    };
  }, [state, reload, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
