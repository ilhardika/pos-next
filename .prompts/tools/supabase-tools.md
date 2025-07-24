# Supabase Tools - POS Next.js Project

## Database Operations Tools

### 1. Query Builder Helper

```typescript
// src/lib/supabase-helpers.ts
import { supabase } from "./supabase";
import type { Database } from "./supabase";

type Tables = Database["public"]["Tables"];

export class SupabaseQueryBuilder<T extends keyof Tables> {
  constructor(private tableName: T) {}

  // Get with store filtering
  async getByStore(storeId: string, select?: string) {
    return await supabase
      .from(this.tableName)
      .select(select || "*")
      .eq("store_id", storeId);
  }

  // Create with store ID
  async createWithStore(data: any, storeId: string) {
    return await supabase
      .from(this.tableName)
      .insert({ ...data, store_id: storeId })
      .select()
      .single();
  }

  // Update with ownership check
  async updateByStore(id: string, data: any, storeId: string) {
    return await supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single();
  }

  // Delete with ownership check
  async deleteByStore(id: string, storeId: string) {
    return await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id)
      .eq("store_id", storeId);
  }
}

// Usage examples
const productsQuery = new SupabaseQueryBuilder("products");
const transactionsQuery = new SupabaseQueryBuilder("transactions");
```

### 2. RLS Policy Checker

```typescript
// src/lib/rls-checker.ts
export async function checkRLSAccess(
  tableName: string,
  operation: "select" | "insert" | "update" | "delete",
  userId: string
) {
  try {
    const testData = { name: "test", store_id: "test-store" };

    switch (operation) {
      case "select":
        await supabase.from(tableName).select("*").limit(1);
        break;
      case "insert":
        await supabase.from(tableName).insert(testData);
        break;
      case "update":
        await supabase.from(tableName).update(testData).eq("id", "test-id");
        break;
      case "delete":
        await supabase.from(tableName).delete().eq("id", "test-id");
        break;
    }

    return { hasAccess: true };
  } catch (error) {
    return {
      hasAccess: false,
      error: error.message,
      suggestion: getRLSSuggestion(error.message),
    };
  }
}

function getRLSSuggestion(errorMessage: string): string {
  if (errorMessage.includes("permission denied")) {
    return "Check if RLS policies allow this operation for current user";
  }
  if (errorMessage.includes("relation does not exist")) {
    return "Table might not exist or user lacks access";
  }
  return "Unknown RLS issue";
}
```

### 3. Database Schema Validator

```typescript
// src/lib/schema-validator.ts
export async function validateDatabaseSchema() {
  const requiredTables = [
    "stores",
    "users",
    "products",
    "transactions",
    "transaction_items",
  ];

  const results = await Promise.all(
    requiredTables.map(async (table) => {
      try {
        const { error } = await supabase.from(table).select("*").limit(1);
        return { table, exists: !error, error: error?.message };
      } catch (err) {
        return { table, exists: false, error: err.message };
      }
    })
  );

  const missingTables = results.filter((r) => !r.exists);

  return {
    isValid: missingTables.length === 0,
    missingTables,
    summary:
      missingTables.length === 0
        ? "All required tables exist"
        : `Missing tables: ${missingTables.map((t) => t.table).join(", ")}`,
  };
}
```

### 4. Real-time Subscription Helper

```typescript
// src/lib/realtime-helpers.ts
export function createRealtimeSubscription<T>(
  tableName: string,
  filter: string,
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: tableName,
        filter,
      },
      callback
    )
    .subscribe();

  return {
    subscription,
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
}

// Usage
const { unsubscribe } = createRealtimeSubscription(
  "products",
  `store_id=eq.${storeId}`,
  (payload) => {
    console.log("Product updated:", payload);
    // Update local state
  }
);
```

## Development Tools

### 1. Supabase Development CLI Commands

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database (careful!)
npx supabase db reset

# Apply migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Create new migration
npx supabase migration new migration_name

# View database URL and keys
npx supabase status

# View logs
npx supabase logs --follow

