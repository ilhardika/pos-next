"use client";

import { useState, useEffect } from "react";
import {
  fetchProductsAction,
  deleteProductAction,
} from "@/app/actions/products";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Package,
  AlertTriangle,
  Plus,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  category: string;
  barcode: string;
  unit: string;
  is_active: boolean;
  created_at: string;
}

interface ProductListProps {
  onEdit: (product: Product) => void;
  refreshTrigger: number;
  onAddProduct: () => void;
}

export default function ProductList({
  onEdit,
  refreshTrigger,
  onAddProduct,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Use server action to fetch products with user ID
      const result = await fetchProductsAction(user?.id);

      if (result.success) {
        // Filter only active products for display
        const activeProducts = (result.data || []).filter((p) => p.is_active);
        setProducts(activeProducts);
      } else {
        console.error("Error fetching products:", result.error);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const handleDelete = async (product: Product) => {
    try {
      // Use server action to delete product
      const result = await deleteProductAction(product.id);

      if (result.success) {
        // Refresh the list
        fetchProducts();
        setDeleteProduct(null);
        toast.success(`Produk "${product.name}" berhasil dihapus`);
      } else {
        console.error("Error deleting product:", result.error);
        toast.error("Gagal menghapus produk: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan saat menghapus produk");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return { label: "Habis", variant: "destructive" as const };
    } else if (stock <= minStock) {
      return {
        label: "Stok Rendah",
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    } else {
      return {
        label: "Tersedia",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-300",
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center justify-between space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="border rounded-lg p-8">
          <Loading size="lg" text="Memuat produk..." />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchTerm ? "Produk tidak ditemukan" : "Belum ada produk"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm
              ? "Coba kata kunci lain atau tambah produk baru."
              : "Mulai dengan menambahkan produk pertama Anda."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(
                  product.stock_quantity,
                  product.min_stock_level
                );
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-muted-foreground">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(product.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Modal: {formatCurrency(product.cost)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>
                          {product.stock_quantity} {product.unit}
                        </span>
                        {product.stock_quantity <= product.min_stock_level && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={stockStatus.variant}
                        className={stockStatus.className}
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteProduct(product)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk &quot;
              {deleteProduct?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProduct && handleDelete(deleteProduct)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
