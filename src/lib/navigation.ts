import {
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  Menu,
  PackageOpen,
  ReceiptText,
  Settings,
  Store,
} from "lucide-react";

export const adminNavigation = [
  { label: "Billing", href: "/", icon: CreditCard, permission: "dashboard.view" },
  { label: "Inventory", href: "/admin/products", icon: PackageOpen, permission: "products.manage" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports.view" },
  { label: "Expenses", href: "/expenses", icon: ClipboardList, permission: "expenses.manage" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
] as const;

export const billmanNavigation = [
  { label: "Billing", href: "/", icon: Home, permission: "pos.create" },
  { label: "New Bill", href: "/tables/new", icon: CreditCard, permission: "pos.create" },
  { label: "Invoices", href: "/invoices/customer", icon: ReceiptText, permission: "pos.create" },
] as const;

export const navigation = adminNavigation;

export const headerIcons = { Bell, LogOut, Menu, Store };
