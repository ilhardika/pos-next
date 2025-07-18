import { supabase } from "./supabase";
import { createStore } from "./stores";
import type { User } from "@supabase/supabase-js";

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
  } & Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  store_id: string | null;
  email: string;
  full_name: string | null;
  role: "owner" | "cashier";
  is_active: boolean;
  store_name: string | null;
  created_at: string;
  updated_at: string;
}

// Sign up new user
export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign up new user with store creation
export async function signUpWithStore(
  email: string,
  password: string,
  fullName: string,
  storeName: string
) {
  // First, create the user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        store_name: storeName, // Store this in user metadata temporarily
      },
    },
  });

  if (authError) {
    throw authError;
  }

  // If user was created successfully, we'll handle store creation
  // in the email confirmation process or via a webhook
  // For now, we return the auth data
  return authData;
}

// Create store and user profile after email confirmation
export async function createStoreAndProfile(
  userId: string,
  email: string,
  fullName: string,
  storeName: string
) {
  try {
    // Create the store first
    const store = await createStore({
      name: storeName,
      email: email, // Use user's email as store contact email
    });

    // Then create the user profile linked to the store
    const userProfile = await createUserProfile(
      userId,
      email,
      fullName,
      store.id,
      "owner"
    );

    return {
      store,
      userProfile,
    };
  } catch (error) {
    console.error("Error creating store and profile:", error);
    throw error;
  }
}

// Sign in user
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign out user
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user as AuthUser | null;
}

// Get user profile with store information
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data;
}

// Create user profile after signup
export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string,
  storeId: string,
  role: "owner" | "cashier" = "owner"
) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      full_name: fullName,
      store_id: storeId,
      role,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    role?: "owner" | "cashier";
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Check if user has permission for a specific action
export function hasPermission(
  userRole: "owner" | "cashier",
  requiredRole: "owner" | "cashier"
): boolean {
  if (requiredRole === "cashier") {
    return true; // Both owner and cashier can perform cashier actions
  }

  return userRole === "owner"; // Only owner can perform owner actions
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user as AuthUser | null);
  });
}
