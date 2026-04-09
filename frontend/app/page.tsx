import React from "react";
import Link from "next/link";
import { Wifi, Zap, Shield, Headphones, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NetServe" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-lg stat-gradient-blue text-white hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <Zap className="w-3 h-3" />
            Enterprise-grade ISP Management
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Internet Service
            <br />
            <span className="text-gradient">Made Simple</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Manage customers, subscriptions, billing, usage monitoring, and
            support operations — all in one powerful platform built for modern
            ISPs.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg stat-gradient-blue text-white font-medium hover:opacity-90 transition-opacity"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-foreground hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to run an ISP
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-6 hover:border-white/10 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${f.gradient} flex items-center justify-center mb-4`}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NetServe" className="h-6 w-auto grayscale opacity-80" />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 NetServe. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Wifi,
    title: "Network Management",
    description: "Monitor devices, track usage, and manage data caps in real-time.",
    gradient: "stat-gradient-blue",
  },
  {
    icon: Zap,
    title: "Smart Billing",
    description: "Automated invoicing, tax calculations, and payment processing.",
    gradient: "stat-gradient-green",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Admin, support, finance, and customer roles with fine-grained permissions.",
    gradient: "stat-gradient-purple",
  },
  {
    icon: Headphones,
    title: "Support Center",
    description: "Ticket management, SLA tracking, and real-time outage monitoring.",
    gradient: "stat-gradient-amber",
  },
];
