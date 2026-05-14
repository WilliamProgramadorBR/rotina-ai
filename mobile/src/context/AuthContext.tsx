import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api, getAuthToken, isApiNetworkError, postPublic, removeAuthToken, saveAuthToken, setAuthToken } from "../services/api";
import { STORAGE_KEYS } from "../constants/storage";

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

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

async function saveCachedUser(user: User) {
  const raw = JSON.stringify(user);

  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(STORAGE_KEYS.USER, raw);
    }
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEYS.USER, raw);
}

async function getCachedUser() {
  try {
    const raw = Platform.OS === "web"
      ? canUseLocalStorage()
        ? window.localStorage.getItem(STORAGE_KEYS.USER)
        : null
      : await SecureStore.getItemAsync(STORAGE_KEYS.USER);

    if (!raw) return null;

    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

async function removeCachedUser() {
  try {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        window.localStorage.removeItem(STORAGE_KEYS.USER);
      }
      return;
    }

    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  } catch (error) {
    debugAuthLog("[AUTH] Nao foi possivel limpar usuario em cache.", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback(async (data: AuthResponse) => {
    if (!data.token) {
      throw new Error("Token não recebido do backend.");
    }

    await saveAuthToken(data.token);
    await saveCachedUser(data.user);

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

    const cachedUser = await getCachedUser();

    if (cachedUser) {
      setUser(cachedUser);
    }

    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);
      await saveCachedUser(response.data.user);
    } catch (error) {
      if (isApiNetworkError(error)) {
        debugAuthLog("[AUTH] Offline. Mantendo sessao em cache.");
        setUser(cachedUser || {
          id: "offline-user",
          name: "Usuario",
          email: ""
        });
        return;
      }

      debugAuthLog("[AUTH] Token invalido ou sessao expirada. Limpando sessao.");

      await removeAuthToken();
      await removeCachedUser();

      setTokenState(null);
      setUser(null);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);

      const response = await postPublic<AuthResponse>("/auth/login", {
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
      setAuthToken(null);
      setTokenState(null);
      setUser(null);

      const response = await postPublic<AuthResponse>("/auth/register", {
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
    await removeCachedUser();

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
