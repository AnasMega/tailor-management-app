"use client";

import React, { useState, useEffect } from "react";
import {
  Customer,
  Shop,
  EASTERN_FIELDS,
  WESTERN_FIELDS,
  FORMAL_FIELDS,
  MEASUREMENT_LABELS,
  STYLE_OPTIONS,
} from "@/types/tailor";
import { X, UserCheck, Ruler, Save, AlertCircle } from "lucide-react";

interface CustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  shops: Shop[];
  selectedShopId?: string;
  currentUserName?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerModal({
  isOpen,
  customer,
  shops,
  selectedShopId,
  currentUserName,
  onClose,
  onSaved,
}: CustomerModalProps) {
  const activeShops = shops.filter((s) => s.is_active);
  const displayShops = activeShops.length > 0 ? activeShops : shops;

  const getEffectiveShopId = () => {
    if (customer?.shop_id) return String(customer.shop_id);
    if (selectedShopId && selectedShopId !== "all") return selectedShopId;
    return String(displayShops[0]?.id || 1);
  };

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [shopId, setShopId] = useState(getEffectiveShopId());
  const [notes, setNotes] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  const [naapCategory, setNaapCategory] = useState<
    "Eastern" | "Western" | "Formal"
  >("Eastern");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [stylePrefs, setStylePrefs] = useState<Record<string, string>>({
    collar_type: STYLE_OPTIONS.collar_type[0],
    cuff_type: STYLE_OPTIONS.cuff_type[0],
    daman_type: STYLE_OPTIONS.daman_type[0],
    pocket_style: STYLE_OPTIONS.pocket_style[0],
    silai_type: STYLE_OPTIONS.silai_type[0],
    shalwar_style: STYLE_OPTIONS.shalwar_style[0],
    special_instructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setFullName(customer.full_name || "");
      setPhone(customer.phone || "");
      setWhatsapp(customer.whatsapp || customer.phone || "");
      setAddress(customer.address || "");
      setShopId(String(customer.shop_id || getEffectiveShopId()));
      setNotes(customer.notes || "");
      setOpeningBalance(String(customer.opening_balance || 0));

      const catMatch = customer.measurements_list?.find(
        (m) => m.category === naapCategory
      );
      if (catMatch) {
        setMeasurements(catMatch.measurements || {});
        setStylePrefs({
          collar_type: STYLE_OPTIONS.collar_type[0],
          cuff_type: STYLE_OPTIONS.cuff_type[0],
          daman_type: STYLE_OPTIONS.daman_type[0],
          pocket_style: STYLE_OPTIONS.pocket_style[0],
          silai_type: STYLE_OPTIONS.silai_type[0],
          shalwar_style: STYLE_OPTIONS.shalwar_style[0],
          ...(catMatch.style_preferences || {}),
        });
      } else {
        setMeasurements({});
      }
    } else {
      setFullName("");
      setPhone("");
      setWhatsapp("");
      setAddress("");
      setShopId(getEffectiveShopId());
      setNotes("");
      setOpeningBalance("0");
      setMeasurements({
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
    }
  }, [customer, naapCategory, shops, selectedShopId, isOpen]);

  if (!isOpen) return null;

  const activeFields =
    naapCategory === "Western"
      ? WESTERN_FIELDS
      : naapCategory === "Formal"
      ? FORMAL_FIELDS
      : EASTERN_FIELDS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer?.id,
          full_name: fullName,
          phone,
          whatsapp: whatsapp || phone,
          address,
          shop_id: Number(shopId),
          notes,
          opening_balance: Number(openingBalance || 0),
          measurement_category: naapCategory,
          measurements,
          style_preferences: stylePrefs,
          performed_by: currentUserName || "Master Anas (Owner / Admin)",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save customer");
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-lg">
                {customer
                  ? `Edit Customer & Naap Book (${customer.customer_code})`
                  : "Add New Customer & Naap Profile"}
              </h3>
              <p className="text-xs text-slate-400">
                Complete Customer Details, Udhaar Opening Balance & Permanent Naap Record
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Haji Muhammad Tariq"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Phone / Mobile No. *
              </label>
              <input
                type="text"
                required
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Company Account
              </label>
              <input
                type="text"
                disabled
                value={displayShops.find((s) => String(s.id) === String(shopId))?.name || displayShops[0]?.name || "Main Company"}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Opening Udhaar (+ve) / Credit (-ve) Rs.
              </label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Address / Area
              </label>
              <input
                type="text"
                placeholder="House #, Street, Area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Customer Notes / Preferences
              </label>
              <input
                type="text"
                placeholder="e.g., Likes loose fitting, soft collar buckram"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Naap Book Section */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase">
                <Ruler className="w-4 h-4 text-amber-700" />
                Customer Permanent Naap Book (Measurements in Inches)
              </h4>

              <div className="flex items-center gap-2">
                {(["Eastern", "Western", "Formal"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNaapCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      naapCategory === cat
                        ? "bg-amber-600 text-white shadow"
                        : "bg-white text-slate-700 border border-amber-200"
                    }`}
                  >
                    {cat === "Eastern"
                      ? "Shalwar Kameez / Kurta"
                      : cat === "Western"
                      ? "Pant / Shirt"
                      : "Waistcoat / Coat"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {activeFields.map((key) => (
                <div
                  key={key}
                  className="bg-white p-2.5 rounded-xl border border-amber-200"
                >
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {MEASUREMENT_LABELS[key] || key}
                  </label>
                  <input
                    type="text"
                    placeholder="Inches"
                    value={measurements[key] || ""}
                    onChange={(e) =>
                      setMeasurements({ ...measurements, [key]: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-amber-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Collar / Gala Style
                </label>
                <select
                  value={stylePrefs.collar_type || ""}
                  onChange={(e) =>
                    setStylePrefs({ ...stylePrefs, collar_type: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.collar_type.map((o) => (
                    <option key={o} value={o}>
                      {o}
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
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.cuff_type.map((o) => (
                    <option key={o} value={o}>
                      {o}
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
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.daman_type.map((o) => (
                    <option key={o} value={o}>
                      {o}
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
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.pocket_style.map((o) => (
                    <option key={o} value={o}>
                      {o}
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
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.silai_type.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Shalwar / Trouser Style
                </label>
                <select
                  value={stylePrefs.shalwar_style || ""}
                  onChange={(e) =>
                    setStylePrefs({
                      ...stylePrefs,
                      shalwar_style: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {STYLE_OPTIONS.shalwar_style.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Customer & Naap Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
