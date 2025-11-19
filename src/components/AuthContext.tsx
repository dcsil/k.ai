"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: Date | null;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  async function refreshAuth() {
    try {
      const res = await fetch("/api/auth/refresh", { 
        method: "POST",
        credentials: "include" 
      }).catch(() => null); // Silently catch network errors
      
      if (res?.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        // Decode user info from token
        const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          displayName: null,
          emailVerified: null,
          role: payload.role,
        });
      } else {
        // expected 401 error when user is not logged in
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      // handle auth check failures
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAuth();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Login failed");
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
    router.push("/");
  }

  async function signup(email: string, password: string, displayName?: string) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Signup failed");
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
    router.push("/");
  }

  async function logout() {
    await fetch("/api/auth/logout", { 
      method: "POST",
      credentials: "include"
    });
    setUser(null);
    setAccessToken(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function getAccessToken() {
  // helper for API calls
  return null;
}