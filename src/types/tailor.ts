export interface Shop {
  id: number;
  name: string;
  branch_code: string;
  phone: string;
  whatsapp: string;
  address: string;
  receipt_footer: string;
  is_active: boolean;
  total_orders?: number;
  total_revenue?: number;
  total_customers?: number;
}

export interface PricingPlan {
  id: number;
  plan_name: string;
  price_monthly: number;
  storage_limit_mb: number;
  customizations_per_month: number;
  free_installation: boolean;
  continuity_guarantee: boolean;
  features: string[];
  is_popular?: boolean;
  badge_text?: string;
  is_active?: boolean;
  subscriber_count?: number;
}

export interface User {
  id: number;
  username: string;
  password?: string;
  full_name: string;
  role: string;
  shop_id: number | null;
  shop_name?: string;
  phone?: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  plan_id?: number | null;
  plan_name?: string;
  storage_limit_mb?: number;
  storage_used_mb?: number;
}

export interface GarmentType {
  id: number;
  name: string;
  category: "Eastern" | "Western" | "Formal" | "Kids" | string;
  base_price: number;
  urgent_surcharge: number;
  effective_month?: string;
  measurement_fields: string[];
  is_active: boolean;
  updated_at?: string;
}

export interface RateHistoryItem {
  id: number;
  garment_type_id: number;
  garment_name: string;
  category: string;
  old_price: number | null;
  new_price: number;
  old_urgent_surcharge: number | null;
  new_urgent_surcharge: number;
  effective_month: string;
  changed_by: string;
  notes: string;
  changed_at: string;
}

export interface AuditLogItem {
  id: number;
  entity_type: string;
  entity_ref: string;
  action_title: string;
  details: string;
  performed_by: string;
  created_at: string;
}

export interface MonthlySaleReport {
  month_key: string;
  month_label: string;
  total_orders: number;
  total_suits: number;
  total_sale: number;
  total_collected: number;
  pending_balance: number;
}

export interface UserSaleReport {
  user_name: string;
  orders_booked: number;
  total_sale_booked: number;
  order_payments_received: number;
  pending_from_orders: number;
}

export interface UserCashReport {
  user_name: string;
  total_cash_collected: number;
  payment_transactions: number;
}

export interface GarmentSaleReport {
  garment_name: string;
  total_qty: number;
  total_revenue: number;
  avg_rate: number;
}

export interface CustomerMeasurement {
  id?: number;
  customer_id?: number;
  category: string;
  label: string;
  measurements: Record<string, string>;
  style_preferences: Record<string, string>;
  updated_at?: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  shop_id: number;
  shop_name?: string;
  notes: string;
  opening_balance: number;
  current_balance: number;
  orders_count?: number;
  total_billed?: number;
  total_paid_orders?: number;
  measurements_list?: CustomerMeasurement[];
  created_at?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  garment_type_id: number | null;
  garment_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  fabric_details: string;
  measurement_snapshot: Record<string, string>;
  stitching_notes: string;
}

export interface OrderComplaint {
  id: number;
  complaint_number: string;
  order_id: number;
  customer_id: number;
  shop_id: number;
  complaint_type:
    | "TAILOR_FAULT_ALTERATION"
    | "CUSTOMER_PAID_ALTERATION"
    | "TAILOR_DAMAGE_COMPENSATION"
    | "SUIT_RETURN_REFUND";
  fault_category: string;
  issue_description: string;
  stitching_instructions: string;
  financial_direction: "NO_CHARGE" | "CHARGE_CUSTOMER" | "PAY_CUSTOMER";
  extra_charge_to_customer: number;
  immediate_payment_received: number;
  payout_or_refund_to_customer: number;
  bill_reduction_amount: number;
  payment_method: string;
  new_order_status: "Alteration" | "Returned" | "Delivered";
  new_delivery_date?: string | null;
  master_tailor?: string;
  status: "Open" | "In Progress" | "Resolved";
  created_by?: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_code: string;
  customer_address?: string;
  customer_current_balance?: number;
  shop_id: number;
  shop_name: string;
  shop_branch_code?: string;
  shop_phone?: string;
  shop_address?: string;
  shop_receipt_footer?: string;
  booking_date: string;
  trial_date?: string | null;
  delivery_date: string;
  delivered_at?: string | null;
  status:
    | "Booked"
    | "Cutting"
    | "Stitching"
    | "Ready"
    | "Delivered"
    | "Alteration"
    | "Returned"
    | "Cancelled";
  is_urgent: boolean;
  subtotal: number;
  discount: number;
  urgent_charges: number;
  total_amount: number;
  advance_paid: number;
  total_paid: number;
  balance_due: number;
  master_tailor: string;
  created_by?: string;
  notes: string;
  has_complaint?: boolean;
  complaint_count?: number;
  items: OrderItem[];
  complaints?: OrderComplaint[];
  created_at?: string;
}

