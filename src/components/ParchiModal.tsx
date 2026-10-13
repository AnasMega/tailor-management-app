"use client";

import React, { useState } from "react";
import { Order, MEASUREMENT_LABELS } from "@/types/tailor";
import { Printer, X, Scissors, Calendar, Phone, MapPin, CheckCircle2, FileText, Receipt } from "lucide-react";

interface ParchiModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function ParchiModal({ order, onClose }: ParchiModalProps) {
  const [printMode, setPrintMode] = useState<"invoice" | "thermal" | "karigar">("invoice");

  if (!order) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysDifference = (bookingStr: string, deliveryStr: string) => {
    const d1 = new Date(bookingStr || new Date());
    const d2 = new Date(deliveryStr);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const totalDays = getDaysDifference(order.booking_date, order.delivery_date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-2 sm:my-8 max-h-[96vh] flex flex-col">
        {/* Top Action Toolbar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base sm:text-lg">
              Parchi ({order.order_number})
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setPrintMode("invoice")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                printMode === "invoice"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Invoice
            </button>
            <button
              type="button"
              onClick={() => setPrintMode("thermal")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                printMode === "thermal"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Thermal
            </button>
            <button
              type="button"
              onClick={() => setPrintMode("karigar")}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                printMode === "karigar"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Karigar Slip
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Close Parchi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Parchi Content */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto bg-slate-100 flex justify-center flex-1">
          <div
            id="printable-parchi-area"
            className={`bg-white border border-slate-300 shadow-sm rounded-xl text-slate-900 ${
              printMode === "thermal"
                ? "w-[340px] p-5 font-mono text-xs"
                : "w-full max-w-2xl p-8"
            }`}
          >
            {/* Shop Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              <div className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-2">
                <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                {printMode === "karigar"
                  ? "KARIGAR / WORKSHOP NAAP PARCHI"
                  : "CUSTOMER ORDER PARCHI & INVOICE"}
              </div>
              <h1
                className={`font-extrabold tracking-tight text-slate-900 ${
                  printMode === "thermal" ? "text-lg" : "text-2xl"
                }`}
              >
                {order.shop_name || "Royal Bespoke Tailors & Drapers"}
              </h1>
              {order.shop_address && (
                <p className="text-slate-600 text-xs mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 inline" /> {order.shop_address}
                </p>
              )}
              {order.shop_phone && (
                <p className="text-slate-700 text-xs font-semibold mt-0.5 flex items-center justify-center gap-1">
                  <Phone className="w-3.5 h-3.5 inline" /> Phone / WhatsApp: {order.shop_phone}
                </p>
              )}
            </div>

            {/* Parchi Token & Delivery Highlight Banner */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Parchi / Order No.
                </span>
                <span className="text-xl font-black text-slate-900">
                  {order.order_number}
                </span>
                <span className="block text-xs text-slate-600 mt-0.5">
                  Booking: <strong>{formatDate(order.booking_date)}</strong>
                </span>
              </div>
              <div className="text-right border-l border-slate-200 pl-3">
                <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block">
                  Delivery Date (Wapsi)
                </span>
                <span className="text-lg font-black text-emerald-700 flex items-center justify-end gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.delivery_date)}
                </span>
                <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-bold mt-0.5">
                  {order.status === "Delivered"
                    ? "✓ Delivered to Customer"
                    : `${totalDays} Din Baad Suit Tayyar Hoga`}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4 pb-3 border-b border-slate-200 flex flex-wrap justify-between items-start gap-2 text-sm">
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Customer Details
                </p>
                <p className="font-bold text-base text-slate-900">
                  {order.customer_name}{" "}
                  <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {order.customer_code}
                  </span>
                </p>
                <p className="text-xs text-slate-700 font-medium">
                  Phone: {order.customer_phone}
                </p>
                {order.customer_address && (
                  <p className="text-xs text-slate-500">{order.customer_address}</p>
                )}
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    order.status === "Delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.status === "Ready"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status: {order.status}
                </span>
                {order.is_urgent && (
                  <div className="mt-1">
                    <span className="bg-red-100 text-red-700 border border-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      ⚡ URGENT / EXPRESS SILAI
                    </span>
                  </div>
                )}
                {order.master_tailor && (
                  <p className="text-xs text-slate-500 mt-1">
                    Master: <strong>{order.master_tailor}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Itemized Stitching Table */}
            <div className="mb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-xs uppercase text-slate-600">
                    <th className="py-2">Suit / Silai Description</th>
                    <th className="py-2 text-center">Qty</th>
                    {printMode !== "karigar" && (
                      <>
                        <th className="py-2 text-right">Rate</th>
                        <th className="py-2 text-right">Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-2.5 pr-2">
                        <div className="font-bold text-slate-900">
                          {idx + 1}. {item.garment_name}
                        </div>
                        {item.fabric_details && (
                          <div className="text-xs text-slate-600">
                            Kapra / Color: <strong>{item.fabric_details}</strong>
                          </div>
                        )}
                        {item.stitching_notes && (
                          <div className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                            Note: {item.stitching_notes}
                          </div>
                        )}

                        {/* Show Full Naap Snapshot in Karigar Slip Mode (or compact summary in Invoice) */}
                        {item.measurement_snapshot &&
                          Object.keys(item.measurement_snapshot).length > 0 && (
                            <div
                              className={`mt-2 p-2 rounded-lg border ${
                                printMode === "karigar"
                                  ? "bg-amber-50/70 border-amber-300"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                                Customer Naap & Fitting Details:
                              </p>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs">
                                {Object.entries(item.measurement_snapshot).map(
                                  ([k, v]) =>
                                    v ? (
                                      <div
                                        key={k}
                                        className="bg-white px-1.5 py-0.5 rounded border border-slate-200"
                                      >
                                        <span className="text-[10px] text-slate-500 block leading-tight">
                                          {MEASUREMENT_LABELS[k] ||
                                            k.replace(/_/g, " ").toUpperCase()}
                                        </span>
                                        <span className="font-bold text-slate-900">
                                          {String(v)}
                                        </span>
                                      </div>
                                    ) : null
                                )}
                              </div>
                            </div>
                          )}
                      </td>
                      <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                      {printMode !== "karigar" && (
                        <>
                          <td className="py-2.5 text-right">
                            Rs. {Number(item.unit_price).toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right font-bold">
                            Rs. {Number(item.total_price).toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary (Shown on Customer Invoice & Thermal Parchi) */}
            {printMode !== "karigar" && (
              <div className="border-t-2 border-slate-800 pt-3 mt-4">
                <div className="flex flex-col items-end space-y-1 text-sm">
                  <div className="w-full sm:w-72 flex justify-between text-slate-600">
                    <span>Stitching Subtotal:</span>
                    <span className="font-semibold">
                      Rs. {Number(order.subtotal).toLocaleString()}
                    </span>
                  </div>
                  {Number(order.urgent_charges) > 0 && (
                    <div className="w-full sm:w-72 flex justify-between text-amber-700">
                      <span>Urgent Silai Charges:</span>
                      <span className="font-semibold">
                        + Rs. {Number(order.urgent_charges).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {Number(order.discount) > 0 && (
                    <div className="w-full sm:w-72 flex justify-between text-emerald-700">
                      <span>Special Discount (Chhoot):</span>
                      <span className="font-semibold">
                        - Rs. {Number(order.discount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="w-full sm:w-72 flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-1">
                    <span>Total Bill (Kul Raqam):</span>
                    <span>Rs. {Number(order.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="w-full sm:w-72 flex justify-between text-emerald-700 font-bold">
                    <span>Total Received (Wasool Shuda):</span>
                    <span>Rs. {Number(order.total_paid).toLocaleString()}</span>
                  </div>
                  <div className="w-full sm:w-72 flex justify-between text-lg font-black bg-slate-900 text-white px-3 py-2 rounded-lg mt-1">
                    <span>Baqaya (Balance Due):</span>
                    <span>Rs. {Number(order.balance_due).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <strong>Order Instructions / Remarks:</strong> {order.notes}
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700">
                {order.shop_receipt_footer ||
                  "Shukriya! Delivery ke waqt yeh Parchi (Receipt) zaroor saath layein."}
              </p>
              <p className="mt-1 text-[11px]">
                Parchi Token: <strong>{order.order_number}</strong> • Customer Code:{" "}
                <strong>{order.customer_code}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
