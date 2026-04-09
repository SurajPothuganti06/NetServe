"use client";

import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Users,
  CreditCard,
  Receipt,
  LifeBuoy,
  Package,
  BarChart3,
  Activity,
  Plus,
  ArrowRight,
  AlertTriangle,
  Zap,
  Wifi,
  Crown,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DashboardOverview() {
  const { user } = useAuth();
  const { isAdmin, isSupport, isFinance, isCustomer } = useRole();

  const { data: customerProfile } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/customers/me");
        return data.data;
      } catch (err: any) {
        // Profile doesn't exist yet — auto-create it
        if (err.response?.status === 500 || err.response?.status === 404 || err.response?.status === 403) {
          try {
            const { data } = await api.post("/api/customers", {
              firstName: user?.firstName || "Customer",
              lastName: user?.lastName || "User",
              email: user?.email || "",
              phone: "",
              accountType: "RESIDENTIAL",
            });
            return data.data;
          } catch {
            return null;
          }
        }
        return null;
      }
    },
    enabled: isCustomer,
    retry: 1,
  });

  const { data: totalCustomers = 0 } = useQuery({
    queryKey: ["totalCustomers"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/customers?size=1");
        return data.data?.totalElements || 0;
      } catch { return 0; }
    },
    enabled: isAdmin || isSupport,
  });

  const { data: totalSubscriptions = 0 } = useQuery({
    queryKey: ["totalSubscriptions"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/subscriptions?size=1");
        return data.data?.totalElements || 0;
      } catch { return 0; }
    },
    enabled: isAdmin,
  });

  const { data: customerSubscriptions = [] } = useQuery({
    queryKey: ["customerSubscriptions", customerProfile?.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/subscriptions/customer/${customerProfile.id}`);
        return (data.data?.content || data.data || []) as any[];
      } catch { return []; }
    },
    enabled: isCustomer && !!customerProfile?.id,
  });

  const { data: customerInvoices = [] } = useQuery({
    queryKey: ["customerInvoices", customerProfile?.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/invoices/customer/${customerProfile.id}`);
        return (data.data?.content || data.data || []) as any[];
      } catch { return []; }
    },
    enabled: isCustomer && !!customerProfile?.id,
  });

  const { data: customerPayments = [] } = useQuery({
    queryKey: ["customerPayments", customerProfile?.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/payments/customer/${customerProfile.id}`);
        return (data.data?.content || data.data || []) as any[];
      } catch { return []; }
    },
    enabled: isCustomer && !!customerProfile?.id,
  });

  // Fetch plans for plan insights
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/plans");
        return (data.data?.content || data.data || []) as any[];
      } catch { return []; }
    },
  });

  // Admin: fetch all subscriptions for plan distribution
  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["allSubscriptions"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/subscriptions?size=200");
        return (data.data?.content || data.data || []) as any[];
      } catch { return []; }
    },
    enabled: isAdmin,
  });

  // Calculate active plan and pending bill
  const activeSub = customerSubscriptions.find((s: any) => s.status === "ACTIVE" || s.status === "PENDING");
  const activePlanName = activeSub?.plan?.name || "No Active Plan";
  const pendingInvoicesAmount = customerInvoices
    .filter((inv: any) => inv.status === "ISSUED" || inv.status === "OVERDUE")
    .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const pendingBillAmount = pendingInvoicesAmount > 0 
    ? pendingInvoicesAmount 
    : (activeSub?.plan?.monthlyPrice || 0);

  // Plan insights data for charts
  const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  // Admin: plan distribution pie chart data
  const planDistribution = plans.map((plan: any, idx: number) => {
    const count = allSubscriptions.filter(
      (sub: any) => sub.plan?.id === plan.id && (sub.status === "ACTIVE" || sub.status === "PENDING")
    ).length;
    return { name: plan.name, value: count, color: CHART_COLORS[idx % CHART_COLORS.length] };
  }).filter((d: any) => d.value > 0);

  // Admin: revenue by plan bar chart data
  const revenueByPlan = plans.map((plan: any, idx: number) => {
    const count = allSubscriptions.filter(
      (sub: any) => sub.plan?.id === plan.id && (sub.status === "ACTIVE" || sub.status === "PENDING")
    ).length;
    return {
      name: plan.name,
      revenue: plan.monthlyPrice * count,
      subscribers: count,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  const totalMonthlyRevenue = revenueByPlan.reduce((s: number, d: any) => s + d.revenue, 0);

  // Customer: plan comparison data (current plan vs others)
  const planComparisonData = plans.map((plan: any) => ({
    name: plan.name,
    download: plan.downloadSpeedMbps,
    upload: plan.uploadSpeedMbps,
    isCurrent: plan.id === activeSub?.plan?.id,
  }));

  // Tier icon map
  const tierIcons: Record<string, React.ElementType> = { Basic: Wifi, Standard: Zap, Premium: Crown };

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.firstName}`}
        description={getGreetingDescription(user?.role)}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin && (
          <>
            <StatCard label="Total Customers" value={totalCustomers.toLocaleString()} icon={Users} gradient="blue" delay={0} />
            <StatCard label="Active Subscriptions" value={totalSubscriptions.toLocaleString()} icon={Package} gradient="green" delay={0.1} />
            <StatCard label="Monthly Revenue" value={`$${totalMonthlyRevenue.toFixed(0)}`} icon={Receipt} gradient="purple" delay={0.2} />
            <StatCard label="Open Tickets" value="0" icon={LifeBuoy} gradient="amber" delay={0.3} />
          </>
        )}

        {isSupport && !isAdmin && (
          <>
            <StatCard label="Open Tickets" value="0" icon={LifeBuoy} gradient="amber" delay={0} />
            <StatCard label="Active Outages" value="0" icon={AlertTriangle} gradient="red" delay={0.1} />
            <StatCard label="Customers" value={totalCustomers.toLocaleString()} icon={Users} gradient="blue" delay={0.2} />
            <StatCard label="Avg Resolution" value="0h" icon={Activity} gradient="green" delay={0.3} />
          </>
        )}

        {isFinance && !isAdmin && (
          <>
            <StatCard label="Monthly Revenue" value={`$${totalMonthlyRevenue.toFixed(0)}`} icon={Receipt} gradient="blue" delay={0} />
            <StatCard label="Overdue Invoices" value="0" icon={Receipt} gradient="red" delay={0.1} />
            <StatCard label="Pending Payments" value="0" icon={CreditCard} gradient="amber" delay={0.2} />
            <StatCard label="Collected This Month" value="$0" icon={BarChart3} gradient="green" delay={0.3} />
          </>
        )}

        {isCustomer && (
          <>
            <StatCard label="My Plan" value={activePlanName} icon={Package} gradient="blue" delay={0} />
            <StatCard label="Next Bill" value={`$${pendingBillAmount.toFixed(2)}`} icon={Receipt} gradient="amber" delay={0.1} />
            <StatCard label="Data Used" value="0%" icon={BarChart3} gradient="green" delay={0.2} />
            <StatCard label="My Tickets" value="0" icon={LifeBuoy} gradient="purple" delay={0.3} />
          </>
        )}

      </div>

      {/* Quick actions + Plan Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-white/5 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(isAdmin || isSupport) && (
                <Link href="/dashboard/customers">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-blue-400" />
                    </div>
                    New Customer
                  </Button>
                </Link>
              )}
              {(isAdmin || isSupport || isCustomer) && (
                <Link href="/dashboard/support">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <LifeBuoy className="w-4 h-4 text-amber-400" />
                    </div>
                    Create Ticket
                  </Button>
                </Link>
              )}
              {(isAdmin || isFinance) && (
                <Link href="/dashboard/billing">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-purple-400" />
                    </div>
                    Generate Invoice
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/subscriptions">
                <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-emerald-400" />
                  </div>
                  {isCustomer ? "View Plans" : "Browse Plans"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Insights — Admin */}
        {isAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card border-white/5 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Plan Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {planDistribution.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="50%" height={160}>
                        <PieChart>
                          <Pie
                            data={planDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={60}
                            stroke="none"
                          >
                            {planDistribution.map((entry: any, idx: number) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                            itemStyle={{ color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 flex-1">
                        {planDistribution.map((d: any) => (
                          <div key={d.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                              <span className="text-white/70">{d.name}</span>
                            </div>
                            <span className="text-white font-medium">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No active subscriptions yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass-card border-white/5 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Revenue by Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueByPlan.some((d: any) => d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={revenueByPlan} barCategoryGap="30%">
                        <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                          itemStyle={{ color: "#fff" }}
                          formatter={(value: any) => [`$${value.toFixed(2)}`, "Revenue"]}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                          {revenueByPlan.map((entry: any, idx: number) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No revenue data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Plan Insights — Customer */}
        {isCustomer && activeSub && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card border-white/5 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  My Plan Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active Plan Card */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          {React.createElement(tierIcons[activeSub.plan?.name] || Wifi, {
                            className: "w-5 h-5 text-blue-400",
                          })}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{activeSub.plan?.name}</h4>
                          <p className="text-xs text-blue-400/70">{activeSub.plan?.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase">Speed</p>
                          <p className="text-white font-medium">
                            {activeSub.plan?.downloadSpeedMbps}↓ / {activeSub.plan?.uploadSpeedMbps}↑ Mbps
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase">Data</p>
                          <p className="text-white font-medium">
                            {activeSub.plan?.dataCapGb ? `${activeSub.plan.dataCapGb} GB` : "Unlimited"}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase">Price</p>
                          <p className="text-white font-medium">${activeSub.plan?.monthlyPrice}/mo</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase">Renewal</p>
                          <p className="text-white font-medium">
                            {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription history */}
                    {customerSubscriptions.length > 1 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Plan History</p>
                        <div className="space-y-1.5">
                          {customerSubscriptions.slice(0, 4).map((sub: any) => (
                            <div key={sub.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${sub.status === "ACTIVE" ? "bg-emerald-400" : sub.status === "CANCELLED" ? "bg-red-400" : "bg-amber-400"}`} />
                                <span className="text-white/70">{sub.plan?.name || "—"}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                  {new Date(sub.startDate).toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                  {sub.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Speed Comparison Chart */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Speed Comparison</p>
                    {planComparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={planComparisonData} layout="vertical" barCategoryGap="25%">
                          <XAxis type="number" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} Mbps`} />
                          <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                          <Tooltip
                            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                            itemStyle={{ color: "#fff" }}
                            formatter={(value: any, name: any) => [`${value} Mbps`, name === "download" ? "Download" : "Upload"]}
                          />
                          <Bar dataKey="download" fill="#3b82f6" name="Download" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="upload" fill="#06b6d4" name="Upload" radius={[0, 4, 4, 0]} />
                          <Legend
                            verticalAlign="top"
                            wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                            formatter={(value: any) => <span style={{ color: "#888" }}>{value}</span>}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No plan data available
                      </div>
                    )}
                    <Link href="/dashboard/subscriptions">
                      <Button variant="ghost" size="sm" className="text-xs text-blue-400 mt-2 w-full gap-1">
                        <ArrowRight className="w-3 h-3" /> Compare & Switch Plans
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Financial Overview for Customers */}
        {isCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3"
          >
            <Card className="glass-card border-white/5 h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Financial Overview</CardTitle>
                <div className="flex gap-2">
                  <Link href="/dashboard/payments">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Payments history
                    </Button>
                  </Link>
                  <Link href="/dashboard/billing">
                    <Button variant="ghost" size="sm" className="text-xs text-blue-400">
                      View Invoices
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Recent Payments Summary */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Recent Payments
                    </h4>
                    <div className="space-y-3">
                      {customerPayments.slice(0, 3).length > 0 ? customerPayments.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{p.paymentMethod.replace(/_/g, " ")}</span>
                            <span className="text-xs text-muted-foreground">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-mono text-emerald-400">+${p.amount.toFixed(2)}</span>
                            <Badge variant="ghost" className="text-[10px] h-4 px-1 uppercase opacity-70">{p.status}</Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm text-center py-4 text-muted-foreground bg-white/5 rounded-lg border border-dashed border-white/10">
                          No payment history
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Invoices Summary */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Unpaid Invoices
                    </h4>
                    <div className="space-y-3">
                      {customerInvoices.filter((inv: any) => inv.status !== "PAID" && inv.status !== "CANCELLED").length > 0 ? (
                        customerInvoices.filter((inv: any) => inv.status !== "PAID" && inv.status !== "CANCELLED").slice(0, 3).map((inv: any) => (
                          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 ring-1 ring-blue-500/20">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium font-mono">#{inv.invoiceNumber || `INV-${String(inv.id).padStart(4, "0")}`}</span>
                              <span className="text-xs text-amber-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-bold text-foreground">${inv.totalAmount.toFixed(2)}</span>
                              <Link href="/dashboard/billing">
                                <Button size="sm" className="h-6 text-[10px] px-2 bg-gradient-to-r from-[#1a73e8] to-[#0b57d0]">Pay Now</Button>
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-center py-4 text-muted-foreground bg-emerald-500/5 rounded-lg border border-dashed border-emerald-500/20">
                          <p className="text-emerald-400/80">You're all caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

    </>
  );
}

function getGreetingDescription(role?: string) {
  switch (role) {
    case "ADMIN": return "Here's your platform overview for today.";
    case "SUPPORT": return "Here's your ticket and support summary.";
    case "FINANCE": return "Here's your billing and revenue snapshot.";
    case "CUSTOMER": return "Here's your account summary.";
    default: return "Welcome to NetServe.";
  }
}
