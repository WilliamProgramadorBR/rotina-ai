import axios, { AxiosError } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "rotina-ai-token";
export const API_URL_KEY = "rotina-ai-api-url";

const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:3333"
    : "https://ruling-strategic-dry-bio.trycloudflare.com");

const LEGACY_API_URLS = new Set([
  "https://smoking-context-population-tramadol.trycloudflare.com",
  "https://grand-short-adware-invision.trycloudflare.com"
]);

const DEFAULT_TIMEOUT_MS = 30000;
const AI_TIMEOUT_MS = 90000;
const ENABLE_API_DEBUG_LOGS = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_API === "true";
let cachedApiBaseUrl: string | null = null;

function debugApiLog(message: string, details?: unknown) {
  if (ENABLE_API_DEBUG_LOGS) {
    console.log(message, details);
  }
}

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (!canUseLocalStorage()) return null;
      return window.localStorage.getItem(TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    debugApiLog("[TOKEN] Erro ao buscar token:", error);
    return null;
  }
}

function normalizeApiBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function isLegacyApiBaseUrl(url: string | null) {
  if (!url) return false;

  return LEGACY_API_URLS.has(normalizeApiBaseUrl(url));
}

function assertValidApiBaseUrl(url: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Informe uma URL valida para a API.");
  }

  const isLocalHttp =
    parsedUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);

  if (parsedUrl.protocol !== "https:" && !isLocalHttp) {
    throw new Error("Use uma URL HTTPS para proteger os dados em transito.");
  }
}

export function getDefaultApiBaseUrl() {
  return DEFAULT_API_URL;
}

export async function getSavedApiBaseUrl(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (!canUseLocalStorage()) return null;
      return window.localStorage.getItem(API_URL_KEY);
    }

    return await SecureStore.getItemAsync(API_URL_KEY);
  } catch (error) {
    debugApiLog("[API URL] Erro ao buscar URL salva:", error);
    return null;
  }
}

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const savedUrl = await getSavedApiBaseUrl();
  const shouldUseDefault = !savedUrl || isLegacyApiBaseUrl(savedUrl);
  const baseUrl = shouldUseDefault ? DEFAULT_API_URL : savedUrl;

  if (savedUrl && shouldUseDefault) {
    await saveApiBaseUrl(DEFAULT_API_URL);
  }

  cachedApiBaseUrl = baseUrl;
  api.defaults.baseURL = baseUrl;

  return baseUrl;
}

export async function saveApiBaseUrl(url: string): Promise<string> {
  const normalizedUrl = normalizeApiBaseUrl(url);
  assertValidApiBaseUrl(normalizedUrl);

  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(API_URL_KEY, normalizedUrl);
    }
  } else {
    await SecureStore.setItemAsync(API_URL_KEY, normalizedUrl);
  }

  cachedApiBaseUrl = normalizedUrl;
  api.defaults.baseURL = normalizedUrl;

  return normalizedUrl;
}

export async function resetApiBaseUrl(): Promise<string> {
  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(API_URL_KEY);
    }
  } else {
    await SecureStore.deleteItemAsync(API_URL_KEY);
  }

  cachedApiBaseUrl = DEFAULT_API_URL;
  api.defaults.baseURL = DEFAULT_API_URL;

  return DEFAULT_API_URL;
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
    debugApiLog("[TOKEN] Erro ao salvar token:", error);
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
    debugApiLog("[TOKEN] Erro ao remover token:", error);
    setAuthToken(null);
  }
}

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  },
  transitional: {
    clarifyTimeoutError: true
  }
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function setApiToken(token: string | null) {
  setAuthToken(token);
}

/**
 * Helper específico para chamadas de IA.
 * Essas rotas podem demorar mais que uma request comum.
 */
export async function postAiScheduleSuggest(payload: {
  prompt: string;
  startDate?: string;
  timezone?: string;
}) {
  return api.post("/ai/schedules/suggest", payload, {
    timeout: AI_TIMEOUT_MS
  });
}

api.interceptors.request.use(
  async (config) => {
    config.baseURL = await getApiBaseUrl();

    const alreadyHasAuthorization = Boolean(config.headers?.Authorization);

    if (!alreadyHasAuthorization) {
      const token = await getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;

    debugApiLog("[API REQUEST]", {
      platform: Platform.OS,
      baseURL: config.baseURL,
      url: config.url,
      fullUrl,
      method: config.method,
      timeout: config.timeout,
      hasAuthorization: Boolean(config.headers?.Authorization),
      authorizationPreview: config.headers?.Authorization
        ? "Bearer ***"
        : "SEM TOKEN"
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    debugApiLog("[API RESPONSE]", {
      url: response.config?.url,
      method: response.config?.method,
      status: response.status,
      timeout: response.config?.timeout
    });

    return response;
  },
  (error: AxiosError<any>) => {
    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      String(error.message || "").toLowerCase().includes("timeout");

    debugApiLog("[API ERROR]", {
      url: error?.config?.url,
      method: error?.config?.method,
      baseURL: error?.config?.baseURL,
      timeout: error?.config?.timeout,
      status: error?.response?.status,
      code: error?.code,
      message: error?.message,
      isTimeout
    });

    return Promise.reject(error);
  }
);
