"use client";

import React from "react";
import { motion } from "framer-motion";
import { RoleGuard } from "@/lib/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Receipt,
  LifeBuoy,
  UserMinus,
  DollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const revenueData = [
  { month: "Aug", revenue: 115000 },
  { month: "Sep", revenue: 121000 },
  { month: "Oct", revenue: 128000 },
  { month: "Nov", revenue: 125000 },
  { month: "Dec", revenue: 134000 },
  { month: "Jan", revenue: 138000 },
  { month: "Feb", revenue: 142580 },
];

const ticketCategories = [
  { name: "Technical", value: 35 },
  { name: "Billing", value: 25 },
  { name: "Network", value: 20 },
  { name: "Account", value: 12 },
  { name: "General", value: 8 },
];

const churnData = [
  { month: "Aug", churned: 12, new: 45 },
  { month: "Sep", churned: 8, new: 52 },
  { month: "Oct", churned: 15, new: 38 },
  { month: "Nov", churned: 10, new: 48 },
  { month: "Dec", churned: 7, new: 55 },
  { month: "Jan", churned: 11, new: 62 },
  { month: "Feb", churned: 9, new: 58 },
];

const PIE_COLORS = ["#ededed", "#00d285", "#f5a623", "#8b5cf6", "#ec4899"];

const tooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#ededed",
};

export default function AnalyticsPage() {
  return (
    <RoleGuard roles={["ADMIN"]} fallback={<EmptyState title="Access Denied" description="Admin analytics is restricted to administrators." />}>
      <PageHeader title="Analytics" description="Platform performance and business insights" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value="$142,580" icon={DollarSign} gradient="blue" trend="+15% MoM" trendUp delay={0} />
        <StatCard label="New Customers" value="58" icon={Users} gradient="green" trend="+12% vs Jan" trendUp delay={0.1} />
        <StatCard label="Churn Rate" value="1.8%" icon={UserMinus} gradient="red" trend="-0.3% vs Jan" trendUp delay={0.2} />
        <StatCard label="Avg Resolution" value="4.2h" icon={LifeBuoy} gradient="amber" trend="-12% vs Jan" trendUp delay={0.3} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ededed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ededed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#ededed" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer growth vs churn */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Customer Growth vs Churn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={churnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="new" fill="#00d285" radius={[4, 4, 0, 0]} name="New Customers" />
                  <Bar dataKey="churned" fill="#EF4444" radius={[4, 4, 0, 0]} name="Churned" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Ticket breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-400" />
              Ticket Categories Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={250} className="max-w-xs">
                <PieChart>
                  <Pie data={ticketCategories} cx="50%" cy="50%" outerRadius={80}
                    dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {ticketCategories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticketCategories.map((cat, i) => (
                  <div key={cat.name} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <p className="text-xl font-bold">{cat.value}%</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </RoleGuard>
  );
}
