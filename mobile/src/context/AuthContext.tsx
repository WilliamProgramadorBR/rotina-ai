import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api, getAuthToken, removeAuthToken, saveAuthToken, setAuthToken } from "../services/api";

const ENABLE_AUTH_DEBUG_LOGS = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_AUTH === "true";

function debugAuthLog(message: string, details?: unknown) {
  if (ENABLE_AUTH_DEBUG_LOGS) {
    console.log(message, details);
  }
}

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  user: User;
  token: string;
};

type AuthContextData = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback(async (data: AuthResponse) => {
    if (!data.token) {
      throw new Error("Token não recebido do backend.");
    }

    await saveAuthToken(data.token);

    setAuthToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
  }, []);

  const reloadUser = useCallback(async () => {
    const storedToken = await getAuthToken();

    debugAuthLog("[AUTH] reloadUser", {
      hasToken: Boolean(storedToken)
    });

    if (!storedToken) {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      return;
    }

    setAuthToken(storedToken);
    setTokenState(storedToken);

    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);
    } catch (error) {
      debugAuthLog("[AUTH] Token invalido ou sessao expirada. Limpando sessao.");

      await removeAuthToken();

      setTokenState(null);
      setUser(null);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password
      });

      debugAuthLog("[LOGIN RESPONSE]", {
        userId: response.data.user.id,
        hasToken: Boolean(response.data.token)
      });

      await persistSession(response.data);
    },
    [persistSession]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password
      });

      debugAuthLog("[REGISTER RESPONSE]", {
        userId: response.data.user.id,
        hasToken: Boolean(response.data.token)
      });

      await persistSession(response.data);
    },
    [persistSession]
  );

  const signOut = useCallback(async () => {
    await removeAuthToken();

    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function loadSession() {
      try {
        await reloadUser();
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [reloadUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      signIn,
      signUp,
      signOut,
      reloadUser
    }),
    [user, token, isLoading, signIn, signUp, signOut, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
