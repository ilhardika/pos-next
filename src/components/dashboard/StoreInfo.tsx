"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Users, Package, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getStoreStats } from "@/lib/stores";

interface StoreStats {
  productCount: number;
  todayTransactions: number;
  todayRevenue: number;
  staffCount: number;
}

export function StoreInfo() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<StoreStats>({
    productCount: 0,
    todayTransactions: 0,
    todayRevenue: 0,
    staffCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (profile?.store_id) {
        try {
          const storeStats = await getStoreStats(profile.store_id);
          setStats(storeStats);
        } catch (error) {
          console.error("Error fetching store stats:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.store_id]);

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informasi Toko
          </CardTitle>
          <CardDescription>Memuat informasi toko...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-xl">{profile.store_name}</CardTitle>
                <CardDescription>
                  Pemilik: {profile.full_name} • Peran: {"  "}
                  <Badge
                    variant={profile.role === "owner" ? "default" : "secondary"}
                    className={
                      profile.role === "owner"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }
                  >
                    {profile.role}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-green-600 border-green-600"
            >
              Aktif
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-medium">Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.productCount}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Produk aktif dalam inventori
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-medium">
              Penjualan Hari Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.todayTransactions}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Transaksi selesai hari ini
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-medium">
              Pendapatan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Total pendapatan hari ini
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-medium">Staf</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.staffCount}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Anggota tim aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Alat Bantu</CardTitle>
          <CardDescription>
            Tugas umum untuk mengelola toko Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-center">
              <Package className="h-6 w-6 mb-2 text-primary mx-auto" />
              <h3 className="font-medium">Kelola Produk</h3>
              <p className="text-sm text-muted-foreground">
                Tambah, edit, atau hapus produk dari inventori Anda
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-center">
              <TrendingUp className="h-6 w-6 mb-2 text-primary mx-auto" />
              <h3 className="font-medium">Proses Penjualan</h3>
              <p className="text-sm text-muted-foreground">
                Mulai transaksi baru di point of sale
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-center">
              <Users className="h-6 w-6 mb-2 text-primary mx-auto" />
              <h3 className="font-medium">Kelola Staf</h3>
              <p className="text-sm text-muted-foreground">
                Undang kasir dan kelola izin tim
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
