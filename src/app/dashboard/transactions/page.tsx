"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Package, Check } from "lucide-react";
import { fetchProductsAction } from "@/app/actions/products";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import CartModal from "@/components/pos/CartModal";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  unit: string;
  is_active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const loadProducts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await fetchProductsAction(user.id);
      if (result.success && result.data) {
        const activeProducts = result.data.filter(
          (p) => p.is_active && p.stock_quantity > 0
        );
        setProducts(activeProducts);
        setFilteredProducts(activeProducts);
      } else {
        toast.error(result.error || "Gagal memuat produk");
      }
    } catch {
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id, loadProducts]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error(`Stok ${product.name} tidak mencukupi`);
        return;
      }
      const newQuantity = existingItem.quantity + 1;
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: item.product.price * newQuantity,
              }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        subtotal: product.price,
      };
      setCart([...cart, newItem]);
      toast.success(`${product.name} ditambahkan ke keranjang`);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartQuantity = (productId: string) => {
    const cartItem = cart.find((item) => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Kasir POS</h1>
          <p className="text-sm text-muted-foreground">
            Pilih produk untuk menambahkan ke keranjang
          </p>
        </div>
        <Button
          variant={cart.length > 0 ? "default" : "outline"}
          size="lg"
          onClick={() => setShowMobileCart(true)}
          className="relative"
        >
          <ShoppingCart className="h-5 w-5" />
          {cart.length > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white border-0"
            >
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Cari produk berdasarkan nama atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {authLoading || loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4 p-2">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 lg:p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "Produk tidak ditemukan" : "Tidak ada produk"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Coba kata kunci lain"
                : "Tambahkan produk terlebih dahulu"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4 p-2">
            {filteredProducts.map((product) => {
              const cartQuantity = getCartQuantity(product.id);
              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all relative ${
                    cartQuantity > 0
                      ? "ring-2 ring-primary bg-primary/5 shadow-md"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 lg:p-4">
                    {cartQuantity > 0 && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge
                          variant="default"
                          className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                        >
                          {cartQuantity}
                        </Badge>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-xs lg:text-sm line-clamp-2 pr-2">
                        {product.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {product.stock_quantity}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">
                      {product.category}
                    </p>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary text-xs lg:text-sm">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{product.unit}
                      </span>
                    </div>

                    {cartQuantity > 0 && (
                      <div className="mt-2 text-xs text-primary font-medium flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Dalam keranjang
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CartModal
        isOpen={showMobileCart}
        onClose={() => setShowMobileCart(false)}
        cart={cart}
        onUpdateCart={setCart}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}
