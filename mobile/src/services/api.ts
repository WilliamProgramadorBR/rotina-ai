import axios, { AxiosError } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "rotina-ai-token";
export const API_URL_KEY = "rotina-ai-api-url";
const SERVER_API_URL = "https://husband-store-eternal-curtis.trycloudflare.com";

const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL && !isLocalApiBaseUrl(process.env.EXPO_PUBLIC_API_URL)
    ? normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL)
    : SERVER_API_URL;

const LEGACY_API_URLS = new Set([
  "https://secret-violin-pocket-kings.trycloudflare.com",
  "https://zus-tennessee-journalists-stuck.trycloudflare.com",
  "https://smoking-context-population-tramadol.trycloudflare.com",
  "https://grand-short-adware-invision.trycloudflare.com",
  "https://occupations-minds-transformation-machinery.trycloudflare.com",
  "https://workflow-abroad-pointing-sunday.trycloudflare.com",
  "https://reliability-charger-cornwall-off.trycloudflare.com",
  "https://specializing-moss-asp-nominations.trycloudflare.com",
  "http://localhost:3333",
  "http://127.0.0.1:3333",
  "http://0.0.0.0:3333",
  "http://10.0.2.2:3333"
]);

const DEFAULT_TIMEOUT_MS = 30000;
const AI_TIMEOUT_MS = 180000;
const ENABLE_API_DEBUG_LOGS = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_API === "true";
let cachedApiBaseUrl: string | null = null;

const PUBLIC_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-reset-code",
  "/auth/reset-password",
  "/health"
]);

const UPLOADED_AVATAR_PATH = "/uploads/avatars/";

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

function isLocalApiBaseUrl(url: string | null) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(normalizeApiBaseUrl(url));
    return ["localhost", "127.0.0.1", "0.0.0.0", "10.0.2.2"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function isLegacyApiBaseUrl(url: string | null) {
  if (!url) return false;

  return LEGACY_API_URLS.has(normalizeApiBaseUrl(url)) || isLocalApiBaseUrl(url);
}

function normalizeUploadedAvatarUrl(value: string, baseURL?: string | null) {
  const apiBaseUrl = normalizeApiBaseUrl(baseURL || DEFAULT_API_URL);

  if (value.startsWith(UPLOADED_AVATAR_PATH)) {
    return `${apiBaseUrl}${value}`;
  }

  try {
    const avatarUrl = new URL(value);

    if (!avatarUrl.pathname.startsWith(UPLOADED_AVATAR_PATH)) {
      return value;
    }

    const apiUrl = new URL(apiBaseUrl);

    if (avatarUrl.origin === apiUrl.origin) {
      return value;
    }

    return `${apiBaseUrl}${avatarUrl.pathname}${avatarUrl.search}`;
  } catch {
    return value;
  }
}

function normalizeAvatarUrls(data: unknown, baseURL?: string | null, seen = new Set<object>()) {
  if (!data || typeof data !== "object") {
    return;
  }

  if (seen.has(data)) {
    return;
  }

  seen.add(data);

  if (Array.isArray(data)) {
    data.forEach((item) => normalizeAvatarUrls(item, baseURL, seen));
    return;
  }

  const record = data as Record<string, unknown>;

  Object.keys(record).forEach((key) => {
    const value = record[key];

    if (key === "avatarUrl" && typeof value === "string") {
      record[key] = normalizeUploadedAvatarUrl(value, baseURL);
      return;
    }

    normalizeAvatarUrls(value, baseURL, seen);
  });
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

  if (parsedUrl.protocol !== "https:" && !(__DEV__ && isLocalHttp)) {
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
    saveApiBaseUrl(DEFAULT_API_URL).catch((error) => {
      debugApiLog("[API URL] Nao foi possivel persistir a URL padrao:", error);
    });
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

function getRequestPath(url?: string) {
  if (!url) return "";

  try {
    return new URL(url).pathname;
  } catch {
    return url.split("?")[0];
  }
}

function isPublicEndpoint(url?: string) {
  return PUBLIC_ENDPOINTS.has(getRequestPath(url));
}

function hasAuthorizationHeader(headers: any) {
  if (!headers) return false;

  if (typeof headers.has === "function") {
    return headers.has("Authorization") || headers.has("authorization");
  }

  return Boolean(headers.Authorization || headers.authorization);
}

function setAuthorizationHeader(headers: any, token: string) {
  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
    return;
  }

  headers.Authorization = `Bearer ${token}`;
}

function clearAuthorizationHeader(headers: any) {
  if (!headers) return;

  if (typeof headers.delete === "function") {
    headers.delete("Authorization");
    headers.delete("authorization");
  }

  delete headers.Authorization;
  delete headers.authorization;
}

export function isApiNetworkError(error: unknown) {
  const axiosError = error as AxiosError<any>;

  if (axiosError?.response) {
    return false;
  }

  const code = String(axiosError?.code || "").toUpperCase();
  const message = String(axiosError?.message || error || "").toLowerCase();

  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    message.includes("network error") ||
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("timeout") ||
    message.includes("unable to verify the first certificate")
  );
}

/**
 * Helper específico para chamadas de IA.
 * Essas rotas podem demorar mais que uma request comum.
 */
export async function postPublic<T>(path: string, payload: unknown) {
  const baseURL = await getApiBaseUrl();

  return axios.post<T>(`${baseURL}${path}`, payload, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    transitional: {
      clarifyTimeoutError: true
    }
  });
}

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

    if (isPublicEndpoint(config.url)) {
      clearAuthorizationHeader(config.headers);
    } else {
      const alreadyHasAuthorization = hasAuthorizationHeader(config.headers);

      if (!alreadyHasAuthorization) {
        const token = await getAuthToken();

        if (token) {
          setAuthorizationHeader(config.headers, token);
        }
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
      hasAuthorization: hasAuthorizationHeader(config.headers),
      authorizationPreview: hasAuthorizationHeader(config.headers)
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
    normalizeAvatarUrls(response.data, response.config?.baseURL);

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
