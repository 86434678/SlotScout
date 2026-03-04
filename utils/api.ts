
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { BEARER_TOKEN_KEY } from "@/lib/auth";

/**
 * Backend URL (auto-set by Natively)
 */
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";

/**
 * Check if backend is ready
 */
export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

/**
 * Get bearer token
 */
export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(BEARER_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error("[API] Token error:", error);
    return null;
  }
};

/**
 * Main API call with special 404 handling for Natively sync issues
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured. Rebuild the app in Natively.");
  }

  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`[API] → ${options?.method || "GET"} ${url}`);

  try {
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    const token = await getBearerToken();
    if (token) {
      (fetchOptions.headers as any).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] ❌ ${response.status} ${endpoint}`, text);

      // SPECIAL HANDLING FOR YOUR EXACT PROBLEM
      if (response.status === 404) {
        throw new Error(
          "Backend routes still deploying (Natively sync). Wait 60 seconds, reload preview, and try again. This will fix itself shortly."
        );
      }

      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log(`[API] ✅ Success ${endpoint}`);
    return data;
  } catch (error: any) {
    console.error("[API] Request failed:", error);
    throw error;
  }
};

/* --- All the helper functions (unchanged but now use the smarter apiCall) --- */
export const apiGet = async <T = any>(endpoint: string): Promise<T> =>
  apiCall<T>(endpoint, { method: "GET" });

export const apiPost = async <T = any>(endpoint: string, data: any): Promise<T> =>
  apiCall<T>(endpoint, { method: "POST", body: JSON.stringify(data) });

export const apiPut = async <T = any>(endpoint: string, data: any): Promise<T> =>
  apiCall<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });

export const apiPatch = async <T = any>(endpoint: string, data: any): Promise<T> =>
  apiCall<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });

export const apiDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> =>
  apiCall<T>(endpoint, { method: "DELETE", body: JSON.stringify(data) });

export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();
  if (!token) throw new Error("Please sign in first.");
  return apiCall<T>(endpoint, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
};

export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> =>
  authenticatedApiCall<T>(endpoint, { method: "GET" });

export const authenticatedPost = async <T = any>(endpoint: string, data: any): Promise<T> =>
  authenticatedApiCall<T>(endpoint, { method: "POST", body: JSON.stringify(data) });

/* --- Upload (image) helper — unchanged, already perfect --- */
export const apiUpload = async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
  if (!isBackendConfigured()) throw new Error("Backend not ready.");

  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`[API] 📤 Upload → ${url}`);

  const token = await getBearerToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, { method: "POST", headers, body: formData });

  if (!response.ok) {
    const text = await response.text();
    console.error("[API] Upload failed:", response.status, text);
    if (response.status === 404) {
      throw new Error("Backend still deploying — wait 60s & reload preview.");
    }
    throw new Error("Upload failed — try a smaller photo.");
  }

  const data = await response.json();
  console.log("[API] 📸 Upload success");
  return data;
};