export interface LedgerEntry {
  id: number;
  receipt_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_code: string;
  customer_current_balance: number;
  order_id?: number | null;
  order_number?: string | null;
  shop_id: number;
  shop_name?: string;
  entry_type:
    | "ORDER_BILL"
    | "ADVANCE_PAYMENT"
    | "DELIVERY_PAYMENT"
    | "UDHAAR_RECOVERY"
    | "CREDIT_DEPOSIT"
    | "UDHAAR_ADDED"
    | "DISCOUNT_WAIVER"
    | "ALTERATION_CHARGE"
    | "ALTERATION_PAYMENT"
    | "TAILOR_COMPENSATION_PAYOUT"
    | "SUIT_RETURN_REFUND"
    | "BILL_ADJUSTMENT_REFUND";
  amount: number;
  payment_method: string;
  created_by?: string;
  description: string;
  created_at: string;
}

export const FAULT_TAGS = [
  "Fitting Tight / Loose",
  "Lambai (Length) Choti / Bari",
  "Tera (Shoulder) Issue",
  "Bazu (Sleeves) Tight / Length",
  "Gala / Collar / Ban Fault",
  "Shalwar / Paincha Issue",
  "Silai / Tanka Udhra Hua",
  "Kapra Press / Stain / Burn",
  "Design / Button / Cuff Change",
];

export const MEASUREMENT_LABELS: Record<string, string> = {
  kameez_length: "Kameez Lambai (Length)",
  shirt_length: "Shirt Length (Lambai)",
  coat_length: "Coat / Waistcoat Length",
  tera: "Tera (Shoulder)",
  bazu: "Bazu (Sleeve Length)",
  chest: "Chati (Chest)",
  waist: "Kamar (Waist / Fitting)",
  ghera: "Ghera (Daman Width)",
  collar: "Gala / Collar (Neck)",
  shalwar_length: "Shalwar Lambai",
  paincha: "Paincha (Bottom Width)",
  pant_length: "Pant Length (Lambai)",
  pant_waist: "Pant Kamar (Waist)",
  hip: "Hip (Seat)",
  thigh: "Thigh (Raan)",
  bottom: "Pant Mori (Bottom)",
};

export const EASTERN_FIELDS = [
  "kameez_length",
  "tera",
  "bazu",
  "chest",
  "waist",
  "ghera",
  "collar",
  "shalwar_length",
  "paincha",
];

export const WESTERN_FIELDS = [
  "shirt_length",
  "tera",
  "bazu",
  "chest",
  "waist",
  "collar",
  "pant_length",
  "pant_waist",
  "hip",
  "thigh",
  "bottom",
];

export const FORMAL_FIELDS = [
  "coat_length",
  "tera",
  "bazu",
  "chest",
  "waist",
  "hip",
  "collar",
];

export const STYLE_OPTIONS = {
  collar_type: [
    "Sherwani / Ban Collar",
    "Full Point Collar",
    "French / Cut Collar",
    "Round Gala (Be-Collar)",
    "Spread Shirt Collar",
    "Mandarin / Kurta Gala",
  ],
  cuff_type: [
    "Simple Cuff (2.5 inch)",
    "Chauras Cuff (3 inch)",
    "Gol Bazu (Open Kurta Sleeve)",
    "Double Cuff (Studs)",
    "Cut Corner Shirt Cuff",
  ],
  daman_type: [
    "Gol Daman (Round)",
    "Chakor Daman (Square)",
    "Apple Cut Shirt Bottom",
    "Straight Cut",
  ],
  pocket_style: [
    "1 Front + 2 Side Pockets",
    "No Front, 2 Side Pockets Only",
    "1 Front + 1 Right Side + Shalwar Zip",
    "1 Chest Pocket Only",
    "Cross Pant Pockets + 2 Back Pockets",
  ],
  silai_type: [
    "Single Fine Silai",
    "Double Silai (Chamak Dhaga)",
    "Triple Stitch Design",
    "Hand Tanka / Bespoke Finish",
  ],
  shalwar_style: [
    "Normal Khuli Shalwar",
    "Heavy Ghera Balochi Shalwar",
    "Straight Trouser Pajama (Elastic)",
    "Narrow Fit Dress Pant",
    "Regular Pleated Trouser",
  ],
};
