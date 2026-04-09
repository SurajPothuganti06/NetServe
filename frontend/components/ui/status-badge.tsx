import React from "react";
import { Badge } from "@/components/ui/badge";

type StatusVariant = "active" | "inactive" | "pending" | "error" | "resolved" | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  resolved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  default: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const autoDetectVariant = (status: string): StatusVariant => {
  const s = status.toUpperCase();
  if (["ACTIVE", "PAID", "COMPLETED", "RESOLVED", "ONLINE", "SUCCESS"].includes(s)) return "active";
  if (["SUSPENDED", "CANCELLED", "CLOSED", "INACTIVE", "OFFLINE", "CHURNED"].includes(s)) return "inactive";
  if (["PENDING", "DRAFT", "OPEN", "IN_PROGRESS", "INVESTIGATING", "SENT"].includes(s)) return "pending";
  if (["FAILED", "OVERDUE", "REJECTED", "ERROR"].includes(s)) return "error";
  return "default";
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const v = variant || autoDetectVariant(status);
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${variantStyles[v]}`}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
