import { supabase } from './supabase'
import type { Tables, Inserts } from './supabase'

export type Store = Tables<'stores'>
export type StoreInsert = Inserts<'stores'>

// Create a new store
export async function createStore(storeData: {
  name: string
  address?: string
  phone?: string
  email?: string
}): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .insert({
      name: storeData.name,
      address: storeData.address,
      phone: storeData.phone,
      email: storeData.email,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Get store by ID
export async function getStore(storeId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw error
  }

  return data
}

// Update store information
export async function updateStore(
  storeId: string,
  updates: {
    name?: string
    address?: string
    phone?: string
    email?: string
  }
): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', storeId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Get stores for a user (in case user has access to multiple stores)
export async function getUserStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      users!inner(id)
    `)
    .eq('users.id', userId)

  if (error) {
    throw error
  }

  return data || []
}

// Check if user is owner of a store
export async function isStoreOwner(userId: string, storeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .eq('store_id', storeId)
    .eq('role', 'owner')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return false
    }
    throw error
  }

  return !!data
}

// Get store statistics (for dashboard)
export async function getStoreStats(storeId: string) {
  try {
    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_active', true)

    // Get transaction count for today
    const today = new Date().toISOString().split('T')[0]
    const { count: todayTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)

    // Get total revenue for today
    const { data: todayRevenue } = await supabase
      .from('transactions')
      .select('total_amount')
      .eq('store_id', storeId)
      .eq('payment_status', 'completed')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)

    const totalRevenue = todayRevenue?.reduce((sum, transaction) => sum + transaction.total_amount, 0) || 0

    // Get staff count
    const { count: staffCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_active', true)

    return {
      productCount: productCount || 0,
      todayTransactions: todayTransactions || 0,
      todayRevenue: totalRevenue,
      staffCount: staffCount || 0,
    }
  } catch (error) {
    console.error('Error fetching store stats:', error)
    return {
      productCount: 0,
      todayTransactions: 0,
      todayRevenue: 0,
      staffCount: 0,
    }
  }
}
