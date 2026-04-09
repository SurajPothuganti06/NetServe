"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard, useRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CreditCard } from "lucide-react";

interface Payment {
  id: number;
  customerId: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionRef: string;
  paidAt: string;
}

const methodStyles: Record<string, string> = {
  CREDIT_CARD: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  BANK_TRANSFER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  UPI: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const { isCustomer, isAdmin } = useRole();

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

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", customerProfile?.id],
    queryFn: async () => {
      const url = isCustomer 
        ? `/api/payments/customer/${customerProfile.id}`
        : "/api/payments";
      const { data } = await api.get(url);
      return (data.data?.content || data.data || []) as Payment[];
    },
    enabled: !isCustomer || !!customerProfile?.id,
  });


  const filtered = payments.filter((p) =>
    `${p.id} ${p.transactionRef} ${p.paymentMethod} ${p.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <RoleGuard roles={["ADMIN", "FINANCE", "CUSTOMER"]} fallback={<EmptyState title="Access Denied" />}>
      <PageHeader title="Payments" description="Track and manage payment transactions" />

      <Card className="glass-card border-white/5">
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No payments" icon={CreditCard} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => (
                    <TableRow key={payment.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                      <TableCell>{payment.customerId}</TableCell>
                      <TableCell className="font-mono text-xs">INV-{String(payment.invoiceId).padStart(4, "0")}</TableCell>
                      <TableCell className="font-medium">${payment.amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${methodStyles[payment.paymentMethod] || ""}`}>
                          {payment.paymentMethod?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell><StatusBadge status={payment.status} /></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{payment.transactionRef}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </RoleGuard>
  );
}
