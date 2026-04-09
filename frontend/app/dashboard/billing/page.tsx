"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard, useRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Receipt, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { RazorpayModal } from "@/components/dashboard/razorpay-modal";

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  subscriptionId: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt: string;
  createdAt: string;
  lineItems?: LineItem[];
}

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { isCustomer, isAdmin } = useRole();
  const queryClient = useQueryClient();

  // Razorpay modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const { data: customerProfile } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/customers/me");
        return data.data;
      } catch {
        return null;
      }
    },
    enabled: isCustomer,
    retry: 1,
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", customerProfile?.id],
    queryFn: async () => {
      const url = isCustomer
        ? `/api/invoices/customer/${customerProfile.id}`
        : "/api/invoices";
      const { data } = await api.get(url);
      return (data.data?.content || data.data || []) as Invoice[];
    },
    enabled: !isCustomer || !!customerProfile?.id,
  });

  // Fetch plans (needed for RazorpayModal)
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/api/plans");
      return (data.data?.content || data.data || []) as any[];
    },
  });

  // Fetch customer subscriptions to find associated plan for an invoice
  const { data: customerSubscriptions = [] } = useQuery({
    queryKey: ["customerSubscriptions", customerProfile?.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/subscriptions/customer/${customerProfile.id}`);
      return (data.data?.content || data.data || []) as any[];
    },
    enabled: isCustomer && !!customerProfile?.id,
  });

  const filtered = invoices.filter((inv) =>
    `${inv.id} ${inv.invoiceNumber || ""} ${inv.customerId} ${inv.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handlePayInvoice = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["customerInvoices"] });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["customerPayments"] });
  };

  // Find the plan associated with a paying invoice
  const getPlanForInvoice = (invoice: Invoice) => {
    const sub = customerSubscriptions.find(
      (s: any) => s.id === invoice.subscriptionId
    );
    if (sub?.plan) return sub.plan;
    // Fallback: pick first plan
    return plans[0] || { id: 0, name: "Service", monthlyPrice: invoice.totalAmount, description: "", downloadSpeedMbps: 0, uploadSpeedMbps: 0, dataCapGb: null, billingCycle: "MONTHLY", status: "ACTIVE" };
  };

  const isPayable = (status: string) =>
    status === "ISSUED" || status === "OVERDUE";

  return (
    <RoleGuard
      roles={["ADMIN", "FINANCE", "CUSTOMER"]}
      fallback={<EmptyState title="Access Denied" />}
    >
      <PageHeader title="Billing & Invoices" description="View and manage invoices" />

      {/* Summary cards for customers */}
      {isCustomer && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border-white/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Invoices</p>
              <p className="text-2xl font-bold text-white">{invoices.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-emerald-500/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${invoices
                  .filter((i) => i.status === "PAID")
                  .reduce((s, i) => s + (i.totalAmount || 0), 0)
                  .toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-amber-500/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-amber-400">
                ${invoices
                  .filter((i) => isPayable(i.status))
                  .reduce((s, i) => s + (i.totalAmount || 0), 0)
                  .toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-card border-white/5">
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No invoices" icon={Receipt} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    {isCustomer && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <React.Fragment key={inv.id}>
                      <TableRow className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="w-8">
                          {inv.lineItems && inv.lineItems.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedRow(expandedRow === inv.id ? null : inv.id)
                              }
                              className="text-muted-foreground hover:text-white transition-colors"
                            >
                              {expandedRow === inv.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {inv.invoiceNumber || `INV-${String(inv.id).padStart(4, "0")}`}
                        </TableCell>
                        <TableCell>{inv.customerId}</TableCell>
                        <TableCell className="font-medium">
                          ${inv.totalAmount?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </TableCell>
                        {isCustomer && (
                          <TableCell>
                            {isPayable(inv.status) ? (
                              <Button
                                size="sm"
                                className="h-7 text-xs px-3 bg-gradient-to-r from-[#1a73e8] to-[#0b57d0] hover:opacity-90 gap-1.5"
                                onClick={() => handlePayInvoice(inv)}
                              >
                                <CreditCard className="w-3 h-3" />
                                Pay Now
                              </Button>
                            ) : inv.status === "PAID" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                              >
                                Paid{" "}
                                {inv.paidAt
                                  ? new Date(inv.paidAt).toLocaleDateString()
                                  : ""}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {/* Expandable line items */}
                      {expandedRow === inv.id &&
                        inv.lineItems &&
                        inv.lineItems.length > 0 && (
                          <TableRow className="border-white/5 bg-white/[0.01]">
                            <TableCell colSpan={isCustomer ? 7 : 6} className="py-3 px-8">
                              <div className="text-xs space-y-1.5">
                                <p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px] mb-2">
                                  Line Items
                                </p>
                                {inv.lineItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between py-1.5 px-3 rounded-md bg-white/[0.02]"
                                  >
                                    <span className="text-white/70">
                                      {item.description}
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-muted-foreground">
                                        Qty: {item.quantity}
                                      </span>
                                      <span className="text-muted-foreground">
                                        @ ${item.unitPrice?.toFixed(2)}
                                      </span>
                                      <span className="text-white font-medium">
                                        ${item.totalPrice?.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Razorpay Modal for invoice payment */}
      {payingInvoice && customerProfile && (
        <RazorpayModal
          open={payModalOpen}
          onClose={() => {
            setPayModalOpen(false);
            setPayingInvoice(null);
          }}
          plan={getPlanForInvoice(payingInvoice)}
          customerId={customerProfile.id}
          mode="invoice"
          invoiceId={payingInvoice.id}
          invoiceAmount={payingInvoice.totalAmount}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </RoleGuard>
  );
}
