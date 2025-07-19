"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Store,
  Receipt,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[]; // Roles yang bisa akses menu ini
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "cashier"],
  },
  {
    title: "Produk",
    href: "/dashboard/products",
    icon: Package,
    roles: ["owner", "cashier"],
  },
  {
    title: "Transaksi",
    href: "/dashboard/transactions",
    icon: ShoppingCart,
    badge: "New",
    roles: ["owner", "cashier"],
  },
  {
    title: "Penjualan",
    href: "/dashboard/sales",
    icon: Receipt,
    roles: ["owner", "cashier"],
  },
  {
    title: "Staff",
    href: "/dashboard/staff",
    icon: Users,
    roles: ["owner"], // Hanya owner yang bisa manage staff
  },
  {
    title: "Laporan",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["owner", "cashier"],
  },
  {
    title: "Analitik",
    href: "/dashboard/analytics",
    icon: TrendingUp,
    roles: ["owner"], // Hanya owner yang bisa lihat analytics
  },
  {
    title: "Pengaturan",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["owner", "cashier"],
  },
];

export default function DashboardSidebar({
  isOpen,
  onClose,
  userRole = "cashier",
}: DashboardSidebarProps) {
  const pathname = usePathname();

  // Filter menu berdasarkan role user
  const filteredNavItems = navItems.filter((item) =>
    item.roles?.includes(userRole)
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 transform bg-background border-r transition-transform duration-200 ease-in-out md:fixed md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">POS System</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    active && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {userRole === "owner" ? "Pemilik Toko" : "Kasir"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Akses {userRole === "owner" ? "Penuh" : "Terbatas"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
