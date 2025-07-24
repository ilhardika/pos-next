# Transaction Tools - POS Next.js Project

## Transaction Processing Tools

### 1. Transaction Manager

```typescript
// src/lib/transaction-manager.ts
import { supabase } from "./supabase";
import type { Database } from "./supabase";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionItem = Database["public"]["Tables"]["transaction_items"]["Row"];

export class TransactionManager {
  async createTransaction(data: {
    cashier_id: string;
    store_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
      price: number;
    }>;
    payment_method: string;
    cash_amount?: number;
  }) {
    try {
      // Calculate totals
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax_amount = 0; // Can be configured per store
      const discount_amount = 0; // Can be applied from UI
      const total_amount = subtotal + tax_amount - discount_amount;

      // Validate payment
      if (
        data.payment_method === "cash" &&
        data.cash_amount &&
        data.cash_amount < total_amount
      ) {
        return { success: false, error: "Jumlah uang tunai tidak mencukupi" };
      }

      const change_amount =
        data.payment_method === "cash" && data.cash_amount
          ? data.cash_amount - total_amount
          : 0;

      // Generate transaction number
      const transaction_number = `TRX-${Date.now()}`;

      // Start database transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          store_id: data.store_id,
          cashier_id: data.cashier_id,
          transaction_number,
          total_amount,
          tax_amount,
          discount_amount,
          payment_method: data.payment_method,
          cash_amount: data.cash_amount || null,
          change_amount,
          payment_status: "completed",
          notes: data.cash_amount
            ? `Tunai: ${this.formatCurrency(
                data.cash_amount
              )}, Kembalian: ${this.formatCurrency(change_amount)}`
            : null,
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error(
          `Transaction creation failed: ${transactionError.message}`
        );
      }

      // Insert transaction items
      const transactionItems = data.items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(transactionItems);

      if (itemsError) {
        // Rollback transaction
        await supabase.from("transactions").delete().eq("id", transaction.id);
        throw new Error(
          `Transaction items creation failed: ${itemsError.message}`
        );
      }

      // Update product stock
      for (const item of data.items) {
        const { error: stockError } = await supabase.rpc(
          "update_product_stock",
          {
            product_uuid: item.product_id,
            quantity_sold: item.quantity,
          }
        );

        if (stockError) {
          console.error(
            `Stock update failed for product ${item.product_id}:`,
            stockError
          );
          // Continue with other products, don't fail the entire transaction
        }
      }

      return {
        success: true,
        data: {
          transaction,
          items: transactionItems,
          change_amount,
        },
      };
    } catch (error) {
      console.error("Transaction creation failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan yang tidak terduga",
      };
    }
  }

  async getTransactionById(transactionId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        transaction_items (
          *,
          products (
            name,
            category,
            unit
          )
        ),
        cashier:users!cashier_id (
          full_name
        )
      `
      )
      .eq("id", transactionId)
      .single();

    return { data, error };
  }

  async getTransactionsByStore(
    storeId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      cashierId?: string;
      paymentMethod?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        transaction_items (
          quantity,
          price,
          subtotal
        ),
        cashier:users!cashier_id (
          full_name
        )
      `
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (options?.startDate) {
      query = query.gte("created_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("created_at", options.endDate);
    }

    if (options?.cashierId) {
      query = query.eq("cashier_id", options.cashierId);
    }

    if (options?.paymentMethod) {
      query = query.eq("payment_method", options.paymentMethod);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 50) - 1
      );
    }

    return await query;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
```

### 2. Payment Processing Helper

```typescript
// src/lib/payment-processor.ts
export type PaymentMethod = "cash" | "card" | "e_wallet" | "bank_transfer";

export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  cashAmount?: number;
}

export class PaymentProcessor {
  validatePayment(
    paymentData: PaymentData,
    totalAmount: number
  ): {
    isValid: boolean;
    error?: string;
    changeAmount?: number;
  } {
    switch (paymentData.method) {
      case "cash":
        if (!paymentData.cashAmount) {
          return { isValid: false, error: "Jumlah uang tunai harus diisi" };
        }
        if (paymentData.cashAmount < totalAmount) {
          return { isValid: false, error: "Jumlah uang tunai tidak mencukupi" };
        }
        return {
          isValid: true,
          changeAmount: paymentData.cashAmount - totalAmount,
        };

      case "card":
      case "e_wallet":
        if (paymentData.amount !== totalAmount) {
          return {
            isValid: false,
            error: "Jumlah pembayaran tidak sesuai dengan total",
          };
        }
        return { isValid: true };

      case "bank_transfer":
        if (!paymentData.reference) {
          return {
            isValid: false,
            error: "Nomor referensi transfer harus diisi",
          };
        }
        if (paymentData.amount !== totalAmount) {
          return {
            isValid: false,
            error: "Jumlah transfer tidak sesuai dengan total",
          };
        }
        return { isValid: true };

      default:
        return { isValid: false, error: "Metode pembayaran tidak valid" };
    }
  }

  async processPayment(paymentData: PaymentData): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    // Mock payment processing
    // In real implementation, integrate with payment gateways
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing

      // Mock success/failure for testing
      if (paymentData.method === "card" && Math.random() < 0.1) {
        return { success: false, error: "Kartu ditolak" };
      }

      return {
        success: true,
        transactionId: `PAY-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: "Gagal memproses pembayaran",
      };
    }
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      cash: "Tunai",
      card: "Kartu",
      e_wallet: "Dompet Digital",
      bank_transfer: "Transfer Bank",
    };
    return labels[method];
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      cash: "Banknote",
      card: "CreditCard",
      e_wallet: "Smartphone",
      bank_transfer: "Building2",
    };
    return icons[method];
  }
}
```

### 3. Stock Management Integration

```typescript
// src/lib/stock-manager.ts
export class StockManager {
  async checkStockAvailability(
    items: Array<{ product_id: string; quantity: number }>
  ) {
    const stockChecks = await Promise.all(
      items.map(async (item) => {
        const { data: product, error } = await supabase
          .from("products")
          .select("id, name, stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (error) {
          return {
            product_id: item.product_id,
            available: false,
            error: "Produk tidak ditemukan",
          };
        }

        return {
          product_id: item.product_id,
          product_name: product.name,
          requested: item.quantity,
          available_stock: product.stock_quantity,
          sufficient: product.stock_quantity >= item.quantity,
          available: product.stock_quantity >= item.quantity,
        };
      })
    );

    const insufficientStock = stockChecks.filter((check) => !check.sufficient);

    return {
      isAvailable: insufficientStock.length === 0,
      checks: stockChecks,
      errors: insufficientStock.map(
        (check) =>
          `${check.product_name}: stock tersedia ${check.available_stock}, diminta ${check.requested}`
      ),
    };
  }

