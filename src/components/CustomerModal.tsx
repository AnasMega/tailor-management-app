"use client";

import React, { useState, useEffect } from "react";
import {
  Customer,
  Shop,
  EASTERN_FIELDS,
  WESTERN_FIELDS,
  FORMAL_FIELDS,
  KAMEEZ_ONLY_FIELDS,
  SHALWAR_ONLY_FIELDS,
  PAJAMA_ONLY_FIELDS,
  SHIRT_ONLY_FIELDS,
  PANT_ONLY_FIELDS,
  SHAWL_FIELDS,
  REPAIR_FIELDS,
  MEASUREMENT_LABELS,
  STYLE_OPTIONS,
} from "@/types/tailor";
import { X, UserCheck, Ruler, Save, AlertCircle, Plus, Trash2, Tag } from "lucide-react";
import { GarmentIllustration, GarmentVisualKey } from "@/components/GarmentIllustration";

interface CustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  shops: Shop[];
  selectedShopId?: string;
  currentUserName?: string;
  onClose: () => void;
  onSaved: () => void;
}

export type ExtendedNaapCategory =
  | "Shalwar Kameez"
  | "Sirf Kameez"
  | "Sirf Shalwar"
  | "Sirf Pajama"
  | "Pant Shirt"
  | "Sirf Pant"
  | "Sirf Shirt"
  | "Two / Three Piece Suit"
  | "Waistcoat"
  | "Shawl / Chaddar"
  | "Silai / Repair"
  | "Custom Silai";

interface CustomField {
  id: string;
  name: string;
  value: string;
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

  const [naapCategory, setNaapCategory] =
    useState<ExtendedNaapCategory>("Shalwar Kameez");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState("");

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

  const naapCategoryOptions: Array<{
    key: ExtendedNaapCategory;
    label: string;
    subLabel: string;
    visualKey: GarmentVisualKey;
  }> = [
    {
      key: "Shalwar Kameez",
      label: "Shalwar Kameez",
      subLabel: "Mukammal Suit (Traditional)",
      visualKey: "shalwar_kameez",
    },
    {
      key: "Sirf Kameez",
      label: "Sirf Kameez / Kurta",
      subLabel: "Upper Kameez / Kurta",
      visualKey: "kameez",
    },
    {
      key: "Sirf Shalwar",
      label: "Sirf Shalwar",
      subLabel: "Paincha & Ghera Shalwar",
      visualKey: "shalwar",
    },
    {
      key: "Sirf Pajama",
      label: "Sirf Pajama / Trouser",
      subLabel: "Elastic Trouser / Pajama",
      visualKey: "pajama",
    },
    {
      key: "Pant Shirt",
      label: "Pant Shirt",
      subLabel: "Complete Western Pair",
      visualKey: "pant_shirt",
    },
    {
      key: "Sirf Shirt",
      label: "Sirf Shirt",
      subLabel: "Dress / Casual Shirt",
      visualKey: "shirt",
    },
    {
      key: "Sirf Pant",
      label: "Sirf Pant / Trouser",
      subLabel: "Dress Trouser",
      visualKey: "pant",
    },
    {
      key: "Two / Three Piece Suit",
      label: "Coat / Two-Three Piece",
      subLabel: "Formal Coat & Suit",
      visualKey: "suit",
    },
    {
      key: "Waistcoat",
      label: "Waistcoat (Waskat)",
      subLabel: "Bespoke Waskat",
      visualKey: "waistcoat",
    },
    {
      key: "Shawl / Chaddar",
      label: "Shawl / Chaddar",
      subLabel: "Piping & Kinari Border",
      visualKey: "shawl",
    },
    {
      key: "Silai / Repair",
      label: "Choti Moti Silai / Rafu",
      subLabel: "Tanka, Alteration & Repair",
      visualKey: "repair",
    },
    {
      key: "Custom Silai",
      label: "Custom Silai Item",
      subLabel: "Any Extra Custom Fitting",
      visualKey: "custom",
    },
  ];

  const getStandardFieldsForCategory = (cat: ExtendedNaapCategory): string[] => {
    switch (cat) {
      case "Shalwar Kameez":
        return EASTERN_FIELDS;
      case "Sirf Kameez":
        return KAMEEZ_ONLY_FIELDS;
      case "Sirf Shalwar":
        return SHALWAR_ONLY_FIELDS;
      case "Sirf Pajama":
        return PAJAMA_ONLY_FIELDS;
      case "Pant Shirt":
        return WESTERN_FIELDS;
      case "Sirf Shirt":
        return SHIRT_ONLY_FIELDS;
      case "Sirf Pant":
        return PANT_ONLY_FIELDS;
      case "Two / Three Piece Suit":
        return [
          "coat_length",
          "tera",
          "bazu",
          "chest",
          "waist",
          "hip",
          "collar",
          "pant_length",
          "pant_waist",
          "thigh",
          "bottom",
        ];
      case "Waistcoat":
        return FORMAL_FIELDS;
      case "Shawl / Chaddar":
        return SHAWL_FIELDS;
      case "Silai / Repair":
        return REPAIR_FIELDS;
      case "Custom Silai":
      default:
        return [];
    }
  };

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

