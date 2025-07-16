"use client";

import { useState, useEffect } from "react";
import { fetchProductsAction } from "@/app/actions/products";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardLoading } from "@/components/ui/loading";
import {
  Package,
  DollarSign,
  AlertTriangle,
  Tag,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockCount: 0,
    categoryCount: 0,
    stockValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Get products using server action with user ID
        const result = await fetchProductsAction(user?.id);

        if (!result.success) {
          console.error("Error fetching products:", result.error);
          // If fetch fails, set empty stats
          setStats({
            totalProducts: 0,
            activeProducts: 0,
            lowStockCount: 0,
            categoryCount: 0,
            stockValue: 0,
          });
          return;
        }

        const products = result.data;

        // Calculate stats
        const activeProducts = products?.filter((p) => p.is_active) || [];

        // Low stock: products with stock_quantity <= min_stock_level (default min_stock_level = 5 if not set)
        const lowStock =
          products?.filter((p) => {
            const minStock = p.min_stock_level || 5;
            return p.is_active && (p.stock_quantity || 0) <= minStock;
          }) || [];

        // Get unique categories from active products only
        const categories = [
          ...new Set(
            products
              ?.filter((p) => p.is_active && p.category)
              .map((p) => p.category.trim())
              .filter((cat) => cat && cat.length > 0)
          ),
        ];

        // Calculate total stock value (price * stock_quantity for active products)
        const stockValue =
          products
            ?.filter((p) => p.is_active)
            .reduce((total, product) => {
              return (
                total +
                (parseFloat(product.price) || 0) * (product.stock_quantity || 0)
              );
            }, 0) || 0;

        setStats({
          totalProducts: products?.length || 0,
          activeProducts: activeProducts.length,
          lowStockCount: lowStock.length,
          categoryCount: categories.length,
          stockValue: stockValue,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali! Berikut ringkasan toko Anda hari ini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProducts} Produk aktif
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">Perlu restock</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.categoryCount}</div>
                <p className="text-xs text-muted-foreground">Kategori produk</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Stok</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.stockValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total nilai inventaris
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Dashboard diakses
                  </p>
                  <p className="text-sm text-muted-foreground">Baru saja</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status Toko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Aktif
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Jam Operasional</span>
                <span className="text-sm text-muted-foreground">
                  08:00 - 22:00
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sistem</span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
