import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Mail, Lock, Check, X } from "lucide-react";
import { Book, PaymentMerchantConfig } from "../types";

interface PaymentPanelProps {
  book: { id: string; title: string; price: number };
  format: "pdf" | "epub";
  merchantConfig?: PaymentMerchantConfig;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentPanel({ book, format, merchantConfig, onClose, onSuccess }: PaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (paymentMethod === "paypal" && email) {
      fetch("/api/record-paypal-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          bookTitle: book.title,
          format: format
        })
      }).catch(err => console.error("Failed to record PayPal email:", err));
    }

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-lg border border-stone-800/80 p-8 shadow-2xl overflow-hidden"
        style={{
          background: "radial-gradient(circle at 30% 25%, #0d1a29 0%, #060c14 65%, #020406 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95)",
        }}
      >
        {/* Blurred photographic grain texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] filter blur-[0.5px]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-[#16273c]/20 via-transparent to-transparent opacity-60" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Info Layout */}
        <div className="flex flex-col items-center text-center select-none">
          {/* Chosen Title */}
          <div className="text-stone-100 font-serif italic text-2xl tracking-wide mb-1">
            {book.title}
          </div>

          {/* Chosen File Format */}
          <div className="text-xs font-serif italic tracking-wider text-stone-400 mb-2 uppercase">
            {format}
          </div>

          {/* Price */}
          <div className="text-xl font-serif italic text-[#c29f72] font-medium mb-6">
            ${book.price}
          </div>

          {/* Toggle Switch for Stripe / PayPal */}
          <div className="w-full bg-stone-950/80 border border-stone-850/60 rounded-sm p-1 flex items-center mb-6 relative">
            <button
              type="button"
              onClick={() => setPaymentMethod("stripe")}
              className={`flex-1 py-1.5 text-xs font-serif italic tracking-wider rounded-sm transition-all duration-300 cursor-pointer ${
                paymentMethod === "stripe"
                  ? "bg-[#c29f72] text-stone-950 border border-[#b39164]/30 shadow-sm font-semibold"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Stripe
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("paypal")}
              className={`flex-1 py-1.5 text-xs font-serif italic tracking-wider rounded-sm transition-all duration-300 cursor-pointer ${
                paymentMethod === "paypal"
                  ? "bg-[#c29f72] text-stone-950 border border-[#b39164]/30 shadow-sm font-semibold"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              PayPal
            </button>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePay} className="w-full flex flex-col gap-4 text-left">
            <AnimatePresence mode="wait">
              {paymentMethod === "stripe" ? (
                <motion.div
                  key="stripe-fields"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {/* Card Number */}
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={14} />
                    <input
                      type="text"
                      required
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-stone-950/85 border border-stone-850 focus:border-stone-700 text-stone-200 text-xs py-2 px-9 rounded-sm focus:outline-none placeholder-stone-600 font-serif italic tracking-wider transition-colors"
                    />
                  </div>

                  {/* Expiry and CVC Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-stone-950/85 border border-stone-850 focus:border-stone-700 text-stone-200 text-xs py-2 px-3 rounded-sm focus:outline-none placeholder-stone-600 text-center font-serif italic tracking-wider transition-colors"
                    />
                    <input
                      type="text"
                      required
                      placeholder="CVC"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full bg-stone-950/85 border border-stone-850 focus:border-stone-700 text-stone-200 text-xs py-2 px-3 rounded-sm focus:outline-none placeholder-stone-600 text-center font-serif italic tracking-wider transition-colors"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="paypal-fields"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {/* PayPal Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={14} />
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-950/85 border border-stone-850 focus:border-stone-700 text-stone-200 text-xs py-2 px-9 rounded-sm focus:outline-none placeholder-stone-600 font-serif italic tracking-wider transition-colors"
                    />
                  </div>

                  {/* PayPal Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={14} />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-950/85 border border-stone-850 focus:border-stone-700 text-stone-200 text-xs py-2 px-9 rounded-sm focus:outline-none placeholder-stone-600 font-serif italic tracking-wider transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pay Button / Status */}
            <button
              type="submit"
              disabled={isProcessing || isSuccess}
              className="mt-4 w-full py-2 bg-[#c29f72] hover:bg-[#d4b488] disabled:bg-[#524838] text-stone-950 text-sm font-serif italic tracking-wider rounded-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 font-medium"
            >
              {isSuccess ? (
                <Check size={14} className="stroke-[3]" />
              ) : isProcessing ? (
                <span className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                "read it now"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
