"use client";

import React, { useState } from "react";
import {
  Order,
  OrderItem,
  FAULT_TAGS,
  MEASUREMENT_LABELS,
} from "@/types/tailor";
import {
  AlertTriangle,
  X,
  Wrench,
  RotateCcw,
  Wallet,
  Ruler,
  CheckCircle2,
  Calendar,
  UserCheck,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface ComplaintModalProps {
  order: Order;
  actorName: string;
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}

export default function ComplaintModal({
  order,
  actorName,
  onClose,
  onSuccess,
}: ComplaintModalProps) {
  const [complaintType, setComplaintType] = useState<
    | "TAILOR_FAULT_ALTERATION"
    | "CUSTOMER_PAID_ALTERATION"
    | "TAILOR_DAMAGE_COMPENSATION"
    | "SUIT_RETURN_REFUND"
  >("TAILOR_FAULT_ALTERATION");

  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Fitting Tight / Loose",
  ]);
  const [issueDescription, setIssueDescription] = useState("");
  const [stitchingInstructions, setStitchingInstructions] = useState("");

  // Fully customizable financial direction
  const [financialDirection, setFinancialDirection] = useState<
    "NO_CHARGE" | "CHARGE_CUSTOMER" | "PAY_CUSTOMER"
  >("NO_CHARGE");

  const [extraChargeToCustomer, setExtraChargeToCustomer] = useState<number>(0);
  const [immediatePaymentReceived, setImmediatePaymentReceived] =
    useState<number>(0);
  const [payoutOrRefundToCustomer, setPayoutOrRefundToCustomer] =
    useState<number>(0);
  const [billReductionAmount, setBillReductionAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");

  // Target order status & schedule
  const [newOrderStatus, setNewOrderStatus] = useState<
    "Alteration" | "Returned" | "Delivered"
  >("Alteration");
  const [newDeliveryDate, setNewDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [masterTailor, setMasterTailor] = useState<string>(
    order.master_tailor || "Master Cutter"
  );
  const [orderNotes, setOrderNotes] = useState<string>(order.notes || "");

  // Editable Order Items (Naap & Stitching Notes)
  const [editableItems, setEditableItems] = useState<OrderItem[]>(() =>
    (order.items || []).map((item) => ({
      ...item,
      measurement_snapshot: { ...(item.measurement_snapshot || {}) },
    }))
  );
  const [showNaapEditor, setShowNaapEditor] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleScenarioSelect = (
    type:
      | "TAILOR_FAULT_ALTERATION"
      | "CUSTOMER_PAID_ALTERATION"
      | "TAILOR_DAMAGE_COMPENSATION"
      | "SUIT_RETURN_REFUND"
  ) => {
    setComplaintType(type);
    if (type === "TAILOR_FAULT_ALTERATION") {
      setFinancialDirection("NO_CHARGE");
      setNewOrderStatus("Alteration");
      setExtraChargeToCustomer(0);
      setImmediatePaymentReceived(0);
      setPayoutOrRefundToCustomer(0);
      setBillReductionAmount(0);
    } else if (type === "CUSTOMER_PAID_ALTERATION") {
      setFinancialDirection("CHARGE_CUSTOMER");
      setNewOrderStatus("Alteration");
      setExtraChargeToCustomer(500);
      setImmediatePaymentReceived(0);
      setPayoutOrRefundToCustomer(0);
      setBillReductionAmount(0);
    } else if (type === "TAILOR_DAMAGE_COMPENSATION") {
      setFinancialDirection("PAY_CUSTOMER");
      setNewOrderStatus("Alteration");
      setPayoutOrRefundToCustomer(1000);
      setBillReductionAmount(0);
      setExtraChargeToCustomer(0);
      setImmediatePaymentReceived(0);
    } else if (type === "SUIT_RETURN_REFUND") {
      setFinancialDirection("PAY_CUSTOMER");
      setNewOrderStatus("Returned");
      setPayoutOrRefundToCustomer(Number(order.total_paid || 0));
      setBillReductionAmount(Number(order.total_amount || 0));
      setExtraChargeToCustomer(0);
      setImmediatePaymentReceived(0);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleItemMeasurementChange = (
    itemIdx: number,
    fieldKey: string,
    val: string
  ) => {
    setEditableItems((prev) => {
      const next = [...prev];
      next[itemIdx] = {
        ...next[itemIdx],
        measurement_snapshot: {
          ...next[itemIdx].measurement_snapshot,
          [fieldKey]: val,
        },
      };
      return next;
    });
  };

  const handleItemNoteChange = (itemIdx: number, notes: string) => {
    setEditableItems((prev) => {
      const next = [...prev];
      next[itemIdx] = {
        ...next[itemIdx],
        stitching_notes: notes,
      };
      return next;
    });
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!issueDescription.trim() && selectedTags.length === 0) {
      setErrorMsg(
        "Baraye meharbani fault ya customer complaint ki wajah select ya type karein."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_or_update_complaint",
          order_id: order.id,
          complaint_type: complaintType,
          fault_category:
            selectedTags.join(", ") || "General Silai / Alteration Issue",
          issue_description:
            issueDescription.trim() ||
            `Fault / Return logged: ${selectedTags.join(", ")}`,
          stitching_instructions: stitchingInstructions.trim(),
          financial_direction: financialDirection,
          extra_charge_to_customer:
            financialDirection === "CHARGE_CUSTOMER"
              ? Number(extraChargeToCustomer || 0)
              : 0,
          immediate_payment_received:
            financialDirection === "CHARGE_CUSTOMER"
              ? Number(immediatePaymentReceived || 0)
              : 0,
          payout_or_refund_to_customer:
            financialDirection === "PAY_CUSTOMER"
              ? Number(payoutOrRefundToCustomer || 0)
              : 0,
          bill_reduction_amount:
            financialDirection === "PAY_CUSTOMER"
              ? Number(billReductionAmount || 0)
              : 0,
          payment_method: paymentMethod,
          new_order_status: newOrderStatus,
          new_delivery_date: newDeliveryDate || null,
          master_tailor: masterTailor,
          updated_items: editableItems,
          updated_order_notes: orderNotes,
          performed_by: actorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save complaint");
      }

      await onSuccess(
        `Order #${order.order_number} par Complaint / Return (${data.complaint.complaint_number}) save ho gaya! Status: ${newOrderStatus}`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveComplaint = async (complaintId?: number) => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_complaint",
          complaint_id: complaintId,
          order_id: order.id,
          resolution_notes:
            "Dobara silai / alteration mukammal kar ke suit customer ko re-deliver kar diya gaya.",
          performed_by: actorName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve complaint");
      }
      await onSuccess(
        `Order #${order.order_number} ki Alteration complete ho gayi aur Order dobara Delivered mark ho gaya!`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error resolving complaint"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const existingComplaints = order.complaints || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">
                  Return / Fault / Complaint & Completed Order Edit
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {order.order_number}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Customer: <strong className="text-white">{order.customer_name}</strong> ({order.customer_phone}) • Current Status:{" "}
                <strong className="text-amber-300">{order.status}</strong> • Bill: Rs.{" "}
                {Number(order.total_amount).toLocaleString()} (Paid: Rs.{" "}
                {Number(order.total_paid).toLocaleString()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* If Order is currently in Alteration or has existing complaints, show quick resolution bar */}
          {(order.status === "Alteration" || existingComplaints.length > 0) && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Previous Complaints / Alteration History ({existingComplaints.length})
                  </span>
                </div>
                {order.status === "Alteration" && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      handleResolveComplaint(existingComplaints[0]?.id)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Alteration Complete — Mark Re-Delivered
                  </button>
                )}
              </div>

              {existingComplaints.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {existingComplaints.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-lg p-2.5 border border-amber-200/80 text-xs flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono font-bold text-rose-700">
                          {c.complaint_number}
                        </span>{" "}
                        • <span className="font-semibold text-slate-800">{c.fault_category}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {c.issue_description}
                          {c.stitching_instructions
                            ? ` — Karigar Note: ${c.stitching_instructions}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {c.status}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                          {c.financial_direction === "CHARGE_CUSTOMER" &&
                            `+Rs. ${Number(c.extra_charge_to_customer).toLocaleString()} Charged`}
                          {c.financial_direction === "PAY_CUSTOMER" &&
                            `-Rs. ${Number(c.payout_or_refund_to_customer).toLocaleString()} Paid to Customer`}
                          {c.financial_direction === "NO_CHARGE" &&
                            "Free Alteration (Rs. 0)"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form id="complaint-form" onSubmit={handleSubmitComplaint} className="space-y-6">
            {/* STEP 1: Choose Scenario Preset */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                1. Masla / Scenario Select Karein (Fully Customizable)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleScenarioSelect("TAILOR_FAULT_ALTERATION")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    complaintType === "TAILOR_FAULT_ALTERATION"
                      ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Free Fix
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900">
                    Darzi Fault (Dobara Silai)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Karigar se fitting/naap mein ghalti hui, free dobara silai
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleScenarioSelect("CUSTOMER_PAID_ALTERATION")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    complaintType === "CUSTOMER_PAID_ALTERATION"
                      ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Customer Pays
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900">
                    Paid Alteration / Refit
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Customer apni marzi se fitting/design change karwa raha hai
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleScenarioSelect("TAILOR_DAMAGE_COMPENSATION")
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    complaintType === "TAILOR_DAMAGE_COMPENSATION"
                      ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      We Pay Customer
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900">
                    Major Fault / Harjana
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Suit kharab hone par customer ko paise pay ya bill kam karein
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleScenarioSelect("SUIT_RETURN_REFUND")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    complaintType === "SUIT_RETURN_REFUND"
                      ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      Full Return
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900">
                    Suit Return & Refund
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Customer ne suit wapis kar diya aur paise/bill refund
                  </p>
                </button>
              </div>
            </div>

            {/* STEP 2: Fault Tags & Complaint Description */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  2. Kya Masla / Fault Aaya Hai? (Select Tags)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FAULT_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? "bg-slate-900 text-amber-400 shadow-sm"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Complaint / Fault Details *
                  </label>
                  <textarea
                    rows={2}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Maslan: Kameez chati se tight hai aur bazu 1 inch chote hain..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Master / Karigar ke liye Dobara Silai Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={stitchingInstructions}
                    onChange={(e) => setStitchingInstructions(e.target.value)}
                    placeholder="Maslan: Side silai khol kar 1.5 inch loose karein aur dobara press karein..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Financial Customization (Len-Den Option) */}
            <div className="bg-white p-4 rounded-xl border-2 border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  3. Paison ka Len-Den (Financial Option Choose Karein)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFinancialDirection("NO_CHARGE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      financialDirection === "NO_CHARGE"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Free (Rs. 0 — Koi Len Den Nahi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialDirection("CHARGE_CUSTOMER")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      financialDirection === "CHARGE_CUSTOMER"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Customer se Paise Lene Hain
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialDirection("PAY_CUSTOMER")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      financialDirection === "PAY_CUSTOMER"
                        ? "bg-rose-600 text-white"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Customer ko Hum Pay / Refund Karenge
                  </button>
                </div>
              </div>

              {financialDirection === "NO_CHARGE" && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <strong>Free Re-Stitching / Alteration:</strong> Customer ke bill ya Udhaar khata mein koi farq nahi parega (Rs. 0).
                </div>
              )}

              {financialDirection === "CHARGE_CUSTOMER" && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">
                      Extra Silai / Alteration Charges (Rs.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={extraChargeToCustomer}
                      onChange={(e) =>
                        setExtraChargeToCustomer(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-blue-700 mt-1">
                      Order ke total bill mein जमा (add) hoga
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">
                      Abhi Nagad Wasool Kiye (Rs.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={immediatePaymentReceived}
                      onChange={(e) =>
                        setImmediatePaymentReceived(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm font-bold text-emerald-700"
                    />
                    <p className="text-[11px] text-blue-700 mt-1">
                      Baqaya Udhaar mein add hoga: Rs.{" "}
                      {Math.max(
                        0,
                        Number(extraChargeToCustomer || 0) -
                          Number(immediatePaymentReceived || 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm font-semibold"
                    >
                      <option value="Cash">Cash (Nagad)</option>
                      <option value="EasyPaisa / JazzCash">
                        EasyPaisa / JazzCash
                      </option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              )}

              {financialDirection === "PAY_CUSTOMER" && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">
                      Cash Paid to Customer (Harjana / Refund Rs.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={payoutOrRefundToCustomer}
                      onChange={(e) =>
                        setPayoutOrRefundToCustomer(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white text-sm font-bold text-rose-700"
                    />
                    <p className="text-[11px] text-rose-700 mt-1">
                      Jo nagad raqam hum ne customer ko apni jeb se wapis di
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">
                      Order Bill / Udhaar se Kami (Discount / Reversal Rs.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={billReductionAmount}
                      onChange={(e) =>
                        setBillReductionAmount(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white text-sm font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-rose-700 mt-1">
                      Agar customer ka bill ya Udhaar kam karna ho
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">
                      Payout Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white text-sm font-semibold"
                    >
                      <option value="Cash">Cash (Nagad Wapsi)</option>
                      <option value="EasyPaisa / JazzCash">
                        EasyPaisa / JazzCash
                      </option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: Edit Completed Order Naap / Items & New Delivery Schedule */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-amber-600" />
                    4. Completed Order Edit (Naap, Silai Notes, Status & Delivery Date)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Agar naap mein tabdeeli hai to yahan se suit ka naap aur silai notes edit karein
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNaapEditor(!showNaapEditor)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5 text-amber-600" />
                  {showNaapEditor
                    ? "Hide Suit Naap Editor"
                    : `Edit Suit Naap & Notes (${editableItems.length} Item)`}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Order Status Update
                  </label>
                  <select
                    value={newOrderStatus}
                    onChange={(e) =>
                      setNewOrderStatus(
                        e.target.value as "Alteration" | "Returned" | "Delivered"
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  >
                    <option value="Alteration">
                      Alteration (Dobara Silai / Repair in Workshop)
                    </option>
                    <option value="Returned">
                      Returned (Customer ne Suit Wapis Kar Diya)
                    </option>
                    <option value="Delivered">
                      Keep Delivered (Sirf Compensation / Record Entry)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Nayi Re-Delivery Date
                  </label>
                  <input
                    type="date"
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Assigned Master / Karigar
                  </label>
                  <input
                    type="text"
                    value={masterTailor}
                    onChange={(e) => setMasterTailor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                  />
                </div>
              </div>

              {showNaapEditor && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {editableItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          Suit #{idx + 1}: {item.quantity}x {item.garment_name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Fabric: {item.fabric_details || "Standard"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {Object.entries(item.measurement_snapshot || {}).map(
                          ([key, val]) => (
                            <div key={key}>
                              <label className="block text-[10px] font-semibold text-slate-500 truncate">
                                {MEASUREMENT_LABELS[key] || key}
                              </label>
                              <input
                                type="text"
                                value={val || ""}
                                onChange={(e) =>
                                  handleItemMeasurementChange(
                                    idx,
                                    key,
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-bold text-slate-900"
                              />
                            </div>
                          )
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Item Silai / Alteration Note
                        </label>
                        <input
                          type="text"
                          value={item.stitching_notes || ""}
                          onChange={(e) =>
                            handleItemNoteChange(idx, e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                          placeholder="Update stitching note for this suit..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Order General Notes (Parchi Note)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            Action Status:{" "}
            <strong className="text-slate-900">{newOrderStatus}</strong> •{" "}
            {financialDirection === "NO_CHARGE" && "Rs. 0 (Free Service)"}
            {financialDirection === "CHARGE_CUSTOMER" &&
              `Customer Charge: +Rs. ${Number(
                extraChargeToCustomer || 0
              ).toLocaleString()}`}
            {financialDirection === "PAY_CUSTOMER" &&
              `Customer Payout: Rs. ${Number(
                payoutOrRefundToCustomer || 0
              ).toLocaleString()} | Bill Waiver: Rs. ${Number(
                billReductionAmount || 0
              ).toLocaleString()}`}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="complaint-form"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Wrench className="w-4 h-4" />
              {submitting
                ? "Saving..."
                : "Save Complaint / Alteration & Update Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