  async reserveStock(items: Array<{ product_id: string; quantity: number }>) {
    // Temporarily reduce stock to prevent overselling
    // This should be done in a database transaction
    const reservations = [];

    for (const item of items) {
      const { data, error } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (error || !data) {
        throw new Error(`Cannot reserve stock for product ${item.product_id}`);
      }

      if (data.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      // Update stock temporarily
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: data.stock_quantity - item.quantity })
        .eq("id", item.product_id);

      if (updateError) {
        // Rollback previous reservations
        await this.releaseReservations(reservations);
        throw new Error(
          `Failed to reserve stock for product ${item.product_id}`
        );
      }

      reservations.push({
        product_id: item.product_id,
        reserved_quantity: item.quantity,
        original_stock: data.stock_quantity,
      });
    }

    return reservations;
  }

  async releaseReservations(
    reservations: Array<{
      product_id: string;
      reserved_quantity: number;
      original_stock: number;
    }>
  ) {
    for (const reservation of reservations) {
      await supabase
        .from("products")
        .update({ stock_quantity: reservation.original_stock })
        .eq("id", reservation.product_id);
    }
  }

  async updateStockAfterSale(
    items: Array<{ product_id: string; quantity: number }>
  ) {
    for (const item of items) {
      const { error } = await supabase.rpc("update_product_stock", {
        product_uuid: item.product_id,
        quantity_sold: item.quantity,
      });

      if (error) {
        console.error(
          `Failed to update stock for product ${item.product_id}:`,
          error
        );
      }
    }
  }
}
```

## Receipt & Printing Tools

### 1. Receipt Generator

```typescript
// src/lib/receipt-generator.ts
export interface ReceiptData {
  transaction: Transaction;
  items: TransactionItem[];
  store: {
    name: string;
    address?: string;
    phone?: string;
  };
  cashier: {
    name: string;
  };
}

