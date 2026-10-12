"use client";

import React, { useState, useEffect } from "react";
import {
  Customer,
  GarmentType,
  Shop,
  Order,
  EASTERN_FIELDS,
  WESTERN_FIELDS,
  FORMAL_FIELDS,
  MEASUREMENT_LABELS,
  STYLE_OPTIONS,
} from "@/types/tailor";
import {
  X,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Ruler,
  Scissors,
  Calendar,
  Printer,
  Zap,
  AlertCircle,
} from "lucide-react";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  garments: GarmentType[];
  shops: Shop[];
  selectedShopId: string;
  preselectedCustomerId?: number | null;
  currentUserName?: string;
  onOrderCreated: (createdOrder: Order) => void;
}

export default function NewOrderModal({
  isOpen,
  onClose,
  customers,
  garments,
  shops,
  selectedShopId,
  preselectedCustomerId,
  currentUserName,
  onOrderCreated,
}: NewOrderModalProps) {
  const activeShops = shops.filter((s) => s.is_active);
  const displayShops = activeShops.length > 0 ? activeShops : shops;

  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    "existing"
  );
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // New Customer Fields
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    notes: "",
  });

  // Naap & Style State
  const [naapCategory, setNaapCategory] = useState<
    "Eastern" | "Western" | "Formal"
  >("Eastern");
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    kameez_length: "40",
    tera: "18",
    bazu: "24",
    chest: "40",
    waist: "38",
    ghera: "23",
    collar: "16",
    shalwar_length: "39",
    paincha: "16.5",
  });
  const [stylePrefs, setStylePrefs] = useState<Record<string, string>>({
    collar_type: STYLE_OPTIONS.collar_type[0],
    cuff_type: STYLE_OPTIONS.cuff_type[0],
    daman_type: STYLE_OPTIONS.daman_type[0],
    pocket_style: STYLE_OPTIONS.pocket_style[0],
    silai_type: STYLE_OPTIONS.silai_type[0],
    shalwar_style: STYLE_OPTIONS.shalwar_style[0],
    special_instructions: "",
  });
  const [saveNaapToProfile, setSaveNaapToProfile] = useState<boolean>(true);

  // Order Items
  const [items, setItems] = useState<
    Array<{
      garment_type_id: number | null;
      garment_name: string;
      quantity: number;
      unit_price: number;
      fabric_details: string;
      stitching_notes: string;
    }>
  >([]);

  // Order Metadata & Financials
  const [shopId, setShopId] = useState<string>(
    selectedShopId !== "all"
      ? selectedShopId
      : String(displayShops[0]?.id || 1)
  );
  const [bookingDate, setBookingDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [trialDate, setTrialDate] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [urgentCharges, setUrgentCharges] = useState<string>("0");
  const [discount, setDiscount] = useState<string>("0");
  const [advancePaid, setAdvancePaid] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [masterTailor, setMasterTailor] = useState<string>("Ustad Rasheed");
  const [orderNotes, setOrderNotes] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setShopId(
        selectedShopId !== "all"
          ? selectedShopId
          : String(displayShops[0]?.id || 1)
      );
      if (!bookingDate) {
        const now = new Date();
        setBookingDate(now.toISOString().split("T")[0]);
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        setDeliveryDate(d.toISOString().split("T")[0]);
      }
    }
  }, [isOpen, selectedShopId, displayShops.length, bookingDate]);

  // Initialize default first item from garments list
  useEffect(() => {
    if (isOpen && garments.length > 0 && items.length === 0) {
      const firstG = garments[0];
      setItems([
        {
          garment_type_id: firstG.id,
          garment_name: firstG.name,
          quantity: 1,
          unit_price: Number(firstG.base_price),
          fabric_details: "",
          stitching_notes: "",
        },
      ]);
    }
  }, [isOpen, garments, items.length]);

  // Handle preselected customer
  useEffect(() => {
    if (isOpen && preselectedCustomerId) {
      setCustomerMode("existing");
      setCustomerId(String(preselectedCustomerId));
    } else if (isOpen && !customerId && customers.length > 0) {
      setCustomerId(String(customers[0].id));
    }
  }, [isOpen, preselectedCustomerId, customers, customerId]);

  // Load selected customer's saved measurements when customer or category changes
  useEffect(() => {
    if (customerMode === "existing" && customerId) {
      const found = customers.find((c) => String(c.id) === String(customerId));
      if (found && found.measurements_list && found.measurements_list.length > 0) {
        const catMatch =
          found.measurements_list.find((m) => m.category === naapCategory) ||
          found.measurements_list[0];
        if (catMatch) {
          setMeasurements(catMatch.measurements || {});
          setStylePrefs((prev) => ({
            ...prev,
            ...(catMatch.style_preferences || {}),
          }));
        }
      }
    }
  }, [customerId, customerMode, naapCategory, customers]);

  if (!isOpen) return null;

  const setDeliveryInDays = (days: number) => {
    const d = new Date(bookingDate || new Date());
    d.setDate(d.getDate() + days);
    setDeliveryDate(d.toISOString().split("T")[0]);
  };

  const handleAddItem = () => {
    const defaultG = garments[0];
    setItems((prev) => [
      ...prev,
      {
        garment_type_id: defaultG ? defaultG.id : null,
        garment_name: defaultG ? defaultG.name : "Custom Suit",
        quantity: 1,
        unit_price: defaultG ? Number(defaultG.base_price) : 1800,
        fabric_details: "",
        stitching_notes: "",
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGarmentSelect = (idx: number, garmentIdStr: string) => {
    const foundG = garments.find((g) => String(g.id) === garmentIdStr);
    if (!foundG) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              garment_type_id: foundG.id,
              garment_name: foundG.name,
              unit_price: Number(foundG.base_price),
            }
          : item
      )
    );

    if (
      foundG.category === "Eastern" ||
      foundG.category === "Western" ||
      foundG.category === "Formal"
    ) {
      setNaapCategory(foundG.category);
    }
  };

  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.quantity || 1) * Number(item.unit_price || 0),
    0
  );
  const urgVal = Number(urgentCharges || 0);
  const discVal = Number(discount || 0);
  const totalAmount = Math.max(0, subtotal + urgVal - discVal);
  const advVal = Number(advancePaid || 0);
  const balanceDue = totalAmount - advVal;

  const activeFields =
    naapCategory === "Western"
      ? WESTERN_FIELDS
      : naapCategory === "Formal"
      ? FORMAL_FIELDS
      : EASTERN_FIELDS;

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.customer_code.toLowerCase().includes(q)
    );
  });

  const selectedCustomerObj = customers.find(
    (c) => String(c.id) === String(customerId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        customer_id: customerMode === "existing" ? Number(customerId) : null,
        new_customer: customerMode === "new" ? newCustomer : null,
        shop_id: Number(shopId),
        booking_date: bookingDate,
        trial_date: trialDate || null,
        delivery_date: deliveryDate,
        is_urgent: isUrgent,
        urgent_charges: urgVal,
        discount: discVal,
        advance_paid: advVal,
        payment_method: paymentMethod,
        master_tailor: masterTailor,
        performed_by: currentUserName || "Master Anas (Owner / Admin)",
        notes: orderNotes,
        items,
        save_measurements_to_profile: saveNaapToProfile,
        measurement_category: naapCategory,
        customer_measurements: measurements,
        customer_style_preferences: stylePrefs,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book order");
      }

      onOrderCreated(data.order);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error booking order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">
                New Order Booking & Naap Entry (Naya Order / Parchi)
              </h2>
              <p className="text-xs text-slate-400">
                Select Customer → Check/Enter Naap → Add Suits → Print Parchi Receipt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1"
        >
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 1: Customer & Shop Branch Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-600" />
                1. Customer Selection
              </h3>

              <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    customerMode === "existing"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Existing Customer ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("new")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    customerMode === "new"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />+ Walk-in New Customer
                </button>
              </div>
            </div>

            {customerMode === "existing" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Filter Customer (Name / Phone / Code)
                  </label>
                  <input
                    type="text"
                    placeholder="Type name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Select Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-900"
                  >
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.phone}) — [{c.customer_code}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Active Shop Branch
                  </label>
                  {displayShops.length > 1 ? (
                    <select
                      value={shopId}
                      onChange={(e) => setShopId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                    >
                      {displayShops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.branch_code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={displayShops[0]?.name || "Main Shop"}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600 font-semibold"
                    />
                  )}
                </div>

                {selectedCustomerObj && (
                  <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Selected:</span>{" "}
                      <strong className="text-slate-900">
                        {selectedCustomerObj.full_name}
                      </strong>{" "}
                      • Phone: <strong>{selectedCustomerObj.phone}</strong> •
                      Saved Naap Profiles:{" "}
                      <strong>
                        {selectedCustomerObj.measurements_list?.length || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1">
                        Previous Khata Balance:
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          Number(selectedCustomerObj.current_balance) > 0
                            ? "bg-red-100 text-red-700"
                            : Number(selectedCustomerObj.current_balance) < 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {Number(selectedCustomerObj.current_balance) > 0
                          ? `Udhaar Rs. ${Number(
                              selectedCustomerObj.current_balance
                            ).toLocaleString()}`
                          : Number(selectedCustomerObj.current_balance) < 0
                          ? `Advance Credit Rs. ${Math.abs(
                              Number(selectedCustomerObj.current_balance)
                            ).toLocaleString()}`
                          : "Rs. 0 (Clear)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Muhammad Ali"
                    value={newCustomer.full_name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0300-1234567"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Address / Area
                  </label>
                  <input
                    type="text"
                    placeholder="Model Town / DHA"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Shop / Branch
                  </label>
                  {displayShops.length > 1 ? (
                    <select
                      value={shopId}
                      onChange={(e) => setShopId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                    >
                      {displayShops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.branch_code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={displayShops[0]?.name || "Main Shop"}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600 font-semibold"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Stitching Items & Rate Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Scissors className="w-4 h-4 text-emerald-600" />
                2. Suits & Stitching Items (Auto-Loaded From Current Rate Card)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />+ Add Another Garment / Suit
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl items-end"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Garment Type (From Rate Card)
                    </label>
                    <select
                      value={item.garment_type_id || ""}
                      onChange={(e) => handleGarmentSelect(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-900"
                    >
                      {garments.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} — Rs. {Number(g.base_price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  quantity: Math.max(1, Number(e.target.value)),
                                }
                              : it
                          )
                        )
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={item.unit_price}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, unit_price: Number(e.target.value) }
                              : it
                          )
                        )
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white text-emerald-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Fabric / Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. White Boski"
                      value={item.fabric_details}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, fabric_details: e.target.value }
                              : it
                          )
                        )
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Design / Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ban collar"
                      value={item.stitching_notes}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, stitching_notes: e.target.value }
                              : it
                          )
                        )
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-end gap-1">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: Customer Naap (Measurements) & Fitting Style */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  3. Customer Naap (Measurements in Inches) & Design
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["Eastern", "Western", "Formal"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNaapCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      naapCategory === cat
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {cat === "Eastern"
                      ? "Shalwar Kameez / Kurta Naap"
                      : cat === "Western"
                      ? "Pant Shirt Naap"
                      : "Waistcoat / Coat Naap"}
                  </button>
                ))}
              </div>
            </div>

            {/* Measurement Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {activeFields.map((fieldKey) => (
                <div
                  key={fieldKey}
                  className="bg-white p-2.5 rounded-xl border border-amber-200"
                >
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {MEASUREMENT_LABELS[fieldKey] || fieldKey}
                  </label>
                  <input
                    type="text"
                    placeholder="Inches"
                    value={measurements[fieldKey] || ""}
                    onChange={(e) =>
                      setMeasurements({
                        ...measurements,
                        [fieldKey]: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Style Preferences Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-amber-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Collar / Gala Style
                </label>
                <select
                  value={stylePrefs.collar_type || ""}
                  onChange={(e) =>
                    setStylePrefs({ ...stylePrefs, collar_type: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.collar_type.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cuff / Bazu Style
                </label>
                <select
                  value={stylePrefs.cuff_type || ""}
                  onChange={(e) =>
                    setStylePrefs({ ...stylePrefs, cuff_type: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.cuff_type.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Daman Cut
                </label>
                <select
                  value={stylePrefs.daman_type || ""}
                  onChange={(e) =>
                    setStylePrefs({ ...stylePrefs, daman_type: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.daman_type.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Pocket Style
                </label>
                <select
                  value={stylePrefs.pocket_style || ""}
                  onChange={(e) =>
                    setStylePrefs({ ...stylePrefs, pocket_style: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.pocket_style.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Silai / Thread
                </label>
                <select
                  value={stylePrefs.silai_type || ""}
                  onChange={(e) =>
                    setStylePrefs({ ...stylePrefs, silai_type: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.silai_type.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Shalwar / Trouser Fit
                </label>
                <select
                  value={stylePrefs.shalwar_style || ""}
                  onChange={(e) =>
                    setStylePrefs({
                      ...stylePrefs,
                      shalwar_style: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.shalwar_style.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveNaapToProfile}
                  onChange={(e) => setSaveNaapToProfile(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                Save/Update this Naap permanently in Customer&apos;s Naap Book
              </label>
            </div>
          </div>

          {/* STEP 4: Delivery Date & Payment / Bayana Calculation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Dates & Master Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-emerald-600" />
                4. Delivery Schedule & Workshop Assignment
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-700 mb-1">
                    Delivery Date (Suit Wapsi) *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl text-sm bg-white font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">
                  Quick Delivery Days:
                </span>
                {[2, 4, 7, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDeliveryInDays(d)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 rounded-lg text-xs font-bold text-slate-700"
                  >
                    After {d} Days
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Master / Karigar Assigned
                  </label>
                  <input
                    type="text"
                    value={masterTailor}
                    onChange={(e) => setMasterTailor(e.target.value)}
                    placeholder="e.g. Ustad Rasheed"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => {
                        setIsUrgent(e.target.checked);
                        if (e.target.checked && Number(urgentCharges) === 0) {
                          setUrgentCharges("500");
                        } else if (!e.target.checked) {
                          setUrgentCharges("0");
                        }
                      }}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-xs font-bold text-red-800 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Urgent Express Suit
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Special Order Notes (Printed on Parchi)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Jumma se pehle suit har haal mein chahiye"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                />
              </div>
            </div>

            {/* Bill & Advance Payment Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-emerald-400 text-sm uppercase tracking-wider mb-3">
                  5. Bill, Advance (Bayana) & Baqaya Calculation
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">
                      Urgent Surcharge (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={urgentCharges}
                      onChange={(e) => setUrgentCharges(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">
                      Discount / Chhoot (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-300 font-bold mb-1">
                      Advance Received Now (Bayana Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950 border-2 border-emerald-500 text-emerald-300 font-extrabold text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold"
                    >
                      <option value="Cash">Cash (Naqad)</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>
                    Stitching Subtotal (
                    {items.reduce((a, b) => a + b.quantity, 0)} items):
                  </span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-700 pt-2">
                  <span>Total Order Bill:</span>
                  <span>Rs. {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-400">
                  <span>Advance Paid (Bayana):</span>
                  <span>- Rs. {advVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-amber-300 border-t border-slate-700 pt-2">
                  <span>Baqaya on Delivery:</span>
                  <span>Rs. {balanceDue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg transition"
            >
              <Printer className="w-4 h-4" />
              {loading
                ? "Booking Order..."
                : "Save Order & Open Printable Parchi (Invoice)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
