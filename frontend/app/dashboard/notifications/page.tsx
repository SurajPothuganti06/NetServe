"use client";

import React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  CreditCard,
  AlertTriangle,
  UserPlus,
  Package,
  Mail,
} from "lucide-react";

interface Notification {
  id: number;
  customerId: number;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  WELCOME: UserPlus,
  PAYMENT_RECEIVED: CreditCard,
  OUTAGE_ALERT: AlertTriangle,
  SUBSCRIPTION_ACTIVATED: Package,
  USAGE_WARNING: AlertTriangle,
};

const typeColors: Record<string, string> = {
  WELCOME: "bg-blue-500/10 text-blue-400",
  PAYMENT_RECEIVED: "bg-emerald-500/10 text-emerald-400",
  OUTAGE_ALERT: "bg-red-500/10 text-red-400",
  SUBSCRIPTION_ACTIVATED: "bg-purple-500/10 text-purple-400",
  USAGE_WARNING: "bg-amber-500/10 text-amber-400",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications");
      return (data.data?.content || data.data || []) as Notification[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  return (
    <>
      <PageHeader title="Notifications" description={`${unreadCount} unread`}>
        <Button
          variant="outline"
          className="gap-2 border-white/10 hover:bg-white/5"
          onClick={() => {
            // Mark all as read
            notifications
              .filter((n) => n.status === "UNREAD")
              .forEach((n) => markReadMutation.mutate(n.id));
          }}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="w-4 h-4" />
          Mark All Read
        </Button>
      </PageHeader>

      <Card className="glass-card border-white/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <EmptyState title="No notifications" icon={Bell} description="You're all caught up!" />
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif, i) => {
                const Icon = typeIcons[notif.type] || Mail;
                const iconColor = typeColors[notif.type] || "bg-slate-500/10 text-slate-400";
                const isUnread = notif.status === "UNREAD";

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                      isUnread ? "bg-primary/[0.03]" : ""
                    }`}
                    onClick={() => isUnread && markReadMutation.mutate(notif.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                          {notif.title}
                        </p>
                        {isUnread && (
                          <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0 h-4">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
