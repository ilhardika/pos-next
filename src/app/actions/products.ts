"use server";

import { createProduct, updateProduct, type ProductData } from "@/lib/products";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create server-side client with cookies
async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Server actions can't set cookies, but we need this for the client
        },
        remove() {
          // Server actions can't remove cookies, but we need this for the client
        },
      },
    }
  );
}

export async function createProductAction(
  productData: ProductData,
  userId?: string
) {
  try {
    let storeId: string;

    if (userId) {
      // Get user's store_id directly from users table using provided userId
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", userId)
        .single();

      if (profileError || !userProfile?.store_id) {
        return {
          success: false,
          error: "Store tidak ditemukan. Silakan hubungi admin.",
        };
      }

      storeId = userProfile.store_id;
    } else {
      // Fallback: try to get from server session
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User tidak ditemukan. Silakan login ulang.",
        };
      }

      // Get user's store_id from users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile?.store_id) {
        return {
          success: false,
          error: "Store tidak ditemukan. Silakan hubungi admin.",
        };
      }

      storeId = userProfile.store_id;
    }

    const result = await createProduct(productData, storeId);

    if (result.error) {
      return {
        success: false,
        error: (result.error as Error).message || "Error creating product",
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Terjadi kesalahan saat menyimpan produk" };
  }
}

export async function updateProductAction(
  productId: string,
  productData: Partial<ProductData>
) {
  try {
    const result = await updateProduct(productId, productData);

    if (result.error) {
      return {
        success: false,
        error: (result.error as Error).message || "Error updating product",
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengupdate produk",
    };
  }
}

export async function fetchProductsAction(userId?: string) {
  try {
    let storeId: string;

    if (userId) {
      // Get user's store_id directly from users table using provided userId
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", userId)
        .single();

      if (profileError || !userProfile?.store_id) {
        return { success: false, error: "Store tidak ditemukan", data: [] };
      }

      storeId = userProfile.store_id;
    } else {
      // Fallback: try to get from server session
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "User tidak ditemukan", data: [] };
      }

      // Get user's store_id from users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile?.store_id) {
        return { success: false, error: "Store tidak ditemukan", data: [] };
      }

      storeId = userProfile.store_id;
    }

    // Fetch products using service role client (get all products, not just active)
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengambil data produk",
      data: [],
    };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Terjadi kesalahan saat menghapus produk" };
  }
}

export async function checkCategoryUsageAction(
  category: string,
  userId?: string
) {
  try {
    let storeId: string;

    if (userId) {
      // Get user's store_id directly from users table using provided userId
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", userId)
        .single();

      if (profileError || !userProfile?.store_id) {
        return {
          success: false,
          error: "Store tidak ditemukan. Silakan hubungi admin.",
          products: [],
        };
      }

      storeId = userProfile.store_id;
    } else {
      // Fallback: try to get from server session
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User tidak ditemukan. Silakan login ulang.",
          products: [],
        };
      }

      // Get user's store_id from users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile?.store_id) {
        return {
          success: false,
          error: "Store tidak ditemukan. Silakan hubungi admin.",
          products: [],
        };
      }

      storeId = userProfile.store_id;
    }

    // Check if category is used in any active products
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name")
      .eq("store_id", storeId)
      .eq("category", category)
      .eq("is_active", true);

    if (error) {
      return { success: false, error: error.message, products: [] };
    }

    return { success: true, products: data || [] };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengecek kategori",
      products: [],
    };
  }
}

export async function checkUnitUsageAction(unit: string, userId?: string) {
  try {
    let storeId: string;

    if (userId) {
      // Get user's store_id directly from users table using provided userId
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", userId)
        .single();

      if (profileError || !userProfile?.store_id) {
        return {
          success: false,
          error: "Store tidak ditemukan. Silakan hubungi admin.",
          products: [],
        };
      }

      storeId = userProfile.store_id;
    } else {
      // Fallback: try to get from server session
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: "User tidak ditemukan. Silakan login ulang.",
          products: [],
        };
      }

      // Get user's store_id from users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("store_id")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile?.store_id) {
        return {
          success: false,
          error: "Store tidak ditemukan. Silakan hubungi admin.",
          products: [],
        };
      }

      storeId = userProfile.store_id;
    }

    // Check if unit is used in any active products
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name")
      .eq("store_id", storeId)
      .eq("unit", unit)
      .eq("is_active", true);

    if (error) {
      return { success: false, error: error.message, products: [] };
    }

    return { success: true, products: data || [] };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengecek satuan",
      products: [],
    };
  }
}
