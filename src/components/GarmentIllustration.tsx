import React from "react";

export type GarmentVisualKey =
  | "shalwar_kameez"
  | "kameez"
  | "shalwar"
  | "pajama"
  | "pant_shirt"
  | "pant"
  | "shirt"
  | "suit"
  | "waistcoat"
  | "shawl"
  | "repair"
  | "custom";

export function getGarmentVisualKey(name: string, category?: string): GarmentVisualKey {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("shawl") || n.includes("chaddar")) return "shawl";
  if (n.includes("repair") || n.includes("rafu") || n.includes("tanka") || n.includes("choti moti") || c.includes("repair")) return "repair";
  if (n.includes("three piece") || n.includes("two piece") || n.includes("safari") || (n.includes("suit") && !n.includes("shalwar"))) return "suit";
  if (n.includes("waistcoat") || n.includes("waskat")) return "waistcoat";
  if (n.includes("pant shirt") || (n.includes("pant") && n.includes("shirt"))) return "pant_shirt";
  if (n.includes("sirf shirt") || n.includes("dress shirt") || n.includes("only shirt") || n === "shirt") return "shirt";
  if (n.includes("sirf pant") || n.includes("dress trouser") || n.includes("only pant") || n === "pant" || n.includes("trouser")) return "pant";
  if (n.includes("pajama")) return "pajama";
  if (n.includes("sirf shalwar") || n.includes("only shalwar") || n === "shalwar") return "shalwar";
  if (n.includes("sirf kameez") || n.includes("only kameez") || n.includes("kurta")) return "kameez";
  if (n.includes("shalwar kameez") || c === "eastern") return "shalwar_kameez";
  if (c === "western") return "pant_shirt";
  if (c === "formal") return "suit";
  return "custom";
}

interface GarmentIllustrationProps {
  typeKey?: GarmentVisualKey;
  name?: string;
  category?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function GarmentIllustration({
  typeKey,
  name,
  category,
  className = "",
  size = "md",
}: GarmentIllustrationProps) {
  const key = typeKey || (name ? getGarmentVisualKey(name, category) : "custom");

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }[size];

