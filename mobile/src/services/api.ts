import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "rotina-ai-token";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web" ? "http://localhost:3333" : "https://republican-therapy-donation-rachel.trycloudflare.com");

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (!canUseLocalStorage()) return null;
      return window.localStorage.getItem(TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.log("[TOKEN] Erro ao buscar token:", error);
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }

      setAuthToken(token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
  } catch (error) {
    console.log("[TOKEN] Erro ao salvar token:", error);
    throw error;
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        window.localStorage.removeItem(TOKEN_KEY);
      }

      setAuthToken(null);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
  } catch (error) {
    console.log("[TOKEN] Erro ao remover token:", error);
    setAuthToken(null);
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use(
  async (config) => {
    const alreadyHasAuthorization = Boolean(config.headers?.Authorization);

    if (!alreadyHasAuthorization) {
      const token = await getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.log("[API REQUEST]", {
      platform: Platform.OS,
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      hasAuthorization: Boolean(config.headers?.Authorization),
      authorizationPreview: config.headers?.Authorization ? "Bearer ***" : "SEM TOKEN"
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("[API ERROR]", {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data
    });

    return Promise.reject(error);
  }
);