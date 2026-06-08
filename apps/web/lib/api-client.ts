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
 *
 * RENDER FREE-TIER NOTES:
 * - Timeout is 30s to handle cold starts (services spin down after inactivity).
 * - 429 Too Many Requests are retried with exponential backoff (Kong rate limits reset
 *   per worker per minute, so a short wait resolves most spurious 429s).
 */

import axios, { AxiosError } from "axios";

let tokenGetter: ((options?: { skipCache?: boolean }) => Promise<string | null>) | null = null;

/** Called once from ClerkTokenSync component to wire up the token source. */
export function setTokenGetter(fn: (options?: { skipCache?: boolean }) => Promise<string | null>) {
  tokenGetter = fn;
}

const MAX_RETRIES = 3;

/** Sleep for ms milliseconds. */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  // 30s timeout: Render free-tier services cold-start in 10-60s after inactivity.
  // A 5s timeout causes spurious failures on the first request after spin-down.
  timeout: 30000,
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
  async (error: AxiosError) => {
    const config = error.config as any;
    const status = error.response?.status;

    // ── Retry on 429 Too Many Requests ────────────────────────────────────────
    // Kong rate limits with policy:local reset every minute. A short backoff
    // lets the window clear without failing the user request.
    if (status === 429) {
      config._retryCount = config._retryCount ?? 0;
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, config._retryCount - 1) * 1000;
        console.warn(
          `[api-client] 429 Too Many Requests — retry ${config._retryCount}/${MAX_RETRIES} in ${delay}ms`
        );
        await sleep(delay);
        return api(config);
      }
    }

    // ── Surface the server's error message ────────────────────────────────────
    const responseData = error.response?.data as any;
    let message = responseData?.message ?? error.message ?? "An unexpected error occurred";

    if (status === 401) {
      if (typeof message === 'string' && message.includes('Service Trust Violation')) {
        // This is a misconfiguration: Kong's X-Gateway-Secret header is missing
        // or wrong. This should NOT happen in production — it means the Kong
        // GATEWAY_INTERNAL_SECRET env var is not set correctly.
        console.error(
          "[api-client] Service Trust Violation: The API Gateway did not attach the " +
          "X-Gateway-Secret header. Verify GATEWAY_INTERNAL_SECRET is set in the " +
          "Render Dashboard for both kong-gateway and the target microservice."
        );
        message = "Service configuration error. Please try again later.";
      } else {
        console.error("[api-client] 401 Unauthorized:", message);
      }
    }

    if (status === 429) {
      console.error("[api-client] Rate limit exceeded after retries. Try again in a minute.");
      message = "Too many requests. Please wait a moment and try again.";
    }

    throw new Error(message);
  },
);


