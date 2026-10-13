"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/types/tailor";
import { CheckCircle2, X, Banknote, Truck, AlertCircle } from "lucide-react";

interface DeliverOrderModalProps {
  order: Order | null;
  currentUserName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeliverOrderModal({
  order,
  currentUserName,
  onClose,
  onSuccess,
}: DeliverOrderModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [extraDiscount, setExtraDiscount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [markDelivered, setMarkDelivered] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (order) {
      setAmountPaid(String(order.balance_due || 0));
      setExtraDiscount("0");
      setMarkDelivered(true);
      setDescription("");
    }
  }, [order]);

  if (!order) return null;

  const currentBalanceDue = Number(order.balance_due || 0);
  const enteredPaid = Number(amountPaid || 0);
  const enteredDisc = Number(extraDiscount || 0);
  const remainingUdhaarAfter = Math.max(
    0,
    currentBalanceDue - enteredPaid - enteredDisc
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deliver_or_collect",
          order_id: order.id,
          amount_paid: enteredPaid,
          extra_discount: enteredDisc,
          payment_method: paymentMethod,
          mark_delivered: markDelivered,
          description,
          performed_by: currentUserName || "Master Anas (Owner / Admin)",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order delivery");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-auto">
        <div className="bg-emerald-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Deliver Suit & Payment
              </h3>
              <p className="text-xs text-emerald-200">
                Parchi #{order.order_number} • {order.customer_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Bill Breakdown Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-xs text-slate-500 block">Total Bill</span>
              <span className="font-bold text-slate-900 text-base">
                Rs. {Number(order.total_amount).toLocaleString()}
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-xs text-slate-500 block">Already Paid</span>
              <span className="font-bold text-emerald-700 text-base">
                Rs. {Number(order.total_paid).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">
                Baqaya (Pending)
              </span>
              <span className="font-black text-red-600 text-base">
                Rs. {currentBalanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Payment Received Now (Rs.) *
              </label>
              <div className="relative">
                <Banknote className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Extra Discount / Chhoot (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={extraDiscount}
                onChange={(e) => setExtraDiscount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
              >
                <option value="Cash">Cash (Naqad)</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer / Raast</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={markDelivered}
                  onChange={(e) => setMarkDelivered(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-emerald-900">
                  Mark Order as Delivered
                </span>
              </label>
            </div>
          </div>

          {remainingUdhaarAfter > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              Note: Customer ke khate mein{" "}
              <strong>Rs. {remainingUdhaarAfter.toLocaleString()}</strong> baqaya
              (Udhaar) reh jayega.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Remarks / Payment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Paid on suit delivery"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading
                ? "Updating..."
                : markDelivered
                ? "Confirm Delivery & Save Payment"
                : "Save Payment Only"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
