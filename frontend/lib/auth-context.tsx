"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export type Role = "ADMIN" | "SUPPORT" | "FINANCE" | "CUSTOMER";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("netserve_token");
    const storedUser = localStorage.getItem("netserve_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("netserve_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    const authData = data.data;

    localStorage.setItem("netserve_token", authData.accessToken);
    localStorage.setItem("netserve_refresh_token", authData.refreshToken);

    setToken(authData.accessToken);

    // Fetch user profile
    const profileRes = await api.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${authData.accessToken}` },
    });

    const profile = profileRes.data.data;
    const userData: User = {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.roles?.[0] || "CUSTOMER",
    };

    localStorage.setItem("netserve_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    const { data: regResponse } = await api.post("/api/auth/register", registerData);
    const tempToken = regResponse.data.accessToken;

    if (!tempToken) {
      console.warn("No token received after registration, cannot auto-create profile.");
      return;
    }

    try {
      // Create initial customer profile
      await api.post("/api/customers", {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        phone: registerData.phone,
        accountType: "RESIDENTIAL",
      }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
    } catch (err) {
      console.error("Failed to auto-create customer profile:", err);
      // We don't throw here to allow the user to proceed to login even if profile creation failed
    }
  }, []);

  const logout = useCallback(() => {
    // Call backend logout (fire-and-forget)
    api.post("/api/auth/logout").catch(() => {});

    localStorage.removeItem("netserve_token");
    localStorage.removeItem("netserve_refresh_token");
    localStorage.removeItem("netserve_user");
    setUser(null);
    setToken(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await api.delete("/api/auth/me");
    } finally {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        deleteAccount,
      }}
    >
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
