 "use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Zap, Wifi, Crown, Plus, Pencil, Archive, CreditCard, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { RazorpayModal } from "@/components/dashboard/razorpay-modal";

interface Plan {
  id: number;
  name: string;
  description: string;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  dataCapGb: number | null;
  monthlyPrice: number;
  billingCycle: string;
  status: string;
}

interface Subscription {
  id: number;
  customerId: number;
  plan: Plan;
  status: string;
  startDate: string;
  endDate?: string;
}


const tierIcons: Record<string, React.ElementType> = {
  Basic: Wifi,
  Standard: Zap,
  Premium: Crown,
};

const emptyPlanForm = {
  name: "",
  description: "",
  monthlyPrice: "",
  downloadSpeedMbps: "",
  uploadSpeedMbps: "",
  dataCapGb: "",
  billingCycle: "MONTHLY",
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { isAdmin, isCustomer } = useRole();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("plans");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyPlanForm);

  // Razorpay modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/api/plans");
      return (data.data?.content || data.data || []) as Plan[];
    },
  });

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data } = await api.get("/api/subscriptions");
      return (data.data?.content || data.data || []) as Subscription[];
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (planData: typeof form) => {
      await api.post("/api/plans", {
        name: planData.name,
        description: planData.description,
        monthlyPrice: parseFloat(planData.monthlyPrice),
        downloadSpeedMbps: parseInt(planData.downloadSpeedMbps),
        uploadSpeedMbps: parseInt(planData.uploadSpeedMbps),
        dataCapGb: planData.dataCapGb ? parseInt(planData.dataCapGb) : null,
        billingCycle: planData.billingCycle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setCreateOpen(false);
      setForm(emptyPlanForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, planData }: { id: number; planData: typeof form }) => {
      await api.put(`/api/plans/${id}`, {
        name: planData.name,
        description: planData.description,
        monthlyPrice: parseFloat(planData.monthlyPrice),
        downloadSpeedMbps: parseInt(planData.downloadSpeedMbps),
        uploadSpeedMbps: parseInt(planData.uploadSpeedMbps),
        dataCapGb: planData.dataCapGb ? parseInt(planData.dataCapGb) : null,
        billingCycle: planData.billingCycle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setEditingPlan(null);
      setForm(emptyPlanForm);
    },
  });

  const deprecateMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/api/plans/${id}/deprecate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  // Fetch customer profile so we know their 'customerId'
  // If /api/customers/me fails (no profile yet), auto-create one
  const { data: customerProfile, isLoading: profileLoading } = useQuery({
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

  // Fetch the customer's own subscriptions to find their active plan
  const { data: customerSubscriptions = [], isLoading: custSubsLoading } = useQuery({
    queryKey: ["customerSubscriptions", customerProfile?.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/subscriptions/customer/${customerProfile.id}`);
      return (data.data?.content || data.data || []) as Subscription[];
    },
    enabled: isCustomer && !!customerProfile?.id,
  });

  const activeSubscription = customerSubscriptions.find(s => ['ACTIVE', 'PENDING'].includes(s.status.toUpperCase()));
  const currentPlan = activeSubscription?.plan;

  const handleSubscribeClick = async (plan: Plan) => {
    // Ensure customer profile exists before opening the modal
    if (!customerProfile) {
      if (profileLoading) {
        alert("Loading your profile, please try again in a moment.");
        return;
      }
      // Try fetching existing profile first, then fall back to creating one
      try {
        let profile = null;
        try {
          const { data } = await api.get("/api/customers/me");
          profile = data.data;
        } catch {
          // Profile doesn't exist — create it (backend is idempotent)
          const { data } = await api.post("/api/customers", {
            firstName: user?.firstName || "Customer",
            lastName: user?.lastName || "User",
            email: user?.email || "",
            phone: "",
            accountType: "RESIDENTIAL",
          });
          profile = data.data;
        }
        if (profile) {
          queryClient.setQueryData(["customerProfile"], profile);
        } else {
          alert("Unable to set up your customer profile. Please try again.");
          return;
        }
      } catch {
        alert("Unable to set up your customer profile. Please try again.");
        return;
      }
    }
    setSelectedPlan(plan);
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["customerSubscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["customerInvoices"] });
    queryClient.invalidateQueries({ queryKey: ["customerPayments"] });
    queryClient.invalidateQueries({ queryKey: ["plans"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      monthlyPrice: String(plan.monthlyPrice),
      downloadSpeedMbps: String(plan.downloadSpeedMbps),
      uploadSpeedMbps: String(plan.uploadSpeedMbps),
      dataCapGb: plan.dataCapGb ? String(plan.dataCapGb) : "",
      billingCycle: plan.billingCycle || "MONTHLY",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, planData: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const PlanFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Plan Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Premium 300"
          required
          className="bg-white/5 border-white/10"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Ultra-fast internet for power users"
          className="bg-white/5 border-white/10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Price ($/month)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.monthlyPrice}
            onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
            required
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Data Cap (GB)</Label>
          <Input
            type="number"
            value={form.dataCapGb}
            onChange={(e) => setForm({ ...form, dataCapGb: e.target.value })}
            placeholder="Leave empty for unlimited"
            className="bg-white/5 border-white/10"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Download Speed (Mbps)</Label>
          <Input
            type="number"
            value={form.downloadSpeedMbps}
            onChange={(e) => setForm({ ...form, downloadSpeedMbps: e.target.value })}
            required
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Upload Speed (Mbps)</Label>
          <Input
            type="number"
            value={form.uploadSpeedMbps}
            onChange={(e) => setForm({ ...form, uploadSpeedMbps: e.target.value })}
            required
            className="bg-white/5 border-white/10"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Plans & Subscriptions"
        description="Browse internet plans and manage subscriptions"
      >
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setForm(emptyPlanForm); }}>
            <DialogTrigger asChild>
              <Button className="stat-gradient-blue gap-2">
                <Plus className="w-4 h-4" /> Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10">
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <PlanFormFields />
                <Button
                  type="submit"
                  className="w-full stat-gradient-blue"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          {plansLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading plans...</div>
          ) : plans.length === 0 ? (
            <EmptyState title="No plans available" icon={Package} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, i) => {
                const Icon = tierIcons[plan.name] || Wifi;
                const isDeprecated = plan.status === "DEPRECATED";
                const isCurrent = plan.id === currentPlan?.id;
                const isUpgrade = currentPlan && plan.monthlyPrice > currentPlan.monthlyPrice;
                const isDowngrade = currentPlan && plan.monthlyPrice < currentPlan.monthlyPrice;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={`glass-card border-white/5 hover:border-primary/30 transition-colors relative overflow-hidden ${isDeprecated ? "opacity-60" : ""} ${isCurrent ? "ring-1 ring-blue-500/40" : ""}`}>
                      {plan.name === "Premium" && !isDeprecated && (
                        <div className="absolute top-0 right-0">
                          <Badge className="rounded-none rounded-bl-lg stat-gradient-blue text-white text-xs">
                            Popular
                          </Badge>
                        </div>
                      )}
                      {isDeprecated && (
                        <div className="absolute top-0 right-0">
                          <Badge className="rounded-none rounded-bl-lg bg-red-500/20 text-red-400 text-xs">
                            Deprecated
                          </Badge>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute top-0 left-0">
                          <Badge className="rounded-none rounded-br-lg bg-emerald-500/20 text-emerald-400 text-xs">
                            Current Plan
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                          <span className="text-muted-foreground text-sm">/month</span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Download</span>
                            <span className="text-foreground font-medium">{plan.downloadSpeedMbps} Mbps</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Upload</span>
                            <span className="text-foreground font-medium">{plan.uploadSpeedMbps} Mbps</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data Cap</span>
                            <span className="text-foreground font-medium">
                              {plan.dataCapGb ? `${plan.dataCapGb} GB` : "Unlimited"}
                            </span>
                          </div>
                        </div>
                        {isAdmin ? (
                          <div className="flex gap-2 mt-4">
                            <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => { if (!open) { setEditingPlan(null); setForm(emptyPlanForm); } }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1 border-white/10 hover:bg-white/5"
                                  onClick={() => openEditDialog(plan)}
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="glass-card border-white/10">
                                <DialogHeader>
                                  <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                  <PlanFormFields />
                                  <Button
                                    type="submit"
                                    className="w-full stat-gradient-blue"
                                    disabled={updateMutation.isPending}
                                  >
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                            {!isDeprecated && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 border-white/10 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/20"
                                onClick={() => deprecateMutation.mutate(plan.id)}
                                disabled={deprecateMutation.isPending}
                              >
                                <Archive className="w-3 h-3" /> Deprecate
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this plan?")) {
                                  deleteMutation.mutate(plan.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className={`w-full mt-4 flex items-center justify-center gap-2 ${isCurrent
                              ? "bg-white/10 text-white cursor-default"
                              : isUpgrade
                                ? "bg-gradient-to-r from-[#1a73e8] to-[#0b57d0] hover:opacity-90 text-white"
                                : isDowngrade
                                  ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                                  : "bg-gradient-to-r from-[#1a73e8] to-[#0b57d0] hover:opacity-90 text-white"
                              }`}
                            variant={isDowngrade ? "outline" : "default"}
                            disabled={isDeprecated || isCurrent}
                            onClick={() => handleSubscribeClick(plan)}
                          >
                            <CreditCard className="w-4 h-4" />
                            {isDeprecated ? "Unavailable" :
                              isCurrent ? "Current Plan" :
                                !currentPlan ? "Subscribe & Pay" :
                                  isUpgrade ? (
                                    <>
                                      <ArrowUpRight className="w-3 h-3" /> Upgrade & Pay
                                    </>
                                  ) : (
                                    <>
                                      <ArrowDownRight className="w-3 h-3" /> Downgrade & Pay
                                    </>
                                  )
                            }
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions">
          {/* Active subscription highlight for customers */}
          {isCustomer && activeSubscription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="glass-card border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Package className="w-7 h-7 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400/70 font-medium uppercase tracking-wider">Active Plan</p>
                        <h3 className="text-xl font-bold text-white">{activeSubscription.plan?.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {activeSubscription.plan?.downloadSpeedMbps} Mbps ↓ / {activeSubscription.plan?.uploadSpeedMbps} Mbps ↑
                          {activeSubscription.plan?.dataCapGb ? ` • ${activeSubscription.plan.dataCapGb} GB` : " • Unlimited"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Monthly Price</p>
                        <p className="text-lg font-bold text-white">${activeSubscription.plan?.monthlyPrice}/mo</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Renewal Date
                        </p>
                        <p className="text-sm font-medium text-white">
                          {activeSubscription.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <StatusBadge status={activeSubscription.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card className="glass-card border-white/5">
            <CardContent className="p-0">
              {(isAdmin ? subsLoading : custSubsLoading) ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : (isAdmin ? subscriptions : customerSubscriptions).length === 0 ? (
                <EmptyState title="No subscriptions" icon={Package} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isAdmin ? subscriptions : customerSubscriptions).map((sub) => (
                      <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                        <TableCell>{sub.customerId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                              <Package className="w-3 h-3 text-blue-400" />
                            </div>
                            {sub.plan?.name || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sub.plan?.monthlyPrice ? `$${sub.plan.monthlyPrice}/mo` : "—"}
                        </TableCell>
                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Razorpay Payment Modal */}
      {selectedPlan && (
        <RazorpayModal
          open={payModalOpen}
          onClose={() => { setPayModalOpen(false); setSelectedPlan(null); }}
          plan={selectedPlan}
          customerId={customerProfile?.id || 0}
          mode="subscribe"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
