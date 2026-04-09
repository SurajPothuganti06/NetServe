"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Smartphone, Building2, Check, Loader2, Shield, Zap } from "lucide-react";
import api from "@/lib/api";

interface Plan {
  id: number;
  name: string;
  description: string;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  dataCapGb: number | null;
  monthlyPrice: number;
  billingCycle: string;
}

interface RazorpayModalProps {
  open: boolean;
  onClose: () => void;
  plan: Plan;
  customerId: number;
  mode: "subscribe" | "invoice";
  invoiceId?: number;
  invoiceAmount?: number;
  onSuccess: () => void;
}

type PaymentTab = "upi" | "card" | "netbanking";
type FlowState = "form" | "processing" | "success" | "error";

export function RazorpayModal({
  open,
  onClose,
  plan,
  customerId,
  mode,
  invoiceId,
  invoiceAmount,
  onSuccess,
}: RazorpayModalProps) {
  const [tab, setTab] = useState<PaymentTab>("upi");
  const [flowState, setFlowState] = useState<FlowState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [processingStep, setProcessingStep] = useState("");

  const amount = mode === "invoice" ? invoiceAmount || 0 : plan.monthlyPrice;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFlowState("form");
      setErrorMsg("");
      setTab("upi");
      setUpiId("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardName("");
      setSelectedBank("");
      setProcessingStep("");
    }
  }, [open]);

  const pollForInvoice = useCallback(
    async (custId: number, maxRetries = 10): Promise<any> => {
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 800));
        try {
          const { data } = await api.get(`/api/invoices/customer/${custId}`);
          const invoices = data.data?.content || data.data || [];
          const unpaid = invoices.find(
            (inv: any) => inv.status === "ISSUED" || inv.status === "OVERDUE"
          );
          if (unpaid) return unpaid;
        } catch {
          // continue polling
        }
      }
      return null;
    },
    []
  );

  const handlePayment = async () => {
    setFlowState("processing");
    setErrorMsg("");

    try {
      if (mode === "subscribe") {
        // Step 1: Subscribe
        setProcessingStep("Creating subscription...");
        await api.post("/api/subscriptions/subscribe", {
          customerId,
          planId: plan.id,
          autoRenew: true,
        });

        // Step 2: Poll for invoice (Kafka event chain)
        setProcessingStep("Generating invoice...");
        const invoice = await pollForInvoice(customerId);

        if (invoice) {
          // Step 3: Process payment
          setProcessingStep("Processing payment...");
          const paymentMethod =
            tab === "upi" ? "UPI" : tab === "card" ? "CREDIT_CARD" : "BANK_TRANSFER";
          await api.post("/api/payments/process", {
            invoiceId: invoice.id,
            customerId,
            amount: invoice.totalAmount,
            paymentMethod,
          });

          // Step 4: Mark invoice as paid
          setProcessingStep("Finalizing...");
          await api.put(`/api/invoices/${invoice.id}/pay`);
        }

        setFlowState("success");
      } else {
        // Invoice payment mode
        setProcessingStep("Processing payment...");
        const paymentMethod =
          tab === "upi" ? "UPI" : tab === "card" ? "CREDIT_CARD" : "BANK_TRANSFER";
        await api.post("/api/payments/process", {
          invoiceId,
          customerId,
          amount,
          paymentMethod,
        });

        setProcessingStep("Finalizing...");
        await api.put(`/api/invoices/${invoiceId}/pay`);

        setFlowState("success");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Payment failed";
      setErrorMsg(msg);
      setFlowState("error");
    }
  };

  const handleSuccessDone = () => {
    onSuccess();
    onClose();
  };

  if (!open) return null;

  const paymentMethods: { id: PaymentTab; label: string; icon: React.ElementType }[] = [
    { id: "upi", label: "UPI", icon: Smartphone },
    { id: "card", label: "Card", icon: CreditCard },
    { id: "netbanking", label: "Net Banking", icon: Building2 },
  ];

  const banks = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB"];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={flowState === "form" ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl border border-white/10">
              {/* Header — Razorpay blue gradient */}
              <div className="bg-gradient-to-r from-[#072654] to-[#0b3d91] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">NetServe</h3>
                      <p className="text-blue-200/70 text-xs">Secure Payment</p>
                    </div>
                  </div>
                  {flowState === "form" && (
                    <button
                      onClick={onClose}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Amount */}
                <div className="mt-4 pb-1">
                  <p className="text-blue-200/60 text-xs mb-1">
                    {mode === "subscribe"
                      ? `${plan.name} Plan — ${plan.billingCycle?.toLowerCase() || "monthly"}`
                      : "Invoice Payment"}
                  </p>
                  <p className="text-white text-3xl font-bold">
                    ${amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="bg-[#0d0d0d]">
                <AnimatePresence mode="wait">
                  {flowState === "form" && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6"
                    >
                      {/* Payment method tabs */}
                      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-5">
                        {paymentMethods.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setTab(m.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              tab === m.id
                                ? "bg-[#072654] text-blue-300 shadow-lg shadow-blue-500/10"
                                : "text-white/50 hover:text-white/80"
                            }`}
                          >
                            <m.icon className="w-4 h-4" />
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {/* UPI Form */}
                      {tab === "upi" && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs text-white/40 mb-2 font-medium">
                              UPI ID
                            </label>
                            <input
                              type="text"
                              placeholder="yourname@upi"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                            />
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                            <div className="flex gap-2">
                              {["GPay", "PhonePe", "Paytm"].map((app) => (
                                <div
                                  key={app}
                                  className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-white/50 hover:bg-white/10 hover:text-white/80 cursor-pointer transition-all"
                                >
                                  {app}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Card Form */}
                      {tab === "card" && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-xs text-white/40 mb-2 font-medium">
                              Card Number
                            </label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                                setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/40 mb-2 font-medium">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              placeholder="John Doe"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-white/40 mb-2 font-medium">
                                Expiry
                              </label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => {
                                  let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                                  setCardExpiry(v);
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-white/40 mb-2 font-medium">
                                CVV
                              </label>
                              <input
                                type="password"
                                placeholder="•••"
                                value={cardCvv}
                                onChange={(e) =>
                                  setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Net Banking */}
                      {tab === "netbanking" && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-3"
                        >
                          <label className="block text-xs text-white/40 mb-2 font-medium">
                            Select Bank
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {banks.map((bank) => (
                              <button
                                key={bank}
                                onClick={() => setSelectedBank(bank)}
                                className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                                  selectedBank === bank
                                    ? "bg-[#072654] text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                                    : "bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                                }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Pay Button */}
                      <button
                        onClick={handlePayment}
                        className="w-full mt-6 bg-gradient-to-r from-[#1a73e8] to-[#0b57d0] text-white font-semibold py-3.5 rounded-xl hover:from-[#1a73e8] hover:to-[#1565c0] transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                      >
                        Pay ${amount.toFixed(2)}
                      </button>

                      {/* Security footer */}
                      <div className="flex items-center justify-center gap-2 mt-4 text-white/20 text-xs">
                        <Shield className="w-3 h-3" />
                        <span>Secured by Razorpay</span>
                      </div>
                    </motion.div>
                  )}

                  {flowState === "processing" && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-10 flex flex-col items-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-12 h-12 text-blue-400" />
                        </motion.div>
                      </div>
                      <p className="text-white/70 text-sm mt-5 font-medium">
                        {processingStep}
                      </p>
                      <p className="text-white/30 text-xs mt-2">
                        Please do not close this window
                      </p>
                    </motion.div>
                  )}

                  {flowState === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-10 flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: 0.1,
                        }}
                        className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
                      >
                        <Check className="w-8 h-8 text-emerald-400" />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-white text-lg font-semibold mt-4"
                      >
                        Payment Successful!
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/40 text-sm mt-1"
                      >
                        ${amount.toFixed(2)} paid for {plan.name} Plan
                      </motion.p>
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        onClick={handleSuccessDone}
                        className="mt-6 px-8 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/30 transition-all text-sm"
                      >
                        Done
                      </motion.button>
                    </motion.div>
                  )}

                  {flowState === "error" && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-10 flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"
                      >
                        <X className="w-8 h-8 text-red-400" />
                      </motion.div>
                      <p className="text-white text-lg font-semibold mt-4">
                        Payment Failed
                      </p>
                      <p className="text-white/40 text-sm mt-1 text-center max-w-xs">
                        {errorMsg}
                      </p>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setFlowState("form")}
                          className="px-6 py-2.5 bg-white/5 text-white/70 rounded-xl font-medium hover:bg-white/10 transition-all text-sm"
                        >
                          Try Again
                        </button>
                        <button
                          onClick={onClose}
                          className="px-6 py-2.5 bg-red-500/10 text-red-400 rounded-xl font-medium hover:bg-red-500/20 transition-all text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
