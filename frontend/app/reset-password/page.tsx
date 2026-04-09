"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wifi, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If no token in URL, show a message
  if (!tokenFromUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-white/5">
            <CardContent className="pt-8 pb-6 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Missing Reset Token</h3>
              <p className="text-sm text-muted-foreground mb-6">
                It looks like you reached this page without a valid reset link.
                Please check your email for the password reset link, or request a new one.
              </p>
              <div className="space-y-2">
                <Link href="/forgot-password">
                  <Button className="w-full stat-gradient-blue hover:opacity-90">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const passwordChecks = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "Contains a number", valid: /\d/.test(newPassword) },
    { label: "Passwords match", valid: newPassword === confirmPassword && confirmPassword.length > 0 },
  ];

  const allValid = passwordChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    setError("");
    setLoading(true);
    try {
      await api.put("/api/auth/reset-password", { token: tokenFromUrl, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to reset password. The link may be invalid or expired.";
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
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl stat-gradient-green flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Set a New Password</h2>
          <p className="text-muted-foreground text-lg">
            Choose a strong password to keep your NetServe account secure.
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
            {!success ? (
              <motion.div key="form" exit={{ opacity: 0, y: -10 }}>
                <Card className="glass-card border-white/5">
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-xl stat-gradient-green flex items-center justify-center mx-auto mb-3 lg:hidden">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl">New Password</CardTitle>
                    <CardDescription>
                      Choose a new password for your account.
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
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="pl-9 pr-10 bg-white/5 border-white/10 h-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="pl-9 bg-white/5 border-white/10 h-11"
                          />
                        </div>
                      </div>

                      {/* Password strength checks */}
                      {newPassword.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-1.5"
                        >
                          {passwordChecks.map((check) => (
                            <div key={check.label} className="flex items-center gap-2 text-xs">
                              <div
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  check.valid ? "bg-emerald-400" : "bg-white/20"
                                }`}
                              />
                              <span className={check.valid ? "text-emerald-400" : "text-muted-foreground"}>
                                {check.label}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading || !allValid}
                        className="w-full h-11 stat-gradient-blue hover:opacity-90"
                      >
                        {loading ? "Resetting..." : "Reset Password"}
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
                    <h3 className="text-xl font-bold mb-2">Password Reset!</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Your password has been updated successfully. Redirecting you to sign in...
                    </p>
                    <Link href="/login">
                      <Button className="w-full stat-gradient-blue hover:opacity-90">
                        Sign In Now
                      </Button>
                    </Link>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
