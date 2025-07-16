import { createClient } from '@supabase/supabase-js';

// Create service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface ProductData {
  name: string;
  description?: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  category: string;
  unit: string;
  is_active: boolean;
}

export async function createProduct(productData: ProductData, storeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{
        ...productData,
        store_id: storeId
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    return { data: null, error };
  }
}

export async function updateProduct(productId: string, productData: Partial<ProductData>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating product:', error);
    return { data: null, error };
  }
}
