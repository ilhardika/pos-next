import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create single instance to avoid multiple client warning
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          store_id: string | null;
          email: string;
          full_name: string | null;
          role: "owner" | "cashier";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          store_id?: string | null;
          email: string;
          full_name?: string | null;
          role?: "owner" | "cashier";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string | null;
          email?: string;
          full_name?: string | null;
          role?: "owner" | "cashier";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          description: string | null;
          price: number;
          stock_quantity: number;
          min_stock_level: number;
          sku: string | null;
          barcode: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          price: number;
          stock_quantity?: number;
          min_stock_level?: number;
          sku?: string | null;
          barcode?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          stock_quantity?: number;
          min_stock_level?: number;
          sku?: string | null;
          barcode?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          store_id: string;
          cashier_id: string;
          transaction_number: string;
          total_amount: number;
          tax_amount: number;
          discount_amount: number;
          payment_method: "cash" | "card" | "digital_wallet" | "bank_transfer";
          payment_status: "pending" | "completed" | "failed" | "refunded";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          cashier_id: string;
          transaction_number: string;
          total_amount: number;
          tax_amount?: number;
          discount_amount?: number;
          payment_method?: "cash" | "card" | "digital_wallet" | "bank_transfer";
          payment_status?: "pending" | "completed" | "failed" | "refunded";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          cashier_id?: string;
          transaction_number?: string;
          total_amount?: number;
          tax_amount?: number;
          discount_amount?: number;
          payment_method?: "cash" | "card" | "digital_wallet" | "bank_transfer";
          payment_status?: "pending" | "completed" | "failed" | "refunded";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          discount_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          discount_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          discount_amount?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      user_profiles: {
        Row: {
          id: string;
          store_id: string | null;
          email: string;
          full_name: string | null;
          role: "owner" | "cashier";
          is_active: boolean;
          store_name: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
