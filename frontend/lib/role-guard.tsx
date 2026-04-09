"use client";

import React from "react";
import { useAuth, type Role } from "@/lib/auth-context";

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children only if the logged-in user's role
 * is included in the allowed `roles` array.
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check role-based access.
 */
export function useRole() {
  const { user } = useAuth();

  const hasRole = (...allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = user?.role === "ADMIN";
  const isSupport = user?.role === "SUPPORT";
  const isFinance = user?.role === "FINANCE";
  const isCustomer = user?.role === "CUSTOMER";

  return { hasRole, isAdmin, isSupport, isFinance, isCustomer, role: user?.role };
}