  const activeStandardFields = getStandardFieldsForCategory(naapCategory);
  const selectedOption = naapCategoryOptions.find((o) => o.key === naapCategory);

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const cleanName = newFieldName.trim();
    if (customFields.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      setError(`Field "${cleanName}" already exists.`);
      return;
    }
    const newId = `custom_${Date.now()}`;
    setCustomFields((prev) => [...prev, { id: newId, name: cleanName, value: "" }]);
    setNewFieldName("");
  };

  const handleRemoveCustomField = (id: string, name: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    setMeasurements((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Merge standard measurements and custom field measurements
      const finalMeasurements = { ...measurements };
      for (const cf of customFields) {
        if (cf.name && cf.value) {
          finalMeasurements[cf.name] = cf.value;
        }
      }

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
          measurements: finalMeasurements,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
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
                Customer Profile, Opening Udhaar / Khata & Multi-Garment Permanent Naap Record
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

          {/* Section 1: Basic Customer Info */}
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
                value={
                  displayShops.find((s) => String(s.id) === String(shopId))?.name ||
                  displayShops[0]?.name ||
                  "Main Company"
                }
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
                Customer Notes / Special Silai Instructions
              </label>
              <input
                type="text"
                placeholder="e.g., Prefers loose fitting, soft collar buckram, mobile pocket"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Section 2: Permanent Naap Book with Real Tailor Garment Visuals & Type Selector */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Ruler className="w-4 h-4 text-amber-700" />
                  Customer Naap Book (Select Garment Type to Record Naap)
                </h4>
                <p className="text-xs text-slate-600">
                  Kis cheez ka naap liya ja raha hai? Har type ki asli tasweer aur specific measurements neeche show hongi.
                </p>
              </div>

              {selectedOption && (
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm">
                  <GarmentIllustration typeKey={selectedOption.visualKey} size="sm" />
                  <div>
                    <span className="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">
                      Selected Garment
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {selectedOption.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Garment Type Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {naapCategoryOptions.map((opt) => {
                const isSelected = naapCategory === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setNaapCategory(opt.key)}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border-2 transition-all relative ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-600 shadow-sm ring-2 ring-amber-500/30 text-slate-900"
                        : "bg-white border-slate-200 hover:border-amber-300 text-slate-700 hover:bg-amber-50/40"
                    }`}
                  >
                    <GarmentIllustration typeKey={opt.visualKey} size="md" className="mb-1.5" />
                    <span className="text-xs font-bold leading-tight line-clamp-1">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight line-clamp-1 mt-0.5">
                      {opt.subLabel}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Standard Measurement Inputs for the Selected Category */}
            {activeStandardFields.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                  Standard {selectedOption?.label} Measurements (Inches)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {activeStandardFields.map((key) => (
                    <div
                      key={key}
                      className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm"
                    >
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {MEASUREMENT_LABELS[key] || key}
                      </label>
                      <input
                        type="text"
                        placeholder="Inches"
                        value={measurements[key] || ""}
                        onChange={(e) =>
                          setMeasurements({ ...measurements, [key]: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Measurement Fields Section (Add Any Extra Naap Field) */}
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    Custom Extra Naap Fields (Kisi Bhi Cheez Ka Extra Naap)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Agar kisi specific hissay ya custom cheez ka alag se naap add karna hai to yahan field ka naam likhein aur add karein.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Field Name (e.g. Belt, Chhoti Jeb, Goth, Border)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomField();
                      }
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold w-64"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />+ Add Field
                  </button>
                </div>
              </div>

              {customFields.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {customFields.map((cf) => (
                    <div
                      key={cf.id}
                      className="p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl flex items-center gap-2"
                    >
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-amber-950 mb-1 truncate">
                          {cf.name} (Custom Naap)
                        </label>
                        <input
                          type="text"
                          placeholder="Value / Inches / Note"
                          value={cf.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((f) => (f.id === cf.id ? { ...f, value: val } : f))
                            );
                            setMeasurements((prev) => ({ ...prev, [cf.name]: val }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(cf.id, cf.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove custom field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Koi custom field add nahi ki gayi. Upar se field ka naam likh kar &quot;+ Add Field&quot; dabayein.
                </p>
              )}
            </div>

            {/* Design & Stitching Preferences (Visible for Eastern / Western / Formal garments) */}
            {(naapCategory === "Shalwar Kameez" ||
              naapCategory === "Sirf Kameez" ||
              naapCategory === "Sirf Shalwar" ||
              naapCategory === "Sirf Pajama" ||
              naapCategory === "Pant Shirt" ||
              naapCategory === "Sirf Shirt" ||
              naapCategory === "Sirf Pant" ||
              naapCategory === "Two / Three Piece Suit" ||
              naapCategory === "Waistcoat") && (
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
            )}
          </div>

          {/* Action Buttons */}
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
