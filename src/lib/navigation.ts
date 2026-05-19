import {
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  HandCoins,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageOpen,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
  Table2,
  Users,
  UserCircle,
} from "lucide-react";

export const adminNavigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "POS Billing", href: "/pos", icon: CreditCard, permission: "pos.create" },
  { label: "Active Tables", href: "/tables", icon: Table2, permission: "pos.create" },
  { label: "Inventory", href: "/admin/products", icon: PackageOpen, permission: "products.manage" },
  { label: "Products", href: "/admin/products", icon: Package, permission: "products.manage" },
  { label: "Offers", href: "/admin/offers", icon: ReceiptText, permission: "offers.manage" },
  { label: "Staff", href: "/admin/staff", icon: Users, permission: "staff.manage" },
  { label: "Commission", href: "/admin/commission", icon: HandCoins, permission: "commission.manage" },
  { label: "Tips", href: "/reports#tips", icon: HandCoins, permission: "reports.view" },
  { label: "Advances", href: "/settlements#advances", icon: ClipboardList, permission: "settlements.manage" },
  { label: "Settlements", href: "/settlements", icon: FileText, permission: "settlements.manage" },
  { label: "Expenses", href: "/expenses", icon: ClipboardList, permission: "expenses.manage" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports.view" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
  { label: "Audit Logs", href: "/audit", icon: ShieldCheck, permission: "audit.view" },
] as const;

export const billmanNavigation = [
  { label: "Home / Active Tables", href: "/", icon: Home, permission: "pos.create" },
  { label: "New Bill", href: "/tables/new", icon: Table2, permission: "pos.create" },
  { label: "POS Billing", href: "/pos", icon: CreditCard, permission: "pos.create" },
  { label: "Customer Invoices", href: "/invoices/customer", icon: ReceiptText, permission: "pos.create" },
  { label: "Profile / Logout", href: "/profile", icon: UserCircle, permission: "pos.create" },
] as const;

export const navigation = adminNavigation;

export const headerIcons = { Bell, LogOut, Menu, Store };