# Link to remote project
npx supabase link --project-ref your-project-ref
```

### 2. Database Seeding Tool

```typescript
// src/lib/seed-data.ts
export async function seedDatabase() {
  try {
    // Create test store
    const { data: store } = await supabase
      .from("stores")
      .insert({
        name: "Toko Demo",
        address: "Jl. Contoh No. 123",
        phone: "08123456789",
      })
      .select()
      .single();

    // Create test products
    const products = [
      { name: "Nasi Ayam", price: 15000, category: "Makanan", unit: "porsi" },
      { name: "Es Teh", price: 5000, category: "Minuman", unit: "gelas" },
      { name: "Kerupuk", price: 2000, category: "Snack", unit: "bungkus" },
    ];

    await supabase
      .from("products")
      .insert(
        products.map((p) => ({ ...p, store_id: store.id, stock_quantity: 100 }))
      );

    console.log("✅ Database seeded successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    return { success: false, error };
  }
}
```

### 3. Performance Monitor

```typescript
// src/lib/performance-monitor.ts
export class SupabasePerformanceMonitor {
  private queries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> = [];

  wrapQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return queryFn().then((result) => {
      const duration = performance.now() - startTime;

      this.queries.push({
        query: queryName,
        duration,
        timestamp: new Date(),
      });

      // Log slow queries
      if (duration > 1000) {
        console.warn(
          `🐌 Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    });
  }

  getSlowQueries(threshold = 500) {
    return this.queries.filter((q) => q.duration > threshold);
  }

  getAverageQueryTime() {
    if (this.queries.length === 0) return 0;
    const total = this.queries.reduce((sum, q) => sum + q.duration, 0);
    return total / this.queries.length;
  }

  clearMetrics() {
    this.queries = [];
  }
}

// Usage
const monitor = new SupabasePerformanceMonitor();

const products = await monitor.wrapQuery("fetch-products", () =>
  supabase.from("products").select("*")
);
```

## Debugging Tools

### 1. Supabase Debug Logger

```typescript
// src/lib/supabase-debug.ts
export function enableSupabaseDebug() {
  if (process.env.NODE_ENV !== "development") return;

  const originalFrom = supabase.from;

  supabase.from = function (table: string) {
    const query = originalFrom.call(this, table);

    // Override select method to log queries
    const originalSelect = query.select;
    query.select = function (columns?: string) {
      console.log(`🔍 Supabase Query: SELECT ${columns || "*"} FROM ${table}`);
      return originalSelect.call(this, columns);
    };

    return query;
  };
}

// Enable in development
if (process.env.NODE_ENV === "development") {
  enableSupabaseDebug();
}
```

### 2. RLS Policy Tester

```typescript
// src/lib/rls-tester.ts
export async function testRLSPolicies() {
  const testResults = [];

  // Test products table
  try {
    await supabase.from("products").select("*").limit(1);
    testResults.push({
      table: "products",
      operation: "select",
      status: "pass",
    });
  } catch (error) {
    testResults.push({
      table: "products",
      operation: "select",
      status: "fail",
      error: error.message,
    });
  }

  // Test with different users (if available)
  // ... more tests

  return testResults;
}
```

### 3. Connection Health Checker

```typescript
// src/lib/connection-checker.ts
export async function checkSupabaseConnection() {
  try {
    const startTime = performance.now();

    const { data, error } = await supabase.from("stores").select("id").limit(1);

    const responseTime = performance.now() - startTime;

    return {
      isConnected: !error,
      responseTime: Math.round(responseTime),
      error: error?.message,
      status:
        responseTime < 500
          ? "good"
          : responseTime < 1000
          ? "slow"
          : "very_slow",
    };
  } catch (error) {
    return {
      isConnected: false,
      responseTime: null,
      error: error.message,
      status: "error",
    };
  }
}
```

## Utility Commands

### Quick Scripts for Common Tasks

```bash
# Check if Supabase is running
npx supabase status

# Quick database reset for testing
npx supabase db reset && npm run seed

# Generate fresh types after schema changes
npx supabase gen types typescript --local > src/lib/database.types.ts && echo "Types updated!"

# Backup local database
npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply specific migration
npx supabase migration repair 20231101000000_migration_name

# Check migration status
npx supabase migration list
```

### Environment Validation Script

```typescript
// scripts/validate-env.ts
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error("❌ Missing environment variables:");
    missing.forEach((envVar) => console.error(`  - ${envVar}`));
    process.exit(1);
  }

  console.log("✅ All required environment variables are set");
}

validateEnvironment();
```
