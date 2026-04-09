"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, LifeBuoy, AlertTriangle, Search } from "lucide-react";

interface Ticket {
  id: number;
  customerId: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface Outage {
  id: number;
  title: string;
  affectedArea: string;
  severity: string;
  status: string;
  startTime: string;
  estimatedResolution: string;
}

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-500/10 text-slate-400",
  MEDIUM: "bg-blue-500/10 text-blue-400",
  HIGH: "bg-amber-500/10 text-amber-400",
  CRITICAL: "bg-red-500/10 text-red-400",
};

export default function SupportPage() {
  const { isAdmin, isSupport } = useRole();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customerId: "",
    subject: "",
    description: "",
    category: "BILLING",
    priority: "MEDIUM",
  });

  const { data: tickets = [], isLoading: ticketsLoading, refetch } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data } = await api.get("/api/tickets");
      return (data.data?.content || data.data || []) as Ticket[];
    },
  });

  const { data: outages = [], isLoading: outagesLoading } = useQuery({
    queryKey: ["outages"],
    queryFn: async () => {
      const { data } = await api.get("/api/outages/active");
      return (data.data || []) as Outage[];
    },
  });

  const filtered = tickets.filter((t) =>
    `${t.subject} ${t.category} ${t.status} ${t.priority}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/tickets", {
        ...newTicket,
        customerId: parseInt(newTicket.customerId),
      });
      setDialogOpen(false);
      setNewTicket({ customerId: "", subject: "", description: "", category: "BILLING", priority: "MEDIUM" });
      refetch();
    } catch {
      // handle error
    }
  };

  return (
    <>
      <PageHeader title="Support" description="Manage tickets and monitor outages">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="stat-gradient-blue gap-2">
              <Plus className="w-4 h-4" /> Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle>New Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer ID</Label>
                <Input value={newTicket.customerId}
                  onChange={(e) => setNewTicket({ ...newTicket, customerId: e.target.value })}
                  type="number" required className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newTicket.category}
                    onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BILLING">Billing</SelectItem>
                      <SelectItem value="TECHNICAL">Technical</SelectItem>
                      <SelectItem value="NETWORK">Network</SelectItem>
                      <SelectItem value="ACCOUNT">Account</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTicket.priority}
                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full stat-gradient-blue">Create Ticket</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tickets table */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-white/5">
            <CardContent className="p-0">
              <div className="p-4 border-b border-white/5">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search tickets..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10"
                  />
                </div>
              </div>

              {ticketsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No tickets" icon={LifeBuoy} />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead>ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((ticket) => (
                        <TableRow key={ticket.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="font-mono text-xs">TK-{String(ticket.id).padStart(3, "0")}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                          <TableCell className="text-sm">{ticket.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${priorityStyles[ticket.priority] || ""}`}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell><StatusBadge status={ticket.status} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active outages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Active Outages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outagesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : outages.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active outages 🎉</p>
              ) : (
                outages.map((outage) => (
                  <div key={outage.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{outage.title}</p>
                      <Badge variant="outline" className={`text-xs ${
                        outage.severity === "CRITICAL" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {outage.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">📍 {outage.affectedArea}</p>
                    {(isAdmin || isSupport) && outage.estimatedResolution && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ETA: {new Date(outage.estimatedResolution).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
