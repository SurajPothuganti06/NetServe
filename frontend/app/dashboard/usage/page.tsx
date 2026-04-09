"use client";

import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard, useRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, HardDrive, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface UsageTrend {
  month: string;
  usageGb: number;
}

interface UsageSummary {
  customerId: number;
  downloadGb: number;
  uploadGb: number;
  totalGb: number;
  dataCapGb: number | null;
  percentUsed: number | null;
}

const PIE_COLORS = ["#ededed", "#333333"];

export default function UsagePage() {
  const { isAdmin, isCustomer } = useRole();

  // 1. Fetch customer profile to get the customerId
  const { data: customerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: async () => {
      const { data } = await api.get("/api/customers/me");
      return data.data;
    },
    enabled: isCustomer,
  });

  const customerId = isAdmin ? 1 : customerProfile?.id; // Admin defaults to 1 for now, or could be a search param

  // 2. Fetch usage trend
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ["usageTrend", customerId],
    queryFn: async () => {
      const { data } = await api.get(`/api/usage/history/trend/${customerId}`);
      return (data.data || []) as UsageTrend[];
    },
    enabled: !!customerId,
  });

  // 3. Fetch current usage (for data cap)
  const { data: currentUsage, isLoading: usageLoading } = useQuery({
    queryKey: ["currentUsage", customerId],
    queryFn: async () => {
      const { data } = await api.get(`/api/usage/current/${customerId}`);
      return data.data as UsageSummary;
    },
    enabled: !!customerId,
  });

  const isLoading = profileLoading || trendLoading || usageLoading;

  // Prepare data for Data Cap chart
  const used = currentUsage?.totalGb || 0;
  const cap = currentUsage?.dataCapGb || 100; // Default to 100 if unknown
  const remaining = Math.max(0, cap - used);
  const percentUsed = currentUsage?.percentUsed ?? Math.round((used / cap) * 100);

  const dataCapData = [
    { name: "Used", value: used },
    { name: "Remaining", value: remaining },
  ];

  if (!isLoading && isCustomer && !customerProfile) {
    return (
      <RoleGuard roles={["ADMIN", "CUSTOMER"]} fallback={<EmptyState title="Access Denied" />}>
        <PageHeader title="Usage Dashboard" description="Monitor data usage and consumption" />
        <EmptyState 
          title="No customer profile found" 
          description="Please complete your profile to view usage data." 
        />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={["ADMIN", "CUSTOMER"]} fallback={<EmptyState title="Access Denied" />}>
      <PageHeader title="Usage Dashboard" description="Monitor data usage and consumption" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p>Loading usage data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Usage bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Monthly Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `${v} GB`} />
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a1a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#ededed",
                        }}
                        formatter={(value: number | undefined) => [`${value ?? 0} GB`, "Usage"]}
                      />
                      <Bar dataKey="usageGb" fill="#ededed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground italic">
                    No historical records found for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Data cap ring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-white/5 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-primary" />
                  Data Cap
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dataCapData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dataCapData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#ededed",
                      }}
                      formatter={(value: number | undefined) => [`${value ?? 0} GB`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p className="text-2xl font-bold">
                    {used.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">/ {currentUsage?.dataCapGb ? `${currentUsage.dataCapGb} GB` : "Unlimited"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentUsage?.dataCapGb ? `${percentUsed}% used this cycle` : "Unlimited usage plan"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </RoleGuard>
  );
}