export class ReceiptGenerator {
  generateReceiptText(data: ReceiptData): string {
    const { transaction, items, store, cashier } = data;

    let receipt = "";

    // Header
    receipt += `${store.name}\n`;
    if (store.address) receipt += `${store.address}\n`;
    if (store.phone) receipt += `Tel: ${store.phone}\n`;
    receipt += "================================\n";

    // Transaction info
    receipt += `No: ${transaction.transaction_number}\n`;
    receipt += `Tanggal: ${new Date(transaction.created_at).toLocaleString(
      "id-ID"
    )}\n`;
    receipt += `Kasir: ${cashier.name}\n`;
    receipt += "================================\n";

    // Items
    items.forEach((item) => {
      receipt += `${item.products?.name || "Unknown"}\n`;
      receipt += `  ${item.quantity} x ${this.formatCurrency(
        item.price
      )} = ${this.formatCurrency(item.subtotal)}\n`;
    });

    receipt += "================================\n";

    // Totals
    if (transaction.discount_amount > 0) {
      receipt += `Subtotal: ${this.formatCurrency(
        transaction.total_amount + transaction.discount_amount
      )}\n`;
      receipt += `Diskon: -${this.formatCurrency(
        transaction.discount_amount
      )}\n`;
    }
    if (transaction.tax_amount > 0) {
      receipt += `Pajak: ${this.formatCurrency(transaction.tax_amount)}\n`;
    }
    receipt += `TOTAL: ${this.formatCurrency(transaction.total_amount)}\n`;

    // Payment info
    receipt += `Pembayaran: ${this.getPaymentMethodLabel(
      transaction.payment_method
    )}\n`;
    if (transaction.cash_amount) {
      receipt += `Tunai: ${this.formatCurrency(transaction.cash_amount)}\n`;
      receipt += `Kembalian: ${this.formatCurrency(
        transaction.change_amount || 0
      )}\n`;
    }

    receipt += "================================\n";
    receipt += "Terima kasih atas kunjungan Anda!\n";

    return receipt;
  }

