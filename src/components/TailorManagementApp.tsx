"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shop,
  User,
  GarmentType,
  RateHistoryItem,
  AuditLogItem,
  MonthlySaleReport,
  UserSaleReport,
  UserCashReport,
  GarmentSaleReport,
  Customer,
  Order,
  LedgerEntry,
  MEASUREMENT_LABELS,
} from "@/types/tailor";
import ParchiModal from "@/components/ParchiModal";
import DeliverOrderModal from "@/components/DeliverOrderModal";
import NewOrderModal from "@/components/NewOrderModal";
import CustomerModal from "@/components/CustomerModal";
import ComplaintModal from "@/components/ComplaintModal";
import {
  Scissors,
  LayoutDashboard,
  FileText,
  Users,
  Tags,
  Wallet,
  Store,
  Settings,
  LogOut,
  Plus,
  Search,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Ruler,
  Edit3,
  KeyRound,
  UserPlus,
  Sparkles,
  Phone,
  Calendar,
  RefreshCw,
  BarChart3,
  History,
  Power,
  Trash2,
  ArrowUpRight,
  Wrench,
  Lock,
  RotateCcw,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Database,
} from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "orders"
  | "customers"
  | "rates"
  | "ledger"
  | "reports"
  | "shops"
  | "settings";

export default function TailorManagementApp() {
  // Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation & Global Filter
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedShopId, setSelectedShopId] = useState<string>("all");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core Data from PostgreSQL
  const [shops, setShops] = useState<Shop[]>([]);
  const [garments, setGarments] = useState<GarmentType[]>([]);
  const [rateHistory, setRateHistory] = useState<RateHistoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  // Reports & History Data
  const [monthlySales, setMonthlySales] = useState<MonthlySaleReport[]>([]);
  const [userSales, setUserSales] = useState<UserSaleReport[]>([]);
  const [userCash, setUserCash] = useState<UserCashReport[]>([]);
  const [garmentSales, setGarmentSales] = useState<GarmentSaleReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");

  // Modals State
  const [parchiOrder, setParchiOrder] = useState<Order | null>(null);
  const [deliverOrder, setDeliverOrder] = useState<Order | null>(null);
  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [preselectedCustomerForOrder, setPreselectedCustomerForOrder] =
    useState<number | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerBalanceFilter, setCustomerBalanceFilter] = useState<
    "ALL" | "UDHAAR" | "CREDIT"
  >("ALL");

  // Rate Card Form State (Pricing Entity with Monthly / Seasonal Tracking)
  const [editingGarment, setEditingGarment] = useState<GarmentType | null>(null);
  const [newGarmentForm, setNewGarmentForm] = useState({
    name: "",
    category: "Eastern",
    base_price: "2000",
    urgent_surcharge: "500",
    effective_month: "October 2026",
    notes: "",
  });

  // Ledger / Udhaar Wasooli Form State
  const [khataForm, setKhataForm] = useState({
    customer_id: "",
    entry_type: "UDHAAR_RECOVERY",
    amount: "",
    payment_method: "Cash",
    description: "",
  });

  // Shop Form State
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState({
    name: "",
    branch_code: "",
    phone: "",
    whatsapp: "",
    address: "",
    receipt_footer:
      "Shukriya! Delivery ke waqt yeh Parchi (Receipt) zaroor saath layein.",
  });

  // Password / User Settings State
  const [pwdForm, setPwdForm] = useState({
    newUsername: "",
    newPassword: "",
    fullName: "",
    phone: "",
  });
  const [newStaffForm, setNewStaffForm] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "manager",
    shopId: "1",
    phone: "",
  });

  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showDailyBackupPrompt, setShowDailyBackupPrompt] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleDownloadBackup = async (isAuto = false) => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) {
        throw new Error("Backup download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const todayStr = new Date().toISOString().slice(0, 10);
      a.download = `royal_tailor_backup_${todayStr}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Save today's date in localStorage
      localStorage.setItem("last_backup_date", todayStr);
      setShowDailyBackupPrompt(false);
      showToast(
        isAuto
          ? "✅ Aaj ka Daily Database Backup kamyabi se download ho gaya!"
          : "✅ Complete Live Database (.sql) download ho gaya!"
      );
    } catch (err) {
      console.error(err);
      alert("Database backup download karne mein masla hua. Dobara koshish karein.");
    } finally {
      setIsBackingUp(false);
    }
  };

  // Daily backup prompt check on user login
  useEffect(() => {
    if (currentUser) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastBackup = localStorage.getItem("last_backup_date");
      if (lastBackup !== todayStr) {
        setShowDailyBackupPrompt(true);
      }
    }
  }, [currentUser]);

  const fetchAllData = useCallback(
    async (shopFilter = selectedShopId) => {
      setDataLoading(true);
      try {
        const [shopsRes, garmentsRes, custRes, ordRes, ledRes, repRes] =
          await Promise.all([
            fetch("/api/shops"),
            fetch("/api/garments"),
            fetch(`/api/customers?shopId=${shopFilter}`),
            fetch(`/api/orders?shopId=${shopFilter}`),
            fetch(`/api/ledger?shopId=${shopFilter}`),
            fetch(`/api/reports?shopId=${shopFilter}`),
          ]);

        const [shopsData, garmentsData, custData, ordData, ledData, repData] =
          await Promise.all([
            shopsRes.json(),
            garmentsRes.json(),
            custRes.json(),
            ordRes.json(),
            ledRes.json(),
            repRes.json(),
          ]);

        if (shopsData.shops) {
          setShops(shopsData.shops);
          const activeList = shopsData.shops.filter((s: Shop) => s.is_active);
          if (activeList.length === 1 && shopFilter === "all") {
            // Keep single-branch experience clean
          }
        }
        if (garmentsData.garments) setGarments(garmentsData.garments);
        if (garmentsData.rate_history)
          setRateHistory(garmentsData.rate_history);
        if (custData.customers) setCustomers(custData.customers);
        if (ordData.orders) setOrders(ordData.orders);
        if (ledData.ledger) setLedger(ledData.ledger);

        if (repData.monthly_sales) setMonthlySales(repData.monthly_sales);
        if (repData.user_sales) setUserSales(repData.user_sales);
        if (repData.user_cash) setUserCash(repData.user_cash);
        if (repData.garment_sales) setGarmentSales(repData.garment_sales);
        if (repData.audit_logs) setAuditLogs(repData.audit_logs);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setDataLoading(false);
      }
    },
    [selectedShopId]
  );

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.users) setAllUsers(data.users);
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setPwdForm({
            newUsername: data.user.username,
            newPassword: "",
            fullName: data.user.full_name,
            phone: data.user.phone || "",
          });
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        setAuthChecked(true);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAllData(selectedShopId);
    }
  }, [currentUser, selectedShopId, fetchAllData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      setCurrentUser(data.user);
      setPwdForm({
        newUsername: data.user.username,
        newPassword: "",
        fullName: data.user.full_name,
        phone: data.user.phone || "",
      });
      showToast(`Khush Aamdeed, ${data.user.full_name}!`);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Invalid login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setCurrentUser(null);
  };

  const handleQuickStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          order_id: orderId,
          status: newStatus,
          performed_by: currentUser?.full_name || "Admin",
        }),
      });
      if (res.ok) {
        showToast(`Order status updated to "${newStatus}"`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGarmentRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = editingGarment
        ? {
            id: editingGarment.id,
            name: editingGarment.name,
            category: editingGarment.category,
            base_price: Number(editingGarment.base_price),
            urgent_surcharge: Number(editingGarment.urgent_surcharge),
            effective_month:
              editingGarment.effective_month || newGarmentForm.effective_month,
            notes: newGarmentForm.notes,
            changed_by: currentUser?.full_name || "Admin",
          }
        : {
            name: newGarmentForm.name,
            category: newGarmentForm.category,
            base_price: Number(newGarmentForm.base_price),
            urgent_surcharge: Number(newGarmentForm.urgent_surcharge),
            effective_month: newGarmentForm.effective_month,
            notes: newGarmentForm.notes,
            changed_by: currentUser?.full_name || "Admin",
          };

      const res = await fetch("/api/garments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingGarment
            ? "Silai Rate updated & saved in Rate History Log!"
            : "New Garment Type added to Rate Card & History!"
        );
        setEditingGarment(null);
        setNewGarmentForm({
          name: "",
          category: "Eastern",
          base_price: "2000",
          urgent_surcharge: "500",
          effective_month: "October 2026",
          notes: "",
        });
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveKhataEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!khataForm.customer_id || !khataForm.amount) return;
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: Number(khataForm.customer_id),
          shop_id: selectedShopId !== "all" ? Number(selectedShopId) : 1,
          entry_type: khataForm.entry_type,
          amount: Number(khataForm.amount),
          payment_method: khataForm.payment_method,
          description: khataForm.description,
          performed_by: currentUser?.full_name || "Admin",
        }),
      });
      if (res.ok) {
        showToast("Khata / Udhaar payment recorded in Ledger & History!");
        setKhataForm({
          customer_id: "",
          entry_type: "UDHAAR_RECOVERY",
          amount: "",
          payment_method: "Cash",
          description: "",
        });
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = editingShop
        ? { ...editingShop, performed_by: currentUser?.full_name }
        : { ...shopForm, performed_by: currentUser?.full_name };
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(
          editingShop
            ? "Shop branch details updated!"
            : "New Shop branch added successfully!"
        );
        setEditingShop(null);
        setShopForm({
          name: "",
          branch_code: "",
          phone: "",
          whatsapp: "",
          address: "",
          receipt_footer:
            "Shukriya! Delivery ke waqt yeh Parchi (Receipt) zaroor saath layein.",
        });
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleShopActive = async (shop: Shop) => {
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          id: shop.id,
          is_active: !shop.is_active,
          performed_by: currentUser?.full_name || "Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not change shop status");
        return;
      }
      showToast(
        shop.is_active
          ? `Branch "${shop.name}" deactivated! Ab sirf active branch use hogi.`
          : `Branch "${shop.name}" activated!`
      );
      if (selectedShopId === String(shop.id) && shop.is_active) {
        setSelectedShopId("all");
      }
      fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteShop = async (shop: Shop) => {
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: shop.id,
          performed_by: currentUser?.full_name || "Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not delete shop branch");
        return;
      }
      showToast(`Shop Branch "${shop.name}" deleted!`);
      if (selectedShopId === String(shop.id)) {
        setSelectedShopId("all");
      }
      fetchAllData("all");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !pwdForm.newPassword) return;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          userId: currentUser.id,
          newUsername: pwdForm.newUsername,
          newPassword: pwdForm.newPassword,
          fullName: pwdForm.fullName,
          phone: pwdForm.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setPwdForm((prev) => ({ ...prev, newPassword: "" }));
        showToast("Username & Password updated in PostgreSQL users table!");
        const authRes = await fetch("/api/auth");
        const authData = await authRes.json();
        if (authData.users) setAllUsers(authData.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStaffUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_user",
          ...newStaffForm,
          shopId: Number(newStaffForm.shopId),
        }),
      });
      if (res.ok) {
        showToast("New staff login created successfully!");
        setNewStaffForm({
          username: "",
          password: "",
          fullName: "",
          role: "manager",
          shopId: "1",
          phone: "",
        });
        const authRes = await fetch("/api/auth");
        const authData = await authRes.json();
        if (authData.users) setAllUsers(authData.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Loading Splash
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Scissors className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-300">
            Connecting to PostgreSQL (tailor_management_db)...
          </p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
          <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg">
              <Scissors className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Royal Bespoke Tailors
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete Tailor Shop, Naap Book, Order Parchi & Udhaar ERP
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Password *
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition"
            >
              {loginLoading ? "Signing In..." : "Login to Tailor Dashboard →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeShops = shops.filter((s) => s.is_active);

  // KPIs Calculation
  const activeOrders = orders.filter((o) => o.status !== "Cancelled");
  const inProgressCount = activeOrders.filter((o) =>
    ["Booked", "Cutting", "Stitching"].includes(o.status)
  ).length;
  const readyForDeliveryCount = activeOrders.filter(
    (o) => o.status === "Ready"
  ).length;
  const deliveredCount = activeOrders.filter(
    (o) => o.status === "Delivered"
  ).length;

  const totalRevenue = activeOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );
  const totalCollected = activeOrders.reduce(
    (sum, o) => sum + Number(o.total_paid || 0),
    0
  );

  const totalMarketUdhaar = customers
    .filter((c) => Number(c.current_balance) > 0)
    .reduce((sum, c) => sum + Number(c.current_balance), 0);

  const totalCustomerCredit = customers
    .filter((c) => Number(c.current_balance) < 0)
    .reduce((sum, c) => sum + Math.abs(Number(c.current_balance)), 0);

  // Current Month vs Previous Month Sale from monthlySales report
  const currentMonthReport = monthlySales[0] || {
    month_label: "Current Month",
    total_sale: 0,
    total_orders: 0,
    total_suits: 0,
    total_collected: 0,
  };
  const previousMonthReport = monthlySales[1] || {
    month_label: "Previous Month",
    total_sale: 0,
    total_orders: 0,
    total_suits: 0,
    total_collected: 0,
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === "ALL" || o.status === orderStatusFilter;
    if (!matchesStatus) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q) ||
      o.customer_code?.toLowerCase().includes(q)
    );
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    if (customerBalanceFilter === "UDHAAR" && Number(c.current_balance) <= 0)
      return false;
    if (customerBalanceFilter === "CREDIT" && Number(c.current_balance) >= 0)
      return false;
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.customer_code.toLowerCase().includes(q) ||
      (c.address || "").toLowerCase().includes(q)
    );
  });

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

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* MOBILE DRAWER BACKDROP */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION (EXPANDABLE & RESPONSIVE WITH MATERIAL LIGHT THEME) */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200/90 text-slate-800 shrink-0 flex flex-col justify-between shadow-xl lg:shadow-none transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full lg:translate-x-0"
        } ${isSidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Logo & Collapse Toggle */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20 shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <div className="overflow-hidden transition-all duration-200">
                  <h1 className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                    ROYAL TAILORS
                  </h1>
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                    Silai & Khata ERP
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button (New Order / Parchi) */}
          <div className="p-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPreselectedCustomerForOrder(null);
                setIsNewOrderOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition ${
                isSidebarCollapsed && !isMobileMenuOpen ? "px-0" : ""
              }`}
              title="Book New Order / Parchi"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <span>New Order / Parchi</span>
              )}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="px-2.5 py-1 space-y-1 overflow-y-auto flex-1">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
              },
              {
                id: "orders",
                label: "Orders & Parchi",
                icon: FileText,
                badge: orders.filter((o) => o.status !== "Delivered").length,
              },
              {
                id: "customers",
                label: "Customers & Naap",
                icon: Users,
                badge: customers.length,
              },
              {
                id: "rates",
                label: "Silai Rates & Price",
                icon: Tags,
              },
              {
                id: "ledger",
                label: "Udhaar Ledger",
                icon: Wallet,
              },
              {
                id: "reports",
                label: "Sales & Reports",
                icon: BarChart3,
              },
              {
                id: "shops",
                label: "Shop Branches",
                icon: Store,
                badge: `${activeShops.length}/${shops.length}`,
              },
              {
                id: "settings",
                label: "Users & Settings",
                icon: Settings,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed && !isMobileMenuOpen
                      ? "justify-center px-2"
                      : "justify-between px-3"
                  } py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200/80 font-extrabold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  title={item.label}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-700" : "text-slate-500"
                      }`}
                    />
                    {(!isSidebarCollapsed || isMobileMenuOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </span>
                  {(!isSidebarCollapsed || isMobileMenuOpen) &&
                    item.badge !== undefined && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                          isActive
                            ? "bg-emerald-200/70 text-emerald-900"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>

          {/* Logged In User Profile Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center justify-between gap-2">
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <div className="truncate pr-1">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {currentUser.full_name}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">
                    @{currentUser.username} • {currentUser.role.toUpperCase()}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Bar with Mobile Drawer Trigger, Branch Switcher & Actions */}
        <header className="no-print bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Hamburger Drawer Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shrink-0 active:scale-95"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Quick Sidebar Collapse Button in Header */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
              >
                <Menu className="w-4 h-4" />
              </button>

              <Store className="w-4 h-4 text-emerald-600 shrink-0 hidden sm:block" />
              {activeShops.length <= 1 ? (
                <div className="min-w-0 truncate">
                  <span className="text-[9px] font-extrabold uppercase text-emerald-700 block leading-tight">
                    Shop Branch
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
                    {activeShops[0]?.name || shops[0]?.name || "Main Shop"}
                  </span>
                </div>
              ) : (
                <div className="min-w-0">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block leading-tight">
                    Branch Filter
                  </label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="text-xs sm:text-sm font-extrabold text-slate-900 bg-transparent outline-none cursor-pointer pr-2 max-w-[140px] sm:max-w-none truncate"
                  >
                    <option value="all">
                      All Branches ({activeShops.length})
                    </option>
                    {activeShops.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} [{s.branch_code}]
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Quick Search on Desktop */}
              <div className="relative hidden md:block">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Parchi # or Phone..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    if (activeTab !== "orders" && activeTab !== "dashboard") {
                      setActiveTab("orders");
                    }
                  }}
                  className="pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold w-44 lg:w-56 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              {/* 1-Click Backup Button */}
              <button
                type="button"
                onClick={() => handleDownloadBackup(false)}
                disabled={isBackingUp}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 active:scale-95 shrink-0"
                title="1-Click Live Database SQL Backup Download"
              >
                <Download
                  className={`w-3.5 h-3.5 ${isBackingUp ? "animate-bounce" : ""}`}
                />
                <span className="hidden sm:inline">
                  {isBackingUp ? "Downloading..." : "Backup DB"}
                </span>
              </button>

              {/* Refresh Database Data */}
              <button
                type="button"
                onClick={() => fetchAllData()}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition shrink-0 active:scale-95"
                title="Refresh Database Data"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    dataLoading ? "animate-spin" : ""
                  }`}
                />
              </button>

              {/* Add Customer Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-extrabold items-center gap-1.5 shadow-xs transition shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>+ Customer</span>
              </button>

              {/* Book Order Button */}
              <button
                type="button"
                onClick={() => {
                  setPreselectedCustomerForOrder(null);
                  setIsNewOrderOpen(true);
                }}
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Parchi</span>
              </button>
            </div>
          </div>

          {/* Full-Width Search Bar on Mobile */}
          <div className="relative mt-2 md:hidden">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Parchi # or Phone..."
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                if (activeTab !== "orders" && activeTab !== "dashboard") {
                  setActiveTab("orders");
                }
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>
        </header>

        {/* Daily Backup Reminder Banner */}
        {showDailyBackupPrompt && (
          <div className="no-print bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-amber-600/20">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="p-1 rounded-lg bg-black/10 shrink-0">
                <Database className="w-4 h-4" />
              </span>
              <span>
                <strong>Rozana ka Backup Reminder:</strong> Aaj ka live database backup download nahi hua hai. Apne computer/laptop mein safe copy rakhein!
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => handleDownloadBackup(true)}
                disabled={isBackingUp}
                className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBackingUp ? "Downloading..." : "1-Click Download Aaj Ka Backup"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDailyBackupPrompt(false)}
                className="p-1 rounded-lg hover:bg-black/10 text-slate-900 transition"
                title="Dismiss Reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page Content Container */}
        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                    <span>In Workshop (Silai)</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">
                    {inProgressCount}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Booked, Cutting & Stitching
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
                  <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase">
                    <span>Ready for Delivery</span>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-blue-900 mt-2">
                    {readyForDeliveryCount}
                  </p>
                  <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                    Suits tayyar hain ({deliveredCount} delivered)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                    <span>This Month Sale</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">
                    Rs. {Number(currentMonthReport.total_sale || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prev Month: Rs.{" "}
                    {Number(previousMonthReport.total_sale || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                    <span>Total All-Time Sale</span>
                    <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">
                    Rs. {totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Across {activeOrders.length} orders
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
                  <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase">
                    <span>Cash Wasool Shuda</span>
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-800 mt-2">
                    Rs. {totalCollected.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    Advance + Delivery Cash
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/40">
                  <div className="flex items-center justify-between text-red-700 text-xs font-bold uppercase">
                    <span>Market Udhaar (Baqaya)</span>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-black text-red-700 mt-2">
                    Rs. {totalMarketUdhaar.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Customer Credit: Rs. {totalCustomerCredit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Active Orders & Parchi Delivery Board */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-emerald-600" />
                      Active Stitching Orders & Parchi Delivery Queue
                    </h2>
                    <p className="text-xs text-slate-500">
                      Customer Parchi dikhaye to yahan se 1-click mein Suit Deliver karein aur Baqaya Payment enter karein
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View Full Order Book →
                  </button>
                </div>

                {/* MOBILE VIEW: Clean, Decent Cards for Phones */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredOrders.slice(0, 10).map((ord) => (
                    <div key={ord.id} className="p-4 bg-white space-y-3">
                      {/* Top Row: Parchi # & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-slate-900 tracking-tight">
                              {ord.order_number}
                            </span>
                            {ord.is_urgent && (
                              <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                                ⚡ URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {ord.shop_name} • Booked: {formatDate(ord.booking_date)}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {ord.status === "Delivered" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Delivered
                            </span>
                          ) : ord.status === "Alteration" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <Wrench className="w-3 h-3 text-amber-700" /> Alteration
                            </span>
                          ) : ord.status === "Returned" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <RotateCcw className="w-3 h-3" /> Returned
                            </span>
                          ) : (
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleQuickStatusChange(ord.id, e.target.value)
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                                ord.status === "Ready"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : ord.status === "Stitching"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              <option value="Booked">Booked</option>
                              <option value="Cutting">Cutting</option>
                              <option value="Stitching">Stitching</option>
                              <option value="Ready">Ready</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Middle: Customer & Delivery Details */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">
                            {ord.customer_name}
                          </span>
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {ord.customer_phone}
                          </span>
                        </div>

                        <div className="text-slate-600">
                          {(ord.items || []).map((item, i) => (
                            <span key={i} className="inline-block mr-2 font-medium">
                              • {item.quantity}x {item.garment_name}{" "}
                              {item.fabric_details ? `(${item.fabric_details})` : ""}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-semibold text-[11px]">
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Delivery: {formatDate(ord.delivery_date)}
                          </span>
                          <span className="text-slate-900 font-bold">
                            Total: Rs. {Number(ord.total_amount).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Financials & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div>
                          {Number(ord.balance_due) > 0 ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-black block">
                              Baqaya: Rs. {Number(ord.balance_due).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs">
                              ✓ Paid in Full
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setParchiOrder(ord)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" /> Parchi
                          </button>

                          {ord.status === "Delivered" ||
                          ord.status === "Alteration" ||
                          ord.status === "Returned" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setComplaintOrder(ord)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 ${
                                  ord.status === "Alteration"
                                    ? "bg-amber-600 text-white"
                                    : "bg-rose-600 text-white"
                                }`}
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                {ord.status === "Alteration" ? "Alteration" : "Complaint"}
                              </button>
                              {Number(ord.balance_due) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setDeliverOrder(ord)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
                                >
                                  <Wallet className="w-3.5 h-3.5" /> Wasooli
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeliverOrder(ord)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95"
                            >
                              <Truck className="w-3.5 h-3.5" /> Deliver
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP VIEW: High Capacity Full Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Parchi #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Suits & Silai Items</th>
                        <th className="py-3 px-4">Delivery Date</th>
                        <th className="py-3 px-4">Bill / Baqaya</th>
                        <th className="py-3 px-4">Workshop Status</th>
                        <th className="py-3 px-4 text-right">
                          Parchi & Delivery Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredOrders.slice(0, 10).map((ord) => (
                        <tr
                          key={ord.id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-black text-slate-900 block">
                              {ord.order_number}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {ord.shop_name}
                            </span>
                            {ord.is_urgent && (
                              <span className="inline-block mt-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                ⚡ URGENT
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {ord.customer_name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {ord.customer_phone}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {(ord.items || []).map((item, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-bold text-slate-800">
                                    {item.quantity}x {item.garment_name}
                                  </span>
                                  {item.fabric_details && (
                                    <span className="text-slate-500">
                                      {" "}
                                      ({item.fabric_details})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              {formatDate(ord.delivery_date)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Booked: {formatDate(ord.booking_date)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-xs text-slate-600">
                              Total:{" "}
                              <strong className="text-slate-900">
                                Rs. {Number(ord.total_amount).toLocaleString()}
                              </strong>
                            </div>
                            <div className="text-xs text-emerald-700">
                              Paid: Rs. {Number(ord.total_paid).toLocaleString()}
                            </div>
                            {Number(ord.balance_due) > 0 ? (
                              <span className="inline-block mt-0.5 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-extrabold">
                                Baqaya: Rs.{" "}
                                {Number(ord.balance_due).toLocaleString()}
                              </span>
                            ) : (
                              <span className="inline-block mt-0.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">
                                ✓ Fully Paid
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {ord.status === "Delivered" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Delivered (Completed)
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  Direct status locked
                                </span>
                                {(ord.complaint_count || 0) > 0 && (
                                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                    {ord.complaint_count} Complaint / Fix Record
                                  </span>
                                )}
                              </div>
                            ) : ord.status === "Alteration" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                                  Alteration (Dobara Silai)
                                </span>
                                {ord.complaints?.[0]?.fault_category && (
                                  <span className="block text-[10px] text-amber-800 font-semibold">
                                    Fault: {ord.complaints[0].fault_category}
                                  </span>
                                )}
                              </div>
                            ) : ord.status === "Returned" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Suit Returned
                                </span>
                              </div>
                            ) : (
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleQuickStatusChange(ord.id, e.target.value)
                                }
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold border outline-none cursor-pointer ${
                                  ord.status === "Ready"
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : ord.status === "Stitching"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-slate-100 text-slate-800 border-slate-300"
                                }`}
                              >
                                <option value="Booked">Booked (Naya)</option>
                                <option value="Cutting">Cutting (Katai)</option>
                                <option value="Stitching">
                                  Stitching (Silai)
                                </option>
                                <option value="Ready">Ready (Tayyar)</option>
                              </select>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setParchiOrder(ord)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                                title="Print Parchi / Invoice / Karigar Naap Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Parchi
                              </button>

                              {ord.status === "Delivered" ||
                              ord.status === "Alteration" ||
                              ord.status === "Returned" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setComplaintOrder(ord)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer ${
                                      ord.status === "Alteration"
                                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                                        : "bg-rose-600 hover:bg-rose-500 text-white"
                                    }`}
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    {ord.status === "Alteration"
                                      ? "Alteration / Re-Deliver"
                                      : "Return / Fault / Complaint"}
                                  </button>
                                  {Number(ord.balance_due) > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setDeliverOrder(ord)}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                                    >
                                      <Wallet className="w-3.5 h-3.5" />
                                      Wasooli
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeliverOrder(ord)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  Deliver / Wasooli
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom 2-Column Overview: Customer Udhaar List & Monthly / User Sales Snapshot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Udhaar / Receivable Alert Box */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-red-600" />
                        Customer Udhaar & Balance Tracker (Khata)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Customers with pending balance or advance deposit
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ledger")}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Open Khata Book →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {customers
                      .filter((c) => Number(c.current_balance) !== 0)
                      .slice(0, 6)
                      .map((c) => {
                        const bal = Number(c.current_balance);
                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-900">
                                {c.full_name}{" "}
                                <span className="text-xs font-mono text-slate-500">
                                  ({c.customer_code})
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">
                                {c.phone} • {c.shop_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                  bal > 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {bal > 0
                                  ? `Udhaar: Rs. ${bal.toLocaleString()}`
                                  : `Advance Credit: Rs. ${Math.abs(
                                      bal
                                    ).toLocaleString()}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setKhataForm((prev) => ({
                                    ...prev,
                                    customer_id: String(c.id),
                                    amount: bal > 0 ? String(bal) : "",
                                  }));
                                  setActiveTab("ledger");
                                }}
                                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                              >
                                Wasooli
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Monthly Sales & User Performance Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        Monthly Sale vs Purani Sale & User Summary
                      </h3>
                      <p className="text-xs text-slate-500">
                        Month-by-month billing & staff collection summary
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("reports")}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Open Full Reports →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {monthlySales.slice(0, 3).map((m, idx) => (
                      <div
                        key={m.month_key}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {m.month_label}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                idx === 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {idx === 0 ? "Current Month" : "Purani Sale"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Orders: <strong>{m.total_orders}</strong> • Suits
                            Stitched: <strong>{m.total_suits}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-sm block">
                            Sale: Rs. {Number(m.total_sale).toLocaleString()}
                          </span>
                          <span className="text-xs text-emerald-700 font-bold">
                            Collected: Rs.{" "}
                            {Number(m.total_collected).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ORDERS & PARCHI BOOK ================= */}
          {activeTab === "orders" && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Complete Order Book & Parchi Register
                  </h2>
                  <p className="text-xs text-slate-500">
                    Delivered orders par direct status change lock hai — kisi bhi silai fault, alteration ya wapsi ke liye &quot;Return / Fault / Complaint&quot; button use karein
                  </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                  {[
                    "ALL",
                    "Booked",
                    "Cutting",
                    "Stitching",
                    "Ready",
                    "Delivered",
                    "Alteration",
                    "Returned",
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        orderStatusFilter === st
                          ? "bg-slate-900 text-white shadow"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* MOBILE VIEW FOR TAB 2: Orders Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-bold">
                      Koi order nahi mila. Naya order book karein!
                    </div>
                  ) : (
                    filteredOrders.map((ord) => (
                      <div key={ord.id} className="p-4 bg-white space-y-3">
                        {/* Header: Parchi & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm text-slate-900">
                                {ord.order_number}
                              </span>
                              {ord.is_urgent && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                                  ⚡ URGENT
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {ord.shop_name} • Booked by: {ord.created_by || "Admin"}
                            </p>
                          </div>

                          <div>
                            {ord.status === "Delivered" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Delivered
                              </span>
                            ) : ord.status === "Alteration" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                                <Wrench className="w-3 h-3 text-amber-700" /> Alteration
                              </span>
                            ) : ord.status === "Returned" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                <RotateCcw className="w-3 h-3" /> Returned
                              </span>
                            ) : (
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleQuickStatusChange(ord.id, e.target.value)
                                }
                                className={`px-2 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                                  ord.status === "Ready"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : ord.status === "Stitching"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-800 border-slate-300"
                                }`}
                              >
                                <option value="Booked">Booked</option>
                                <option value="Cutting">Cutting</option>
                                <option value="Stitching">Stitching</option>
                                <option value="Ready">Ready</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Customer & Items */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">
                              {ord.customer_name}
                            </span>
                            <span className="text-slate-500 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {ord.customer_phone}
                            </span>
                          </div>

                          <div className="text-slate-700 space-y-0.5">
                            {(ord.items || []).map((item, i) => (
                              <div key={i} className="text-xs">
                                <strong>{item.quantity}x {item.garment_name}</strong>
                                {item.fabric_details && (
                                  <span className="text-slate-500"> — {item.fabric_details}</span>
                                )}
                              </div>
                            ))}
                            {ord.notes && (
                              <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                                Note: {ord.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-semibold text-[11px]">
                            <span className="text-emerald-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Delivery: {formatDate(ord.delivery_date)}
                            </span>
                            <span className="text-slate-500">
                              Booked: {formatDate(ord.booking_date)}
                            </span>
                          </div>
                        </div>

                        {/* Bill, Baqaya & Actions */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div>
                            <div className="text-xs text-slate-600">
                              Bill: <strong>Rs. {Number(ord.total_amount).toLocaleString()}</strong>
                            </div>
                            {Number(ord.balance_due) > 0 ? (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-black inline-block mt-0.5">
                                Baqaya: Rs. {Number(ord.balance_due).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold text-xs inline-block mt-0.5">
                                ✓ Paid in Full
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => setParchiOrder(ord)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" /> Parchi
                            </button>

                            {ord.status === "Delivered" ||
                            ord.status === "Alteration" ||
                            ord.status === "Returned" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setComplaintOrder(ord)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 ${
                                    ord.status === "Alteration"
                                      ? "bg-amber-600 text-white"
                                      : "bg-rose-600 text-white"
                                  }`}
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                  {ord.status === "Alteration" ? "Alteration" : "Complaint"}
                                </button>
                                {Number(ord.balance_due) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setDeliverOrder(ord)}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
                                  >
                                    <Wallet className="w-3.5 h-3.5" /> Wasooli
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeliverOrder(ord)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95"
                              >
                                <Truck className="w-3.5 h-3.5" /> Deliver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* DESKTOP FULL TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3.5 px-4">Parchi / Order #</th>
                        <th className="py-3.5 px-4">Customer & Phone</th>
                        <th className="py-3.5 px-4">Suits & Fabric Details</th>
                        <th className="py-3.5 px-4">Booking & Delivery</th>
                        <th className="py-3.5 px-4">Financials (Rs.)</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-4 px-4">
                            <span className="font-black text-base text-slate-900 block">
                              {ord.order_number}
                            </span>
                            <span className="text-xs text-slate-500">
                              {ord.shop_name}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              Booked by: {ord.created_by || "Admin"}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900">
                              {ord.customer_name}
                            </p>
                            <p className="text-xs text-slate-600">
                              {ord.customer_phone}
                            </p>
                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {ord.customer_code}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {(ord.items || []).map((it, idx) => (
                              <div key={idx} className="mb-1 last:mb-0">
                                <span className="font-bold text-slate-900 text-xs">
                                  {it.quantity}x {it.garment_name}
                                </span>{" "}
                                <span className="text-xs text-slate-500">
                                  @ Rs. {Number(it.unit_price).toLocaleString()}
                                </span>
                                {it.fabric_details && (
                                  <p className="text-[11px] text-slate-500">
                                    Fabric: {it.fabric_details}
                                  </p>
                                )}
                              </div>
                            ))}
                            {ord.notes && (
                              <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                                Note: {ord.notes}
                              </p>
                            )}
                            {ord.complaints && ord.complaints.length > 0 && (
                              <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
                                <strong>
                                  Latest Complaint ({ord.complaints[0].complaint_number}):
                                </strong>{" "}
                                {ord.complaints[0].fault_category} —{" "}
                                {ord.complaints[0].issue_description}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-xs">
                            <div>
                              Booked:{" "}
                              <strong>{formatDate(ord.booking_date)}</strong>
                            </div>
                            <div className="text-emerald-700 font-bold mt-1">
                              Delivery: {formatDate(ord.delivery_date)}
                            </div>
                            {ord.delivered_at && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Delivered: {formatDate(ord.delivered_at)}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-xs">
                            <div>
                              Bill:{" "}
                              <strong className="text-slate-900">
                                Rs. {Number(ord.total_amount).toLocaleString()}
                              </strong>
                            </div>
                            <div className="text-emerald-700 font-semibold">
                              Paid: Rs. {Number(ord.total_paid).toLocaleString()}
                            </div>
                            <div
                              className={`font-extrabold mt-0.5 ${
                                Number(ord.balance_due) > 0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              Baqaya: Rs.{" "}
                              {Number(ord.balance_due).toLocaleString()}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {ord.status === "Delivered" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Delivered (Completed)
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  Direct status locked
                                </span>
                                {(ord.complaint_count || 0) > 0 && (
                                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                    {ord.complaint_count} Complaint / Fix Record
                                  </span>
                                )}
                              </div>
                            ) : ord.status === "Alteration" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                                  Alteration (Dobara Silai)
                                </span>
                                <span className="block text-[10px] text-amber-700 font-semibold">
                                  Under Complaint / Fix
                                </span>
                              </div>
                            ) : ord.status === "Returned" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Suit Returned
                                </span>
                              </div>
                            ) : (
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleQuickStatusChange(ord.id, e.target.value)
                                }
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-300 bg-white cursor-pointer"
                              >
                                <option value="Booked">Booked</option>
                                <option value="Cutting">Cutting</option>
                                <option value="Stitching">Stitching</option>
                                <option value="Ready">Ready</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setParchiOrder(ord)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Print Parchi
                              </button>

                              {ord.status === "Delivered" ||
                              ord.status === "Alteration" ||
                              ord.status === "Returned" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setComplaintOrder(ord)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer ${
                                      ord.status === "Alteration"
                                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                                        : "bg-rose-600 hover:bg-rose-500 text-white"
                                    }`}
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    {ord.status === "Alteration"
                                      ? "Manage Alteration / Re-Deliver"
                                      : "Return / Fault / Complaint"}
                                  </button>
                                  {Number(ord.balance_due) > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setDeliverOrder(ord)}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Wallet className="w-3.5 h-3.5" />
                                      Baqaya Wasooli
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeliverOrder(ord)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  Deliver / Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CUSTOMERS & NAAP BOOK ================= */}
          {activeTab === "customers" && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Customer Directory & Permanent Naap Book
                  </h2>
                  <p className="text-xs text-slate-500">
                    Open any customer to view/edit their Naap, check their Udhaar balance, or book a new Suit Order
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search customer name, phone, code..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold w-64"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(["ALL", "UDHAAR", "CREDIT"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCustomerBalanceFilter(f)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          customerBalanceFilter === f
                            ? "bg-slate-900 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {f === "ALL"
                          ? "All Customers"
                          : f === "UDHAAR"
                          ? "Udhaar Holders"
                          : "Advance Credit"}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomer(null);
                      setIsCustomerModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />+ Add New Customer & Naap
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredCustomers.map((cust) => {
                  const bal = Number(cust.current_balance || 0);
                  const primaryNaap = cust.measurements_list?.[0];

                  return (
                    <div
                      key={cust.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-slate-900">
                                {cust.full_name}
                              </h3>
                              <span className="text-xs font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">
                                {cust.customer_code}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5">
                              Phone: {cust.phone}{" "}
                              {cust.address ? `• ${cust.address}` : ""}
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                              bal > 0
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : bal < 0
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {bal > 0
                              ? `Udhaar: Rs. ${bal.toLocaleString()}`
                              : bal < 0
                              ? `Credit: Rs. ${Math.abs(bal).toLocaleString()}`
                              : "Balance Clear"}
                          </span>
                        </div>

                        {/* Saved Naap Preview */}
                        {primaryNaap && primaryNaap.measurements ? (
                          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-extrabold uppercase text-amber-900 flex items-center gap-1">
                                <Ruler className="w-3.5 h-3.5" />
                                Saved Naap ({primaryNaap.category})
                              </span>
                              {primaryNaap.style_preferences?.collar_type && (
                                <span className="text-[11px] font-semibold text-amber-800">
                                  {primaryNaap.style_preferences.collar_type} •{" "}
                                  {primaryNaap.style_preferences.daman_type}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                              {Object.entries(primaryNaap.measurements)
                                .slice(0, 10)
                                .map(([k, v]) =>
                                  v ? (
                                    <div
                                      key={k}
                                      className="bg-white px-2 py-1 rounded border border-amber-200/80 text-xs"
                                    >
                                      <span className="text-[10px] text-slate-500 block truncate">
                                        {MEASUREMENT_LABELS[k]?.split(" ")[0] ||
                                          k}
                                      </span>
                                      <strong className="text-slate-900">
                                        {v}&quot;
                                      </strong>
                                    </div>
                                  ) : null
                                )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 text-center">
                            No Naap saved yet — click &quot;Edit & Naap&quot; to enter measurements
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">
                          Total Orders: <strong>{cust.orders_count || 0}</strong>{" "}
                          • Billed:{" "}
                          <strong>
                            Rs. {Number(cust.total_billed || 0).toLocaleString()}
                          </strong>
                        </span>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsCustomerModalOpen(true);
                            }}
                            className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit & Naap
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPreselectedCustomerForOrder(cust.id);
                              setIsNewOrderOpen(true);
                            }}
                            className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm active:scale-95"
                          >
                            <Scissors className="w-3.5 h-3.5" />+ Book Order
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: STITCHING RATE CARD & PRICING HISTORY ================= */}
          {activeTab === "rates" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Form: Add or Update Monthly Garment Rate */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                    <Tags className="w-5 h-5 text-emerald-600" />
                    {editingGarment
                      ? `Update Rate: ${editingGarment.name}`
                      : "Manage Silai Rates (Monthly Price Entity)"}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Is mahine ka rate set karein ya kisi bhi suit ki silai price update karein. Har change ka mukammal History Log neeche save hoga.
                  </p>

                  <form onSubmit={handleSaveGarmentRate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Garment / Suit Type Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shalwar Kameez (Simple Silai)"
                        value={
                          editingGarment
                            ? editingGarment.name
                            : newGarmentForm.name
                        }
                        onChange={(e) =>
                          editingGarment
                            ? setEditingGarment({
                                ...editingGarment,
                                name: e.target.value,
                              })
                            : setNewGarmentForm({
                                ...newGarmentForm,
                                name: e.target.value,
                              })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Category
                        </label>
                        <select
                          value={
                            editingGarment
                              ? editingGarment.category
                              : newGarmentForm.category
                          }
                          onChange={(e) =>
                            editingGarment
                              ? setEditingGarment({
                                  ...editingGarment,
                                  category: e.target.value,
                                })
                              : setNewGarmentForm({
                                  ...newGarmentForm,
                                  category: e.target.value,
                                })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
                        >
                          <option value="Eastern">Eastern (Shalwar Kameez)</option>
                          <option value="Western">Western (Pant / Shirt)</option>
                          <option value="Formal">Formal (Coat / Waistcoat)</option>
                          <option value="Kids">Kids (Bachgana)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Effective Month / Season *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. October 2026"
                          value={
                            editingGarment
                              ? editingGarment.effective_month || "October 2026"
                              : newGarmentForm.effective_month
                          }
                          onChange={(e) =>
                            editingGarment
                              ? setEditingGarment({
                                  ...editingGarment,
                                  effective_month: e.target.value,
                                })
                              : setNewGarmentForm({
                                  ...newGarmentForm,
                                  effective_month: e.target.value,
                                })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-emerald-700 mb-1">
                          Current Silai Rate (Rs.) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={
                            editingGarment
                              ? editingGarment.base_price
                              : newGarmentForm.base_price
                          }
                          onChange={(e) =>
                            editingGarment
                              ? setEditingGarment({
                                  ...editingGarment,
                                  base_price: Number(e.target.value),
                                })
                              : setNewGarmentForm({
                                  ...newGarmentForm,
                                  base_price: e.target.value,
                                })
                          }
                          className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl text-sm font-black text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Urgent Extra (Rs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={
                            editingGarment
                              ? editingGarment.urgent_surcharge
                              : newGarmentForm.urgent_surcharge
                          }
                          onChange={(e) =>
                            editingGarment
                              ? setEditingGarment({
                                  ...editingGarment,
                                  urgent_surcharge: Number(e.target.value),
                                })
                              : setNewGarmentForm({
                                  ...newGarmentForm,
                                  urgent_surcharge: e.target.value,
                                })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Rate Change Note / Reason (For History Log)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly rate revision / Eid season rate"
                        value={newGarmentForm.notes}
                        onChange={(e) =>
                          setNewGarmentForm({
                            ...newGarmentForm,
                            notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {editingGarment && (
                        <button
                          type="button"
                          onClick={() => setEditingGarment(null)}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition"
                      >
                        {editingGarment
                          ? "Update Current Price & Log History"
                          : "+ Add New Garment Price"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Table: Current Active Stitching Rate Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        Current Active Stitching Rate Card ({garments.length} Types)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click &quot;Change Rate&quot; to update this month&apos;s price (automatically logs old & new rate)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                          <th className="py-3 px-4">Garment / Suit Type</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Effective Month</th>
                          <th className="py-3 px-4">Current Rate</th>
                          <th className="py-3 px-4">Urgent Extra</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {garments.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {g.name}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                {g.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                              {g.effective_month || "Current Standard Rate"}
                            </td>
                            <td className="py-3 px-4 font-black text-emerald-700 text-base">
                              Rs. {Number(g.base_price).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-xs text-amber-700 font-bold">
                              + Rs. {Number(g.urgent_surcharge).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGarment({
                                    ...g,
                                    effective_month:
                                      g.effective_month || "October 2026",
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition"
                              >
                                Change Rate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Complete Price Change History Log */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-amber-600" />
                      Silai Rate Change History Log (Purane aur Naye Rates ka Record)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kis mahine mein kis suit ka rate kitna tha aur kis user ne update kiya
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Garment Type</th>
                        <th className="py-3 px-4">Effective Month</th>
                        <th className="py-3 px-4">Old Rate</th>
                        <th className="py-3 px-4">New Rate</th>
                        <th className="py-3 px-4">Updated By User</th>
                        <th className="py-3 px-4">Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rateHistory.map((rh) => (
                        <tr key={rh.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {formatDateTime(rh.changed_at)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {rh.garment_name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              {rh.effective_month}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 line-through">
                            {rh.old_price !== null
                              ? `Rs. ${Number(rh.old_price).toLocaleString()}`
                              : "Initial"}
                          </td>
                          <td className="py-3 px-4 font-black text-emerald-700">
                            Rs. {Number(rh.new_price).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-700">
                            {rh.changed_by}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {rh.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: UDHAAR & KHATA LEDGER ================= */}
          {activeTab === "ledger" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Record Khata / Udhaar Wasooli Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Customer Udhaar / Khata Entry
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Kisi bhi customer se purana Udhaar wasool karein, ya Advance Credit jama karein
                </p>

                <form onSubmit={handleSaveKhataEntry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Select Customer *
                    </label>
                    <select
                      required
                      value={khataForm.customer_id}
                      onChange={(e) =>
                        setKhataForm({
                          ...khataForm,
                          customer_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-bold"
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.customer_code}) —{" "}
                          {Number(c.current_balance) > 0
                            ? `Udhaar Rs. ${Number(
                                c.current_balance
                              ).toLocaleString()}`
                            : Number(c.current_balance) < 0
                            ? `Credit Rs. ${Math.abs(
                                Number(c.current_balance)
                              ).toLocaleString()}`
                            : "Rs. 0"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Transaction Type
                    </label>
                    <select
                      value={khataForm.entry_type}
                      onChange={(e) =>
                        setKhataForm({
                          ...khataForm,
                          entry_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                    >
                      <option value="UDHAAR_RECOVERY">
                        Udhaar Wasooli (Customer Paid Pending Balance)
                      </option>
                      <option value="CREDIT_DEPOSIT">
                        Advance Credit Jama (Customer Paid Advance)
                      </option>
                      <option value="DISCOUNT_WAIVER">
                        Special Discount / Balance Chhoot
                      </option>
                      <option value="UDHAAR_ADDED">
                        Add Manual Udhaar Charge (Debit Customer)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-emerald-700 mb-1">
                        Amount (Rs.) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 1500"
                        value={khataForm.amount}
                        onChange={(e) =>
                          setKhataForm({ ...khataForm, amount: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl text-sm font-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={khataForm.payment_method}
                        onChange={(e) =>
                          setKhataForm({
                            ...khataForm,
                            payment_method: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                      >
                        <option value="Cash">Cash (Naqad)</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Description / Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cash received at shop counter"
                      value={khataForm.description}
                      onChange={(e) =>
                        setKhataForm({
                          ...khataForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition"
                  >
                    Save Khata Entry & Update Customer Balance
                  </button>
                </form>
              </div>

              {/* Ledger History Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Complete Payments & Udhaar Khata Statement
                    </h3>
                    <p className="text-xs text-slate-500">
                      Every Order Bill, Advance Bayana, Delivery Cash & Udhaar Recovery with User tracking
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-lg">
                      Total Receivable Udhaar: Rs.{" "}
                      {totalMarketUdhaar.toLocaleString()}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg">
                      Customer Credit: Rs.{" "}
                      {totalCustomerCredit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* MOBILE VIEW: Clean statement cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {ledger.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs font-bold">
                      Koi khata entry nahi mili.
                    </div>
                  ) : (
                    ledger.map((entry) => {
                      const isDebit =
                        entry.entry_type === "ORDER_BILL" ||
                        entry.entry_type === "UDHAAR_ADDED";
                      return (
                        <div key={entry.id} className="p-4 space-y-2 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-xs text-slate-900 block">
                                {entry.customer_name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {entry.customer_phone} • {formatDate(entry.created_at)}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-black ${
                                isDebit ? "text-slate-900" : "text-emerald-700"
                              }`}
                            >
                              {isDebit ? "+" : "-"} Rs.{" "}
                              {Number(entry.amount).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                                isDebit
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {entry.entry_type.replace(/_/g, " ")} ({entry.payment_method})
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              #{entry.receipt_number}
                            </span>
                          </div>

                          {entry.description && (
                            <p className="text-[11px] text-slate-500 italic">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* DESKTOP VIEW: High Capacity Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Receipt # & Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Type & Description</th>
                        <th className="py-3 px-4">Recorded By</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {ledger.map((entry) => {
                        const isDebit =
                          entry.entry_type === "ORDER_BILL" ||
                          entry.entry_type === "UDHAAR_ADDED";
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-xs text-slate-900 block">
                                {entry.receipt_number}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {formatDate(entry.created_at)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 text-xs">
                                {entry.customer_name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {entry.customer_phone}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded uppercase mb-0.5 ${
                                  isDebit
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {entry.entry_type.replace(/_/g, " ")} (
                                {entry.payment_method})
                              </span>
                              <p className="text-xs text-slate-600">
                                {entry.description}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                              {entry.created_by || "Admin"}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-black ${
                                isDebit ? "text-slate-900" : "text-emerald-700"
                              }`}
                            >
                              {isDebit ? "+" : "-"} Rs.{" "}
                              {Number(entry.amount).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: REPORTS, MONTHLY SALES & HISTORY LOGS ================= */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* 1. Monthly Sales Report (Current Month vs Purani Sale) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      Monthly Sales Report (Is Mahine ki Sale vs Purani Sale)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Compare current month orders, suits stitched, total billing, cash collected & pending balance with previous months
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3.5 px-4">Month / Period</th>
                        <th className="py-3.5 px-4">Total Orders</th>
                        <th className="py-3.5 px-4">Suits Stitched</th>
                        <th className="py-3.5 px-4">Total Billed Sale</th>
                        <th className="py-3.5 px-4">Cash Collected</th>
                        <th className="py-3.5 px-4">Pending Order Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {monthlySales.map((m, idx) => (
                        <tr key={m.month_key} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                            {m.month_label}
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                                idx === 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {idx === 0 ? "Current Month" : "Purani Sale"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {m.total_orders} Orders
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-700">
                            {m.total_suits} Suits
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 text-base">
                            Rs. {Number(m.total_sale).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            Rs. {Number(m.total_collected).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-red-600">
                            Rs. {Number(m.pending_balance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. User-wise Performance & Garment-wise Sales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User-wise Sales & Cash Collection */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      User-wise Sale & Collection Report (Kis User se Kitna Kaam Hua)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Orders booked, billing generated, and total cash collected by each staff user
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                          <th className="py-3 px-4">User / Staff Name</th>
                          <th className="py-3 px-4">Orders Booked</th>
                          <th className="py-3 px-4">Total Sale Booked</th>
                          <th className="py-3 px-4">Total Cash Collected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {userSales.map((u, i) => {
                          const cashMatch = userCash.find(
                            (c) => c.user_name === u.user_name
                          );
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {u.user_name}
                              </td>
                              <td className="py-3 px-4 font-semibold">
                                {u.orders_booked} Orders
                              </td>
                              <td className="py-3 px-4 font-black text-slate-900">
                                Rs.{" "}
                                {Number(u.total_sale_booked).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-700">
                                Rs.{" "}
                                {Number(
                                  cashMatch?.total_cash_collected ||
                                    u.order_payments_received ||
                                    0
                                ).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Garment-wise Sales Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-emerald-600" />
                      Garment Type Sales Breakdown (Suit Type Revenue)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total quantity stitched and revenue earned by garment category
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                          <th className="py-3 px-4">Suit / Garment Type</th>
                          <th className="py-3 px-4">Qty Stitched</th>
                          <th className="py-3 px-4">Avg Rate</th>
                          <th className="py-3 px-4 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {garmentSales.map((gs, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {gs.garment_name}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              {gs.total_qty} Suits
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              Rs. {Number(gs.avg_rate).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700">
                              Rs. {Number(gs.total_revenue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 3. Complete Customer Balance Summary Sheet */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-red-600" />
                      Complete Customer Balance & Udhaar Sheet
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customer-wise total billing, total payments received, and current net Udhaar / Advance Credit balance
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Customer & Code</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Total Orders</th>
                        <th className="py-3 px-4">Total Billed</th>
                        <th className="py-3 px-4">Net Khata Status</th>
                        <th className="py-3 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {customers.map((c) => {
                        const bal = Number(c.current_balance || 0);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {c.full_name}{" "}
                              <span className="text-xs font-mono text-slate-500">
                                ({c.customer_code})
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              {c.phone}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              {c.orders_count || 0}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              Rs. {Number(c.total_billed || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                  bal > 0
                                    ? "bg-red-100 text-red-700"
                                    : bal < 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {bal > 0
                                  ? `Udhaar Receivable: Rs. ${bal.toLocaleString()}`
                                  : bal < 0
                                  ? `Advance Credit: Rs. ${Math.abs(
                                      bal
                                    ).toLocaleString()}`
                                  : "Rs. 0 (Clear)"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setKhataForm((prev) => ({
                                    ...prev,
                                    customer_id: String(c.id),
                                    amount: bal > 0 ? String(bal) : "",
                                  }));
                                  setActiveTab("ledger");
                                }}
                                className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-emerald-600 transition"
                              >
                                Update Balance
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Complete System Activity & History Log (audit_logs) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-600" />
                    Complete System History & Activity Log (Har Action ka Record)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological audit trail of every Customer, Naap, Order, Delivery, Payment, Rate Change & Shop update
                  </p>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 sticky top-0">
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3 px-4">Action & Details</th>
                        <th className="py-3 px-4">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                              {log.entity_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                            {log.entity_ref}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 text-xs">
                              {log.action_title}
                            </p>
                            <p className="text-xs text-slate-600">
                              {log.details}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-emerald-700">
                            {log.performed_by}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: MULTI-SHOP BRANCHES (WITH DEACTIVATE & DELETE) ================= */}
          {activeTab === "shops" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                  <Store className="w-5 h-5 text-emerald-600" />
                  {editingShop
                    ? `Edit Shop: ${editingShop.name}`
                    : "Add / Manage Tailor Shop Branch"}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Agar aapki sirf 1 shop hai to aap doosri branch ko <strong>Deactivate</strong> ya <strong>Delete</strong> kar sakte hain — system automatically sirf aapki 1 active branch use karega.
                </p>

                <form onSubmit={handleSaveShop} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Shop / Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Tailors (Main Shop)"
                      value={editingShop ? editingShop.name : shopForm.name}
                      onChange={(e) =>
                        editingShop
                          ? setEditingShop({
                              ...editingShop,
                              name: e.target.value,
                            })
                          : setShopForm({ ...shopForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Branch Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MAIN-01"
                        value={
                          editingShop
                            ? editingShop.branch_code
                            : shopForm.branch_code
                        }
                        onChange={(e) =>
                          editingShop
                            ? setEditingShop({
                                ...editingShop,
                                branch_code: e.target.value,
                              })
                            : setShopForm({
                                ...shopForm,
                                branch_code: e.target.value,
                              })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="0300-1234567"
                        value={editingShop ? editingShop.phone : shopForm.phone}
                        onChange={(e) =>
                          editingShop
                            ? setEditingShop({
                                ...editingShop,
                                phone: e.target.value,
                              })
                            : setShopForm({
                                ...shopForm,
                                phone: e.target.value,
                              })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Shop Address (Printed on Parchi)
                    </label>
                    <input
                      type="text"
                      placeholder="Shop #, Market, City"
                      value={
                        editingShop ? editingShop.address : shopForm.address
                      }
                      onChange={(e) =>
                        editingShop
                          ? setEditingShop({
                              ...editingShop,
                              address: e.target.value,
                            })
                          : setShopForm({
                              ...shopForm,
                              address: e.target.value,
                            })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Receipt / Parchi Footer Message
                    </label>
                    <textarea
                      rows={2}
                      value={
                        editingShop
                          ? editingShop.receipt_footer
                          : shopForm.receipt_footer
                      }
                      onChange={(e) =>
                        editingShop
                          ? setEditingShop({
                              ...editingShop,
                              receipt_footer: e.target.value,
                            })
                          : setShopForm({
                              ...shopForm,
                              receipt_footer: e.target.value,
                            })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex gap-2">
                    {editingShop && (
                      <button
                        type="button"
                        onClick={() => setEditingShop(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
                    >
                      {editingShop ? "Save Shop Changes" : "+ Create New Shop"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {shops.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-2xl border shadow-sm p-6 flex flex-wrap items-center justify-between gap-4 transition ${
                      s.is_active
                        ? "bg-white border-slate-200"
                        : "bg-slate-100 border-slate-300 opacity-75"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-lg text-slate-900">
                          {s.name}
                        </h4>
                        <span className="bg-slate-200 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                          {s.branch_code}
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                            s.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.is_active ? "● Active Branch" : "○ Deactivated"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Address: <strong>{s.address || "—"}</strong> • Phone:{" "}
                        <strong>{s.phone || "—"}</strong>
                      </p>
                      <p className="text-xs text-slate-500 italic">
                        Parchi Footer: &quot;{s.receipt_footer}&quot;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right mr-2">
                        <span className="text-xs text-slate-500 block">
                          Orders: <strong>{s.total_orders || 0}</strong> |
                          Customers: <strong>{s.total_customers || 0}</strong>
                        </span>
                        <span className="text-base font-black text-emerald-700">
                          Rs. {Number(s.total_revenue || 0).toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingShop(s)}
                        className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleShopActive(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          s.is_active
                            ? "bg-amber-100 hover:bg-amber-200 text-amber-900"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>

                      {shops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteShop(s)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition"
                          title="Delete Shop Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 8: USERS & PASSWORD SETTINGS ================= */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Current User Password & Username */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  Change Your Login Username & Password
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Yeh credentials PostgreSQL ke <code>users</code> table mein save hain. Aap apni marzi ka naya username aur password rakh sakte hain.
                </p>

                <form onSubmit={handleUpdateCredentials} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={pwdForm.fullName}
                      onChange={(e) =>
                        setPwdForm({ ...pwdForm, fullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={pwdForm.newUsername}
                      onChange={(e) =>
                        setPwdForm({ ...pwdForm, newUsername: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-emerald-700 mb-1">
                      New Login Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter new password..."
                      value={pwdForm.newPassword}
                      onChange={(e) =>
                        setPwdForm({ ...pwdForm, newPassword: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border-2 border-emerald-500 rounded-xl text-sm font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition"
                  >
                    Update Username & Password in Database
                  </button>
                </form>
              </div>

              {/* Add Additional Staff Users & View Users Table */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Add New Shop Manager / Master Tailor Login
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Create separate login accounts for your staff — their orders and cash collections will show in User-wise Reports
                  </p>

                  <form onSubmit={handleCreateStaffUser} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Master Nadeem"
                          value={newStaffForm.fullName}
                          onChange={(e) =>
                            setNewStaffForm({
                              ...newStaffForm,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Shop Branch
                        </label>
                        <select
                          value={newStaffForm.shopId}
                          onChange={(e) =>
                            setNewStaffForm({
                              ...newStaffForm,
                              shopId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                        >
                          {shops.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Username *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. nadeem"
                          value={newStaffForm.username}
                          onChange={(e) =>
                            setNewStaffForm({
                              ...newStaffForm,
                              username: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 123456"
                          value={newStaffForm.password}
                          onChange={(e) =>
                            setNewStaffForm({
                              ...newStaffForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs"
                    >
                      + Create User Account in PostgreSQL
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h4 className="font-bold text-xs uppercase text-slate-500 mb-3">
                    Registered Users in PostgreSQL (<code>users</code> table)
                  </h4>
                  <div className="space-y-2">
                    {allUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div>
                          <strong className="text-slate-900">
                            {u.full_name}
                          </strong>{" "}
                          <span className="font-mono text-emerald-700 font-bold">
                            (@{u.username})
                          </span>
                          <p className="text-slate-500">
                            {u.shop_name || "All Shops"}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Database Backup & Disaster Recovery Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        1-Click Database Backup (.sql)
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Aapka poora live Neon Cloud PostgreSQL database (Orders, Customers, Naap Book, Udhaar Khata, Rates, Audit Logs) ek standard <code>.sql</code> file format mein seedha aapke laptop / mobile mein download ho jayega.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(false)}
                          disabled={isBackingUp}
                          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
                        >
                          <Download className={`w-4 h-4 ${isBackingUp ? "animate-bounce" : ""}`} />
                          <span>{isBackingUp ? "Generating & Downloading Backup..." : "Download Live Database Backup Now"}</span>
                        </button>
                        <span className="text-[11px] text-slate-500 font-bold">
                          Daily reminder har subah automatically notification dega
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly for smartphone screens) */}
        <nav className="no-print lg:hidden sticky bottom-0 z-40 bg-white border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            {
              id: "orders",
              label: "Orders",
              icon: FileText,
              badge: orders.filter((o) => o.status !== "Delivered").length,
            },
            { id: "customers", label: "Customers", icon: Users },
            { id: "ledger", label: "Khata", icon: Wallet },
            { id: "reports", label: "Reports", icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative ${
                  isActive
                    ? "text-emerald-700 font-extrabold"
                    : "text-slate-500 font-medium hover:text-slate-800"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600 scale-110" : "text-slate-500"} transition`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black px-1 rounded-full min-w-3.5 h-3.5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MODALS */}
      <ParchiModal order={parchiOrder} onClose={() => setParchiOrder(null)} />

      <DeliverOrderModal
        order={deliverOrder}
        currentUserName={currentUser?.full_name}
        onClose={() => setDeliverOrder(null)}
        onSuccess={() => {
          showToast("Order Delivery & Payment updated successfully!");
          fetchAllData();
        }}
      />

      {complaintOrder && (
        <ComplaintModal
          order={complaintOrder}
          actorName={currentUser?.full_name || "Master Anas (Owner / Admin)"}
          onClose={() => setComplaintOrder(null)}
          onSuccess={async (msg) => {
            showToast(msg);
            await fetchAllData();
          }}
        />
      )}

      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        customers={customers}
        garments={garments}
        shops={shops}
        selectedShopId={selectedShopId}
        preselectedCustomerId={preselectedCustomerForOrder}
        currentUserName={currentUser?.full_name}
        onOrderCreated={(createdOrder) => {
          showToast(
            `Order #${createdOrder.order_number} booked! Opening Parchi Receipt...`
          );
          fetchAllData();
          setParchiOrder(createdOrder);
        }}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={editingCustomer}
        shops={shops}
        currentUserName={currentUser?.full_name}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaved={() => {
          showToast("Customer & Permanent Naap Book saved!");
          fetchAllData();
        }}
      />
    </div>
  );
}
