import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const fetchWithAuthRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Ensure we are in the browser environment for localStorage
  const isClient = typeof window !== "undefined";
  const accessToken = isClient ? localStorage.getItem("accessToken") : null;

  // Add Authorization header if access token exists
  if (accessToken) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  // Add Content-Type if body exists (assuming JSON body is already stringified as per requirement)
  if (options.body) {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  }

  const response = await fetch(url, options);

  if (response.status === 401 && isClient) {
    // If a refresh is already in progress, wait for it
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Important: sends the httpOnly refresh token cookie
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Refresh failed");
        })
        .then((data) => {
          if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            return data.accessToken;
          }
          throw new Error("No access token returned");
        })
        .catch((error) => {
          console.error("Error refreshing access token:", error);
          // If refresh fails, user might need to login again.
          // We don't redirect here to avoid side effects in a util, 
          // but we clear the invalid token.
          localStorage.removeItem("accessToken");
          return null;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    // Capture the promise locally to ensure we await the specific promise instance
    // we just checked/created, preventing any theoretical race conditions.
    const currentRefreshPromise = refreshPromise;

    if (currentRefreshPromise) {
      const newAccessToken = await currentRefreshPromise;
      if (newAccessToken) {
        // Retry the original request with the new access token
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };
        return await fetch(url, retryOptions);
      }
    }
  }

  return response;
};
