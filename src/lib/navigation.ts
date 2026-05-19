import {
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "POS Billing", href: "/pos", icon: CreditCard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Offers", href: "/admin/offers", icon: ReceiptText },
  { label: "Staff", href: "/admin/staff", icon: Users },
  { label: "Commission", href: "/admin/commission", icon: HandCoins },
  { label: "Expenses", href: "/expenses", icon: ClipboardList },
  { label: "Settlements", href: "/settlements", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Audit Logs", href: "/audit", icon: ShieldCheck },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;
