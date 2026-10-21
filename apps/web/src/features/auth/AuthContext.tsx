import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { LoginInput, SignupInput, UserOutput } from '@discoverylab/shared';

import { discoveryKeys } from '@/features/discoveries/api';
import { ApiError, api } from '@/lib/api-client';

const AUTH_QUERY_KEY = ['auth', 'me'] as const;

/**
 * `/auth/me` answers 401 when there is no valid session. That is a normal
 * signed-out state, not a query failure, so it resolves to `null`.
 */
async function fetchCurrentUser(): Promise<UserOutput | null> {
  try {
    return await api.get<UserOutput>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

type AuthContextValue = {
  user: UserOutput | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<UserOutput>;
  signup: (input: SignupInput) => Promise<UserOutput>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const login = useCallback(
    async (input: LoginInput): Promise<UserOutput> => {
      const user = await api.post<UserOutput>('/auth/login', input);

      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      await queryClient.invalidateQueries({ queryKey: discoveryKeys.all });

      return user;
    },
    [queryClient],
  );

  const signup = useCallback(
    async (input: SignupInput): Promise<UserOutput> => {
      const user = await api.post<UserOutput>('/auth/signup', input);

      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      await queryClient.invalidateQueries({ queryKey: discoveryKeys.all });

      return user;
    },
    [queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    await api.post<void>('/auth/logout');

    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: discoveryKeys.all });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading: isPending,
      login,
      signup,
      logout,
    }),
    [data, isPending, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
