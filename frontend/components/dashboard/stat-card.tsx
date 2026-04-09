"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: "blue" | "green" | "amber" | "purple" | "red";
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

const gradientMap = {
  blue: "stat-gradient-blue",
  green: "stat-gradient-green",
  amber: "stat-gradient-amber",
  purple: "stat-gradient-purple",
  red: "stat-gradient-red",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  trend,
  trendUp,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="glass-card border-white/5 p-5 hover:border-white/10 transition-colors">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p
                className={`text-xs font-medium ${
                  trendUp ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {trend}
              </p>
            )}
          </div>
          <div
            className={`w-11 h-11 rounded-xl ${gradientMap[gradient]} flex items-center justify-center shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
