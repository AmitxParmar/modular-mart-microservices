/**
 * Singleton Axios instance.
 *
 * TOKEN STRATEGY: We cannot call a React hook inside an Axios interceptor.
 * Instead, we use a "token getter" pattern:
 *  1. `setTokenGetter()` is called once from <ClerkTokenSync> (a client component)
 *     with Clerk's `getToken` function.
 *  2. Every outgoing request calls that function to get a fresh token.
 *
 * This gives us a single shared Axios instance with zero hooks-in-interceptors issues.
 */

import axios from "axios";

let tokenGetter: ((options?: { skipCache?: boolean }) => Promise<string | null>) | null = null;

/** Called once from ClerkTokenSync component to wire up the token source. */
export function setTokenGetter(fn: (options?: { skipCache?: boolean }) => Promise<string | null>) {
  tokenGetter = fn;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      // If the request has a custom property 'skipTokenCache', use it
      const skipCache = (config as any).skipTokenCache === true;
      const token = await tokenGetter({ skipCache });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        
        // Debugging JWT structure
        if (process.env.NODE_ENV !== 'production') {
          const parts = token.split('.');
          console.debug(`[api-client] Attaching token to ${config.method?.toUpperCase()} ${config.url}`);
          console.debug(`[api-client] Token structure: ${parts.length} parts (starts with: ${token.substring(0, 10)}...)`);
          
          if (parts.length !== 3) {
            console.error("[api-client] Token does NOT look like a valid JWT (should have 3 parts).");
          }
        }
      } else {
        console.warn("[api-client] tokenGetter returned null token. Request will likely fail if it targets a protected endpoint.");
      }
    } catch (err) {
      console.error("[api-client] Error calling tokenGetter:", err);
    }
  } else {
    console.warn("[api-client] tokenGetter is not set. Ensure <ClerkTokenSync /> is rendered.");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Surface the server's error message when available
    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";

    if (error.response?.status === 401) {
      console.error("[api-client] 401 Unauthorized:", message);
    }

    return Promise.reject(new Error(message));
  },
);

