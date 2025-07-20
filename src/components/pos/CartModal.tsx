"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createTransactionAction } from "@/app/actions/transactions";
import { useAuth } from "@/hooks/useAuth";

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

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  onClearCart: () => void;
}

export default function CartModal({
  isOpen,
  onClose,
  cart,
  onUpdateCart,
  onClearCart,
}: CartModalProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [cashAmount, setCashAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.product.id === productId
        ? {
            ...item,
            quantity: newQuantity,
            subtotal: item.product.price * newQuantity,
          }
        : item
    );
    onUpdateCart(updatedCart);
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    onUpdateCart(updatedCart);
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    setShowPaymentDialog(true);
  };

  const confirmPayment = async () => {
    console.log("💳 Confirm payment clicked");

    if (!user?.id) {
      toast.error("Anda harus login terlebih dahulu");
      return;
    }

    if (!paymentMethod) {
      toast.error("Pilih metode pembayaran");
      return;
    }

    if (paymentMethod === "cash" && !cashAmount) {
      toast.error("Masukkan jumlah uang tunai");
      return;
    }

    const totalAmount = getTotalAmount();
    const cashAmountNum = parseFloat(cashAmount) || 0;

    if (paymentMethod === "cash" && cashAmountNum < totalAmount) {
      toast.error("Jumlah uang tidak mencukupi");
      return;
    }

    console.log("✅ Payment validation passed, processing...");
    setProcessing(true);
    try {
      // Prepare transaction data
      const transactionData = {
        user_id: user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === "cash" ? cashAmountNum : undefined,
        change_amount:
          paymentMethod === "cash" && cashAmountNum > totalAmount
            ? cashAmountNum - totalAmount
            : undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal,
        })),
      };

      // Create transaction
      console.log("🛒 Sending transaction data:", transactionData);
      console.log("🔄 About to call createTransactionAction...");

      const result = await createTransactionAction(transactionData);

      console.log("📋 Transaction result received:", result);
      console.log("📋 Result type:", typeof result);
      console.log("📋 Result keys:", Object.keys(result || {}));

      if (!result.success) {
        console.error("❌ Transaction failed:", result.error);
        toast.error(result.error || "Gagal memproses pembayaran");
        return;
      }

      console.log("🎉 Transaction successful!");
      toast.success("Pembayaran berhasil!");

      // Show change amount if cash payment
      if (paymentMethod === "cash" && cashAmountNum > totalAmount) {
        const change = cashAmountNum - totalAmount;
        toast.info(`Kembalian: Rp ${change.toLocaleString("id-ID")}`);
      }

      // Show transaction number
      toast.info(`No. Transaksi: ${result.data?.transaction_number}`);

      // Reset everything
      onClearCart();
      setShowPaymentDialog(false);
      setPaymentMethod("");
      setCashAmount("");
      onClose();

      console.log("✅ Transaction completed, cart cleared, modal closed");

      // Auto refresh page after successful transaction to update stock display
      setTimeout(() => {
        console.log("🔄 Auto refreshing page to update stock...");
        window.location.reload();
      }, 2000); // Wait 2 seconds to let user see the success messages
    } catch (error) {
      console.error("❌ Payment error:", error);
      toast.error("Gagal memproses pembayaran");
    } finally {
      console.log("🔄 Payment processing finished");
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Cart Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang Belanja ({getTotalItems()} item)
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Keranjang Kosong</h3>
                <p className="text-muted-foreground text-sm">
                  Pilih produk untuk memulai transaksi
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Rp {item.product.price.toLocaleString("id-ID")} /{" "}
                        {item.product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stok: {item.product.stock_quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-12 text-center">
                        <span className="text-sm font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          if (item.quantity < item.product.stock_quantity) {
                            updateQuantity(item.product.id, item.quantity + 1);
                          } else {
                            toast.error(
                              `Stok ${item.product.name} tidak mencukupi`
                            );
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right min-w-0">
                      <p className="font-semibold text-sm">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive mt-1"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({getTotalItems()} item):</span>
                  <span>Rp {getTotalAmount().toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pajak (0%):</span>
                  <span>Rp 0</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">
                    Rp {getTotalAmount().toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClearCart}
                >
                  Kosongkan
                </Button>
                <Button className="flex-1" size="lg" onClick={handlePayment}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Bayar Sekarang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Pembayaran:</span>
                <span className="text-xl font-bold text-primary">
                  Rp {getTotalAmount().toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center">
                      <Banknote className="mr-2 h-4 w-4" />
                      Tunai
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Kartu Debit/Kredit
                    </div>
                  </SelectItem>
                  <SelectItem value="digital_wallet">
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Dompet Digital
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label htmlFor="cash-amount">Jumlah Uang Tunai</Label>
                <Input
                  id="cash-amount"
                  type="number"
                  placeholder="Masukkan jumlah uang"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                {cashAmount && parseFloat(cashAmount) > getTotalAmount() && (
                  <p className="text-sm text-green-600 font-medium">
                    Kembalian: Rp{" "}
                    {(parseFloat(cashAmount) - getTotalAmount()).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <h4 className="font-medium text-sm">Ringkasan Pesanan</h4>
              <div className="space-y-1 max-h-32 overflow-auto">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="truncate">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>Rp {getTotalAmount().toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentDialog(false)}
                disabled={processing}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={confirmPayment}
                disabled={processing || !paymentMethod}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Konfirmasi Bayar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
