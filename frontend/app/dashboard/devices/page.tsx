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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Router } from "lucide-react";

interface Device {
  id: number;
  customerId: number;
  macAddress: string;
  deviceType: string;
  status: string;
  registeredAt: string;
}

export default function DevicesPage() {
  const { isAdmin } = useRole();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    customerId: "",
    macAddress: "",
    deviceType: "ROUTER",
  });

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data } = await api.get("/api/devices");
      return (data.data?.content || data.data || []) as Device[];
    },
  });

  const filtered = devices.filter((d) =>
    `${d.macAddress} ${d.deviceType} ${d.status} ${d.customerId}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/devices", {
        ...newDevice,
        customerId: parseInt(newDevice.customerId),
      });
      setDialogOpen(false);
      setNewDevice({ customerId: "", macAddress: "", deviceType: "ROUTER" });
      refetch();
    } catch {
      // handle error
    }
  };

  return (
    <RoleGuard roles={["ADMIN", "SUPPORT"]} fallback={<EmptyState title="Access Denied" />}>
      <PageHeader title="Device Management" description="Register and monitor customer devices">
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="stat-gradient-blue gap-2">
                <Plus className="w-4 h-4" /> Register Device
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10">
              <DialogHeader>
                <DialogTitle>Register Device</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer ID</Label>
                  <Input value={newDevice.customerId}
                    onChange={(e) => setNewDevice({ ...newDevice, customerId: e.target.value })}
                    type="number" required className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>MAC Address</Label>
                  <Input value={newDevice.macAddress}
                    onChange={(e) => setNewDevice({ ...newDevice, macAddress: e.target.value })}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    required className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Input value={newDevice.deviceType}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                    required className="bg-white/5 border-white/10"
                  />
                </div>
                <Button type="submit" className="w-full stat-gradient-blue">Register</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card className="glass-card border-white/5">
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search devices..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No devices" icon={Router} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((device) => (
                    <TableRow key={device.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-xs">{device.id}</TableCell>
                      <TableCell>{device.customerId}</TableCell>
                      <TableCell className="font-mono text-xs">{device.macAddress}</TableCell>
                      <TableCell>{device.deviceType}</TableCell>
                      <TableCell><StatusBadge status={device.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(device.registeredAt).toLocaleDateString()}
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