  generateReceiptHTML(data: ReceiptData): string {
    const { transaction, items, store, cashier } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 0; padding: 20px; }
          .center { text-align: center; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .item-row { display: flex; justify-content: space-between; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2>${store.name}</h2>
          ${store.address ? `<p>${store.address}</p>` : ""}
          ${store.phone ? `<p>Tel: ${store.phone}</p>` : ""}
        </div>
        
        <div class="line"></div>
        
        <p>No: ${transaction.transaction_number}</p>
        <p>Tanggal: ${new Date(transaction.created_at).toLocaleString(
          "id-ID"
        )}</p>
        <p>Kasir: ${cashier.name}</p>
        
        <div class="line"></div>
        
        ${items
          .map(
            (item) => `
          <div class="item-row">
            <span>${item.products?.name || "Unknown"}</span>
          </div>
          <div class="item-row">
            <span>  ${item.quantity} x ${this.formatCurrency(item.price)}</span>
            <span>${this.formatCurrency(item.subtotal)}</span>
          </div>
        `
          )
          .join("")}
        
        <div class="line"></div>
        
        ${
          transaction.discount_amount > 0
            ? `
          <div class="item-row">
            <span>Subtotal:</span>
            <span>${this.formatCurrency(
              transaction.total_amount + transaction.discount_amount
            )}</span>
          </div>
          <div class="item-row">
            <span>Diskon:</span>
            <span>-${this.formatCurrency(transaction.discount_amount)}</span>
          </div>
        `
            : ""
        }
        
        ${
          transaction.tax_amount > 0
            ? `
          <div class="item-row">
            <span>Pajak:</span>
            <span>${this.formatCurrency(transaction.tax_amount)}</span>
          </div>
        `
            : ""
        }
        
        <div class="item-row total">
          <span>TOTAL:</span>
          <span>${this.formatCurrency(transaction.total_amount)}</span>
        </div>
        
        <div class="line"></div>
        
        <p>Pembayaran: ${this.getPaymentMethodLabel(
          transaction.payment_method
        )}</p>
        ${
          transaction.cash_amount
            ? `
          <p>Tunai: ${this.formatCurrency(transaction.cash_amount)}</p>
          <p>Kembalian: ${this.formatCurrency(
            transaction.change_amount || 0
          )}</p>
        `
            : ""
        }
        
        <div class="line"></div>
        <div class="center">
          <p>Terima kasih atas kunjungan Anda!</p>
        </div>
      </body>
      </html>
    `;
  }

  async printReceipt(data: ReceiptData) {
    const html = this.generateReceiptHTML(data);
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }

  downloadReceiptPDF(data: ReceiptData) {
    // This would integrate with a PDF library like jsPDF
    console.log("PDF download functionality would be implemented here");
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: "Tunai",
      card: "Kartu",
      e_wallet: "Dompet Digital",
      bank_transfer: "Transfer Bank",
    };
    return labels[method] || method;
  }
}
```

### 2. Transaction Analytics

```typescript
// src/lib/transaction-analytics.ts
export class TransactionAnalytics {
  async getDailySales(storeId: string, date: string) {
    const startDate = `${date}T00:00:00`;
    const endDate = `${date}T23:59:59`;

    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        total_amount,
        payment_method,
        created_at,
        transaction_items (
          quantity,
          subtotal
        )
      `
      )
      .eq("store_id", storeId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("payment_status", "completed");

    if (error) return { error };

    const analytics = {
      total_transactions: data.length,
      total_revenue: data.reduce((sum, t) => sum + t.total_amount, 0),
      total_items_sold: data.reduce(
        (sum, t) =>
          sum +
          t.transaction_items.reduce(
            (itemSum, item) => itemSum + item.quantity,
            0
          ),
        0
      ),
      payment_methods: data.reduce((acc, t) => {
        acc[t.payment_method] = (acc[t.payment_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      hourly_sales: this.groupByHour(data),
    };

    return { data: analytics };
  }

  async getTopProducts(
    storeId: string,
    startDate: string,
    endDate: string,
    limit = 10
  ) {
    const { data, error } = await supabase
      .from("transaction_items")
      .select(
        `
        product_id,
        quantity,
        subtotal,
        products (
          name,
          category
        ),
        transactions!inner (
          store_id,
          created_at,
          payment_status
        )
      `
      )
      .eq("transactions.store_id", storeId)
      .eq("transactions.payment_status", "completed")
      .gte("transactions.created_at", startDate)
      .lte("transactions.created_at", endDate);

    if (error) return { error };

    const productStats = data.reduce((acc, item) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          product_id: productId,
          name: item.products?.name || "Unknown",
          category: item.products?.category || "Unknown",
          total_quantity: 0,
          total_revenue: 0,
          transaction_count: 0,
        };
      }

      acc[productId].total_quantity += item.quantity;
      acc[productId].total_revenue += item.subtotal;
      acc[productId].transaction_count += 1;

      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return { data: topProducts };
  }

  private groupByHour(transactions: any[]) {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      transactions: 0,
      revenue: 0,
    }));

    transactions.forEach((transaction) => {
      const hour = new Date(transaction.created_at).getHours();
      hourlyData[hour].transactions += 1;
      hourlyData[hour].revenue += transaction.total_amount;
    });

    return hourlyData;
  }
}
```

## Development Commands & Testing

### CLI Commands for Transaction Testing

```bash
# Test transaction creation
curl -X POST "http://localhost:3000/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": "uuid-1", "quantity": 2, "price": 10000}
    ],
    "payment_method": "cash",
    "cash_amount": 25000
  }'

# Check stock levels
npx supabase sql --query="SELECT name, stock_quantity FROM products WHERE store_id = 'your-store-id'"

# View recent transactions
npx supabase sql --query="SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10"

# Test stock update function
npx supabase sql --query="SELECT update_product_stock('product-uuid', 5)"
```

### Transaction Testing Scripts

```typescript
// scripts/test-transactions.ts
async function testTransactionFlow() {
  const transactionManager = new TransactionManager();

  // Test data
  const testTransaction = {
    cashier_id: "test-cashier-id",
    store_id: "test-store-id",
    items: [
      { product_id: "product-1", quantity: 2, price: 15000 },
      { product_id: "product-2", quantity: 1, price: 5000 },
    ],
    payment_method: "cash",
    cash_amount: 40000,
  };

  console.log("Creating test transaction...");
  const result = await transactionManager.createTransaction(testTransaction);

  if (result.success) {
    console.log("✅ Transaction created successfully");
    console.log("Transaction ID:", result.data?.transaction.id);
    console.log("Change amount:", result.data?.change_amount);
  } else {
    console.log("❌ Transaction failed:", result.error);
  }
}

// Run test
testTransactionFlow();
```