  switch (key) {
    case "shalwar_kameez":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#F0FDF4" />
          {/* Shalwar bottom */}
          <path
            d="M32 64 L25 90 L45 88 L50 72 L55 88 L75 90 L68 64 Z"
            fill="#86EFAC"
            stroke="#15803D"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Kameez */}
          <path
            d="M30 22 L16 38 L24 43 L32 34 L32 66 L68 66 L68 34 L76 43 L84 38 L70 22 L58 20 C56 25 44 25 42 20 Z"
            fill="#22C55E"
            stroke="#166534"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Ban Collar & Patti */}
          <path d="M44 21 C44 25 56 25 56 21" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="24" x2="50" y2="44" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="30" r="1.5" fill="#15803D" />
          <circle cx="50" cy="37" r="1.5" fill="#15803D" />
          {/* Pocket */}
          <rect x="36" y="38" width="6" height="8" rx="1.5" stroke="#166534" strokeWidth="1.5" fill="#86EFAC" />
          {/* Daman Cut curve */}
          <path d="M32 66 Q50 70 68 66" stroke="#166534" strokeWidth="2" fill="none" />
        </svg>
      );

    case "kameez":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#ECFDF5" />
          {/* Kameez / Kurta Body */}
          <path
            d="M30 20 L14 36 L22 42 L31 33 L30 82 L70 82 L69 33 L78 42 L86 36 L70 20 L58 18 C56 23 44 23 42 18 Z"
            fill="#10B981"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Collar & Buttons */}
          <path d="M43 19 C43 24 57 24 57 19" stroke="#FEF3C7" strokeWidth="2.5" />
          <line x1="50" y1="22" x2="50" y2="48" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="28" r="1.5" fill="#065F46" />
          <circle cx="50" cy="36" r="1.5" fill="#065F46" />
          <circle cx="50" cy="44" r="1.5" fill="#065F46" />
          {/* Chest Pocket */}
          <rect x="36" y="38" width="8" height="10" rx="1.5" stroke="#047857" strokeWidth="1.5" fill="#A7F3D0" />
          {/* Daman slits (chaak) */}
          <line x1="30" y1="62" x2="30" y2="82" stroke="#047857" strokeWidth="3" />
          <line x1="70" y1="62" x2="70" y2="82" stroke="#047857" strokeWidth="3" />
        </svg>
      );

    case "shalwar":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#F0FDF4" />
          {/* Wide pleated Shalwar with Paincha */}
          <path
            d="M24 20 L76 20 L86 44 L72 86 L57 86 L50 48 L43 86 L28 86 L14 44 Z"
            fill="#86EFAC"
            stroke="#15803D"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Nefa / Waistband */}
          <rect x="23" y="18" width="54" height="6" rx="2" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
          {/* Pleats / Chunnat lines */}
          <path d="M35 24 Q36 40 32 60" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M65 24 Q64 40 68 60" stroke="#166534" strokeWidth="1.5" strokeDasharray="2 2" />
          {/* Paincha borders */}
          <rect x="27" y="81" width="17" height="6" rx="1" fill="#15803D" />
          <rect x="56" y="81" width="17" height="6" rx="1" fill="#15803D" />
        </svg>
      );

    case "pajama":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#FDF2F8" />
          {/* Straight Cut Pajama / Trouser */}
          <path
            d="M32 18 L68 18 L72 45 L67 88 L54 88 L50 44 L46 88 L33 88 L28 45 Z"
            fill="#FBCFE8"
            stroke="#BE185D"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Elastic Waist */}
          <rect x="31" y="16" width="38" height="6" rx="2" fill="#DB2777" stroke="#BE185D" strokeWidth="1.5" />
          <path d="M50 22 L50 44" stroke="#BE185D" strokeWidth="2" strokeDasharray="2 2" />
          {/* Paincha Hem */}
          <line x1="33" y1="84" x2="46" y2="84" stroke="#9D174D" strokeWidth="2" />
          <line x1="54" y1="84" x2="67" y2="84" stroke="#9D174D" strokeWidth="2" />
        </svg>
      );

    case "pant_shirt":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#EFF6FF" />
          {/* Pant Lower */}
          <path
            d="M34 50 L66 50 L69 90 L56 90 L50 64 L44 90 L31 90 Z"
            fill="#1E3A8A"
            stroke="#172554"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Belt */}
          <rect x="33" y="48" width="34" height="4" rx="1" fill="#475569" stroke="#0F172A" strokeWidth="1" />
          <rect x="47" y="47.5" width="6" height="5" rx="1" fill="#F59E0B" />
          {/* Shirt Upper */}
          <path
            d="M31 16 L17 28 L23 33 L30 25 L32 50 L68 50 L70 25 L77 33 L83 28 L69 16 L57 14 C55 18 45 18 43 14 Z"
            fill="#60A5FA"
            stroke="#1D4ED8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Shirt Collar */}
          <path d="M43 14 L50 23 L39 21 Z" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1.5" />
          <path d="M57 14 L50 23 L61 21 Z" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1.5" />
          {/* Placket & Buttons */}
          <line x1="50" y1="23" x2="50" y2="50" stroke="#1D4ED8" strokeWidth="2" />
          <circle cx="50" cy="29" r="1.2" fill="#FFFFFF" />
          <circle cx="50" cy="37" r="1.2" fill="#FFFFFF" />
          <circle cx="50" cy="45" r="1.2" fill="#FFFFFF" />
        </svg>
      );

    case "pant":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#F1F5F9" />
          {/* Dress Trouser / Pant */}
          <path
            d="M30 18 L70 18 L74 46 L68 88 L54 88 L50 48 L46 88 L32 88 L26 46 Z"
            fill="#334155"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Belt Loops & Belt */}
          <rect x="29" y="16" width="42" height="6" rx="1.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          <rect x="47" y="15" width="6" height="8" rx="1" fill="#F59E0B" />
          {/* Pockets */}
          <path d="M32 24 L40 34" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <path d="M68 24 L60 34" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          {/* Front Crease (Press Istari Line) */}
          <line x1="39" y1="36" x2="40" y2="86" stroke="#64748B" strokeWidth="1.5" />
          <line x1="61" y1="36" x2="60" y2="86" stroke="#64748B" strokeWidth="1.5" />
        </svg>
      );

    case "shirt":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#E0F2FE" />
          {/* Dress Shirt */}
          <path
            d="M30 18 L12 33 L19 39 L28 29 L28 80 Q50 84 72 80 L72 29 L81 39 L88 33 L70 18 L58 15 C56 20 44 20 42 15 Z"
            fill="#38BDF8"
            stroke="#0369A1"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Collar Tips */}
          <path d="M42 15 L50 26 L36 23 Z" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.5" />
          <path d="M58 15 L50 26 L64 23 Z" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.5" />
          {/* Front Placket & Buttons */}
          <rect x="47.5" y="24" width="5" height="56" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.2" />
          <circle cx="50" cy="32" r="1.5" fill="#0284C7" />
          <circle cx="50" cy="42" r="1.5" fill="#0284C7" />
          <circle cx="50" cy="52" r="1.5" fill="#0284C7" />
          <circle cx="50" cy="62" r="1.5" fill="#0284C7" />
          <circle cx="50" cy="72" r="1.5" fill="#0284C7" />
          {/* Chest Pocket */}
          <path d="M33 36 L43 36 L43 48 L38 51 L33 48 Z" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.5" />
        </svg>
      );

    case "suit":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#F8FAFC" />
          {/* Coat Body */}
          <path
            d="M30 18 L14 36 L21 42 L28 32 L28 80 L72 80 L72 32 L79 42 L86 36 L70 18 Z"
            fill="#1E293B"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner Shirt White V */}
          <path d="M43 18 L50 40 L57 18 Z" fill="#FFFFFF" />
          {/* Red/Maroon Tie */}
          <path d="M48 24 L52 24 L53 44 L50 49 L47 44 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="0.8" />
          {/* Lapels */}
          <path d="M30 18 L44 42 L36 43 L28 32 Z" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
          <path d="M70 18 L56 42 L64 43 L72 32 Z" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
          {/* Breast Pocket + Pocket Square */}
          <line x1="33" y1="40" x2="40" y2="39" stroke="#94A3B8" strokeWidth="2" />
          <path d="M35 39 L37 34 L39 39 Z" fill="#DC2626" />
          {/* Coat Buttons */}
          <circle cx="50" cy="50" r="2" fill="#F59E0B" />
          <circle cx="50" cy="58" r="2" fill="#F59E0B" />
          {/* Flap Pockets */}
          <rect x="31" y="60" width="13" height="4" rx="1" fill="#334155" stroke="#0F172A" strokeWidth="1" />
          <rect x="56" y="60" width="13" height="4" rx="1" fill="#334155" stroke="#0F172A" strokeWidth="1" />
        </svg>
      );

    case "waistcoat":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#FFFBEB" />
          {/* Waistcoat / Waskat */}
          <path
            d="M32 18 L28 36 L30 76 L44 82 L50 78 L56 82 L70 76 L72 36 L68 18 L56 16 C55 22 45 22 44 16 Z"
            fill="#D97706"
            stroke="#92400E"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Ban Collar */}
          <path d="M43 17 C43 22 57 22 57 17" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" />
          {/* Front Opening & Gold Buttons */}
          <line x1="50" y1="20" x2="50" y2="78" stroke="#92400E" strokeWidth="2" />
          <circle cx="50" cy="28" r="2" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
          <circle cx="50" cy="38" r="2" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
          <circle cx="50" cy="48" r="2" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
          <circle cx="50" cy="58" r="2" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
          <circle cx="50" cy="68" r="2" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
          {/* Waistcoat Pockets */}
          <line x1="33" y1="36" x2="41" y2="36" stroke="#78350F" strokeWidth="2" />
          <line x1="32" y1="58" x2="42" y2="58" stroke="#78350F" strokeWidth="2" />
          <line x1="58" y1="58" x2="68" y2="58" stroke="#78350F" strokeWidth="2" />
        </svg>
      );

    case "shawl":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#FDF4FF" />
          {/* Folded Designer Shawl / Chaddar */}
          <path
            d="M20 25 L75 20 L85 70 L30 75 Z"
            fill="#A855F7"
            stroke="#6B21A8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 35 L71 30 L81 80 L26 85 Z"
            fill="#C084FC"
            stroke="#6B21A8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Golden Embroidered Border / Patti */}
          <path d="M22 34 L77 29" stroke="#FDE047" strokeWidth="3" />
          <path d="M28 83 L83 78" stroke="#FDE047" strokeWidth="3" />
          {/* Fringe / Tassels (Guchhe) */}
          <line x1="26" y1="85" x2="24" y2="92" stroke="#6B21A8" strokeWidth="2" />
          <line x1="34" y1="84" x2="32" y2="91" stroke="#6B21A8" strokeWidth="2" />
          <line x1="42" y1="83" x2="40" y2="90" stroke="#6B21A8" strokeWidth="2" />
          <line x1="50" y1="82" x2="48" y2="89" stroke="#6B21A8" strokeWidth="2" />
          <line x1="58" y1="81" x2="56" y2="88" stroke="#6B21A8" strokeWidth="2" />
          <line x1="66" y1="80" x2="64" y2="87" stroke="#6B21A8" strokeWidth="2" />
          <line x1="74" y1="79" x2="72" y2="86" stroke="#6B21A8" strokeWidth="2" />
          <line x1="82" y1="78" x2="80" y2="85" stroke="#6B21A8" strokeWidth="2" />
        </svg>
      );

    case "repair":
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#FFF1F2" />
          {/* Cloth patch */}
          <path
            d="M25 30 Q30 20 40 25 L75 35 Q80 45 75 60 L65 75 Q50 82 40 75 L22 55 Q18 40 25 30 Z"
            fill="#FECDD3"
            stroke="#E11D48"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          {/* Needle (Sui) */}
          <path d="M78 20 L40 60" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="75" cy="23" r="1.5" fill="#FFFFFF" />
          {/* Thread (Dhaga) winding through */}
          <path
            d="M75 23 Q88 15 82 32 Q76 45 52 50 Q36 53 40 60"
            stroke="#E11D48"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Crossed Stitch (Rafu tanka) */}
          <path d="M35 40 L45 50 M45 40 L35 50" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M50 48 L60 58 M60 48 L50 58" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "custom":
    default:
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses} ${className} shrink-0 drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="18" fill="#F8FAFC" />
          {/* Measuring Tape & Scissors / Custom */}
          <circle cx="50" cy="50" r="32" stroke="#64748B" strokeWidth="2.5" strokeDasharray="3 3" fill="#F1F5F9" />
          {/* Scissors */}
          <path d="M38 35 L62 65" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <path d="M62 35 L38 65" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="34" cy="33" r="5" stroke="#0F172A" strokeWidth="2.5" />
          <circle cx="66" cy="33" r="5" stroke="#0F172A" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="3" fill="#F59E0B" />
          {/* Star badge */}
          <circle cx="50" cy="74" r="8" fill="#10B981" />
          <path d="M50 70 L51.5 73 L55 73.5 L52.5 76 L53 79.5 L50 77.5 L47 79.5 L47.5 76 L45 73.5 L48.5 73 Z" fill="#FFFFFF" />
        </svg>
      );
  }
}
