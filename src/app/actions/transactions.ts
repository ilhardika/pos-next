"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Create service role client for bypassing RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Test function to verify server actions work
export async function testServerAction() {
  console.log("🧪 TEST SERVER ACTION CALLED!");
  return { success: true, message: "Server action works!" };
}

interface TransactionItem {
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface CreateTransactionData {
  user_id: string;
  total_amount: number;
  payment_method: string;
  cash_amount?: number;
  change_amount?: number;
  items: TransactionItem[];
}

export async function createTransactionAction(data: CreateTransactionData) {
  console.log("🚀 SERVER ACTION CALLED - Starting transaction creation");
  console.log("📊 Input data:", JSON.stringify(data, null, 2));

  try {
    console.log("🔗 Creating Supabase client...");
    const supabase = await createClient();

    // Get any existing store (use the first one available)
    const { data: existingStore, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .limit(1)
      .single();

    if (storeError || !existingStore) {
      console.error("Store fetch error:", storeError);
      return {
        success: false,
        error: "Tidak ada toko yang tersedia. Hubungi administrator.",
      };
    }

    const storeId = existingStore.id;

    // Generate transaction number
    const transactionNumber = `TRX-${Date.now()}`;

    // Prepare transaction data
    const transactionData = {
      store_id: storeId,
      cashier_id: data.user_id,
      transaction_number: transactionNumber,
      total_amount: data.total_amount,
      tax_amount: 0,
      discount_amount: 0,
      payment_method: data.payment_method,
      payment_status: "completed",
      notes: data.cash_amount
        ? `Tunai: Rp ${data.cash_amount.toLocaleString("id-ID")}${
            data.change_amount
              ? `, Kembalian: Rp ${data.change_amount.toLocaleString("id-ID")}`
              : ""
          }`
        : null,
      created_at: new Date().toISOString(),
    };

    // Start transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error("Transaction error:", transactionError);
      return {
        success: false,
        error: "Gagal membuat transaksi: " + transactionError.message,
      };
    }

    if (!transaction) {
      return {
        success: false,
        error: "Gagal membuat transaksi: No data returned",
      };
    }

    console.log("✅ Transaction created successfully:", transaction);

    // Insert transaction items
    const transactionItems = data.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.subtotal,
      discount_amount: 0,
    }));

    console.log("📦 Inserting transaction items:", transactionItems);

    const { data: insertedItems, error: itemsError } = await supabase
      .from("transaction_items")
      .insert(transactionItems)
      .select();

    if (itemsError) {
      console.error("❌ Transaction items error:", itemsError);
      // Rollback transaction if items insertion fails
      await supabase.from("transactions").delete().eq("id", transaction.id);
      return {
        success: false,
        error: "Gagal menyimpan item transaksi: " + itemsError.message,
      };
    }

    console.log("✅ Transaction items inserted successfully!");
    console.log("📋 Inserted items:", insertedItems);

    // Manual stock update using admin client (bypass RLS)
    console.log("🔄 Manually updating stock using admin client...");
    for (const item of transactionItems) {
      console.log(
        `📦 Updating stock for product ${item.product_id}, reducing by ${item.quantity}`
      );

      // Get current stock first
      const { data: currentProduct, error: fetchError } = await supabaseAdmin
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (fetchError) {
        console.error(
          `❌ Error fetching product ${item.product_id}:`,
          fetchError
        );
        continue;
      }

      if (currentProduct && currentProduct.stock_quantity >= item.quantity) {
        const newStock = currentProduct.stock_quantity - item.quantity;

        const { data: updatedProduct, error: stockError } = await supabaseAdmin
          .from("products")
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.product_id)
          .select("stock_quantity")
          .single();

        if (stockError) {
          console.error(
            `❌ Stock update error for product ${item.product_id}:`,
            stockError
          );
        } else {
          console.log(
            `✅ Stock updated for product ${item.product_id}: ${currentProduct.stock_quantity} → ${updatedProduct?.stock_quantity}`
          );
        }
      } else {
        console.log(`⚠️ Insufficient stock for product ${item.product_id}`);
      }
    }

    // Force revalidation of all related paths
    revalidatePath("/dashboard/transactions", "page");
    revalidatePath("/dashboard/products", "page");
    revalidatePath("/dashboard", "page");
    revalidatePath("/", "layout");

    console.log(
      "🎉 Transaction completed successfully! Stock updated manually using admin client."
    );

    return {
      success: true,
      data: {
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        total_amount: transaction.total_amount,
        payment_method: transaction.payment_method,
        change_amount: data.change_amount,
      },
    };
  } catch (error) {
    console.error("❌ Create transaction error:", error);
    return {
      success: false,
      error:
        "Terjadi kesalahan sistem: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

export async function fetchTransactionsAction(userId: string) {
  try {
    const supabase = await createClient();

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
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch transactions error:", error);
      return {
        success: false,
        error: "Gagal memuat data transaksi",
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem",
    };
  }
}

export async function fetchTransactionStatsAction(userId: string) {
  try {
    const supabase = await createClient();

    // Get today's stats
    const today = new Date().toISOString().split("T")[0];

    const { data: todayStats, error: todayError } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);

    if (todayError) {
      console.error("Today stats error:", todayError);
      return {
        success: false,
        error: "Gagal memuat statistik hari ini",
      };
    }

    // Get this month's stats
    const thisMonth = new Date().toISOString().substring(0, 7);

    const { data: monthStats, error: monthError } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("user_id", userId)
      .gte("created_at", `${thisMonth}-01T00:00:00`)
      .lt("created_at", `${thisMonth}-31T23:59:59`);

    if (monthError) {
      console.error("Month stats error:", monthError);
      return {
        success: false,
        error: "Gagal memuat statistik bulan ini",
      };
    }

    const todayTotal =
      todayStats?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
    const monthTotal =
      monthStats?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
    const todayCount = todayStats?.length || 0;
    const monthCount = monthStats?.length || 0;

    return {
      success: true,
      data: {
        today: {
          total_amount: todayTotal,
          transaction_count: todayCount,
        },
        month: {
          total_amount: monthTotal,
          transaction_count: monthCount,
        },
      },
    };
  } catch (error) {
    console.error("Fetch transaction stats error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem",
    };
  }
}
