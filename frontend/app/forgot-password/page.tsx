"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send reset link. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#111111] to-[#000000]" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl stat-gradient-blue flex items-center justify-center mx-auto mb-6">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Forgot your password?</h2>
          <p className="text-muted-foreground text-lg">
            No worries — we&apos;ll send you a reset link to get back into your account.
          </p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" exit={{ opacity: 0, y: -10 }}>
                <Card className="glass-card border-white/5">
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-xl stat-gradient-blue flex items-center justify-center mx-auto mb-3 lg:hidden">
                      <Wifi className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                      Enter your email address and we&apos;ll send you a reset link.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-9 bg-white/5 border-white/10 h-11"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 stat-gradient-blue hover:opacity-90"
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>

                      <div className="text-center">
                        <Link
                          href="/login"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          Back to Sign In
                        </Link>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="glass-card border-white/5">
                  <CardContent className="pt-8 pb-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">Check Your Email</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      If an account exists for <span className="text-foreground font-medium">{email}</span>,
                      we&apos;ve sent a password reset link. Check your inbox and click the link to reset your password.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-6">
                      Don&apos;t see it? Check your spam folder. The link expires in 1 hour.
                    </p>

                    <div className="space-y-2">
                      <Link href="/login">
                        <Button className="w-full stat-gradient-blue hover:opacity-90">
                          Back to Sign In
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
