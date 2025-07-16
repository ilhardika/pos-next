"use client";

import { useState, useEffect } from "react";
import { fetchProductsAction } from "@/app/actions/products";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, AlertTriangle, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardLoading } from "@/components/ui/loading";
import dynamic from "next/dynamic";

const ProductForm = dynamic(() => import("@/components/products/ProductForm"), {
  loading: () => (
    <div className="p-6">
      <CardLoading />
    </div>
  ),
});

const ProductList = dynamic(() => import("@/components/products/ProductList"), {
  loading: () => (
    <div className="p-6">
      <CardLoading />
    </div>
  ),
});

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  categories: number;
  totalValue: number;
}

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    categories: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get products using server action with user ID
      const result = await fetchProductsAction(user?.id);

      if (!result.success) {
        console.error("Error fetching products:", result.error);
        setStats({
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          categories: 0,
          totalValue: 0,
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
        lowStockProducts: lowStock.length,
        categories: categories.length,
        totalValue: stockValue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editingProduct ? "Edit Produk" : "Tambah Produk"}
          </h1>
          <p className="text-muted-foreground">
            {editingProduct
              ? "Edit informasi produk"
              : "Tambahkan produk baru ke inventori Anda"}
          </p>
        </div>

        <ProductForm
          initialData={editingProduct}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produk</h1>
        <p className="text-muted-foreground">
          Kelola produk dan inventori toko Anda.
        </p>
      </div>

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
            <CardTitle className="text-sm font-medium">
              Stok Rendah/Habis
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.lowStockProducts}
                </div>
                <p className="text-xs text-muted-foreground">Perlu restock</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.categories}</div>
                <p className="text-xs text-muted-foreground">Kategori produk</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Stok</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoading />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total nilai inventori
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductList
            onEdit={handleEditProduct}
            refreshTrigger={refreshTrigger}
            onAddProduct={handleAddProduct}
          />
        </CardContent>
      </Card>
    </div>
  );
}
