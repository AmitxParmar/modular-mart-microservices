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

import axios from 'axios';

let tokenGetter: (() => Promise<string | null>) | null = null;

/** Called once from ClerkTokenSync component to wire up the token source. */
export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Surface the server's error message when available
    const message =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);
