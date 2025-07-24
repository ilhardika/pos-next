# New Feature Workflow - POS Next.js Project

## Workflow Overview

Proses pengembangan fitur baru dari planning hingga deployment dengan best practices untuk aplikasi POS multi-tenant.

## Phase 1: Planning & Analysis

### 1.1 Requirements Gathering

```markdown
### Feature: [Nama Fitur]

#### Business Requirements

- [ ] Problem yang ingin diselesaikan
- [ ] Target users (owner/cashier/both)
- [ ] Success metrics
- [ ] Priority level (P0/P1/P2)

#### Functional Requirements

- [ ] User stories dengan acceptance criteria
- [ ] Input/output specifications
- [ ] Edge cases dan error scenarios
- [ ] Permission requirements

#### Technical Requirements

- [ ] Database changes needed
- [ ] API endpoints required
- [ ] UI components needed
- [ ] Third-party integrations
- [ ] Performance requirements
```

### 1.2 Architecture Review

```bash
# Review existing patterns
find src/app/actions -name "*.ts" | head -5 | xargs grep -l "use server"
find src/components -name "*.tsx" | head -5 | xargs grep -l "use client"

# Check database schema
cat src/lib/supabase.ts | grep -A 20 "export type Database"

# Review similar features
grep -r "similar_feature_name" src/ --include="*.tsx" --include="*.ts"
```

### 1.3 Impact Assessment

- **Database Impact**: New tables, columns, functions?
- **Authentication Impact**: New permissions, roles?
- **UI Impact**: New components, layouts?
- **Performance Impact**: Query complexity, bundle size?
- **Security Impact**: RLS policies, data validation?

## Phase 2: Database Design

### 2.1 Schema Planning

```sql
-- Create migration file
-- File: supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql

BEGIN;

-- Example: Adding loyalty points feature
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    points_spent INTEGER NOT NULL DEFAULT 0,
    balance INTEGER GENERATED ALWAYS AS (points_earned - points_spent) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_store
ON public.loyalty_points(user_id, store_id);

-- Create RLS policies
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own loyalty points"
ON public.loyalty_points
FOR ALL USING (
    user_id = auth.uid()
    AND store_id IN (
        SELECT store_id
        FROM public.users
        WHERE id = auth.uid()
    )
);

-- Create functions
CREATE OR REPLACE FUNCTION award_loyalty_points(
    p_user_id UUID,
    p_store_id UUID,
    p_transaction_id UUID,
    p_transaction_amount DECIMAL
) RETURNS INTEGER AS $$
DECLARE
    points_to_award INTEGER;
BEGIN
    -- 1 point per 1000 IDR
    points_to_award := FLOOR(p_transaction_amount / 1000);

    INSERT INTO public.loyalty_points (
        user_id,
        store_id,
        transaction_id,
        points_earned
    ) VALUES (
        p_user_id,
        p_store_id,
        p_transaction_id,
        points_to_award
    );

    RETURN points_to_award;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE OR REPLACE FUNCTION update_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_points_updated_at_trigger
    BEFORE UPDATE ON public.loyalty_points
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points_updated_at();

COMMIT;
```

### 2.2 Migration Testing

```bash
# Test migration locally
npx supabase db reset
npx supabase db push

# Generate new types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Test RLS policies
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -c "SET role postgres; SELECT * FROM loyalty_points;"
```

### 2.3 Update TypeScript Types

```typescript
// Update src/lib/supabase.ts
export type Database = {
  public: {
    Tables: {
      // ... existing tables
      loyalty_points: {
        Row: {
          id: string;
          user_id: string;
          store_id: string;
          transaction_id: string | null;
          points_earned: number;
          points_spent: number;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_id: string;
          transaction_id?: string | null;
          points_earned?: number;
          points_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          store_id?: string;
          transaction_id?: string | null;
          points_earned?: number;
          points_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
```

## Phase 3: Backend Implementation

### 3.1 Server Actions Development

```typescript
// src/app/actions/loyalty.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLoyaltyBalance(userId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's store
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("store_id")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile?.store_id) {
      return { success: false, error: "Store not found" };
    }

    // Get loyalty balance
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("points_earned, points_spent, balance")
      .eq("user_id", userId)
      .eq("store_id", userProfile.store_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const totalBalance = data.reduce((sum, record) => sum + record.balance, 0);

    return { success: true, data: { balance: totalBalance, history: data } };
  } catch (error) {
    console.error("Get loyalty balance error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

export async function awardLoyaltyPoints(
  userId: string,
  transactionId: string,
  transactionAmount: number
) {
  try {
    const supabase = await createClient();

    // Get user's store
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("store_id")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile?.store_id) {
      return { success: false, error: "Store not found" };
    }

    // Award points using database function
    const { data, error } = await supabase.rpc("award_loyalty_points", {
      p_user_id: userId,
      p_store_id: userProfile.store_id,
      p_transaction_id: transactionId,
      p_transaction_amount: transactionAmount,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/loyalty");
    return { success: true, data: { points_awarded: data } };
  } catch (error) {
    console.error("Award loyalty points error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
```

### 3.2 Integration with Existing Features

```typescript
// Update src/app/actions/transactions.ts
// Add loyalty points integration to transaction creation

export async function createTransactionAction(data: CreateTransactionData) {
  // ... existing transaction logic ...

  if (result.success && result.data?.transaction) {
    // Award loyalty points
    const loyaltyResult = await awardLoyaltyPoints(
      data.user_id,
      result.data.transaction.id,
      data.total_amount
    );

    if (loyaltyResult.success) {
      console.log(
        `Awarded ${loyaltyResult.data?.points_awarded} loyalty points`
      );
    }
  }

  return result;
}
```

## Phase 4: Frontend Implementation

### 4.1 Component Development

```typescript
// src/components/loyalty/LoyaltyBalance.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { getLoyaltyBalance } from "@/app/actions/loyalty";
import { useAuth } from "@/hooks/useAuth";

export default function LoyaltyBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLoyaltyBalance();
    }
  }, [user]);

  const loadLoyaltyBalance = async () => {
    if (!user) return;

    setLoading(true);
    const result = await getLoyaltyBalance(user.id);

    if (result.success) {
      setBalance(result.data?.balance || 0);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Poin Loyalty</CardTitle>
        <Star className="h-4 w-4 text-yellow-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {balance.toLocaleString("id-ID")}
        </div>
        <p className="text-xs text-muted-foreground">
          Poin yang dapat digunakan
        </p>
        <Badge variant="secondary" className="mt-2">
          1 poin = Rp 1.000
        </Badge>
      </CardContent>
    </Card>
  );
}
```

### 4.2 Page Integration

```typescript
// src/app/dashboard/loyalty/page.tsx
import { Suspense } from "react";
import { requireProfile } from "@/lib/auth-guards";
import LoyaltyBalance from "@/components/loyalty/LoyaltyBalance";
import LoyaltyHistory from "@/components/loyalty/LoyaltyHistory";
import { Loading } from "@/components/ui/loading";

export default async function LoyaltyPage() {
  await requireProfile();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Program Loyalty</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<Loading />}>
          <LoyaltyBalance />
        </Suspense>

        <Suspense fallback={<Loading />}>
          <LoyaltyHistory />
        </Suspense>
      </div>
    </div>
  );
}
```

### 4.3 Navigation Updates

```typescript
// Update src/lib/navigation.ts
export const navigationItems = [
  // ... existing items
  {
    title: "Loyalty",
    href: "/dashboard/loyalty",
    icon: "Star",
    roles: ["owner", "cashier"],
  },
] as const;
```

## Phase 5: Testing

### 5.1 Unit Testing

```typescript
// src/app/actions/loyalty.test.ts
import { getLoyaltyBalance, awardLoyaltyPoints } from "./loyalty";

describe("Loyalty Actions", () => {
  const mockUserId = "test-user-id";
  const mockTransactionId = "test-transaction-id";

  beforeEach(async () => {
    // Setup test data
    await setupTestUser(mockUserId);
  });

  test("should get loyalty balance", async () => {
    const result = await getLoyaltyBalance(mockUserId);

    expect(result.success).toBe(true);
    expect(result.data?.balance).toBeDefined();
  });

  test("should award loyalty points", async () => {
    const result = await awardLoyaltyPoints(
      mockUserId,
      mockTransactionId,
      10000
    );

    expect(result.success).toBe(true);
    expect(result.data?.points_awarded).toBe(10); // 10000 / 1000
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestUser(mockUserId);
  });
});
```

### 5.2 Integration Testing

```typescript
// src/components/loyalty/LoyaltyBalance.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/hooks/useAuth";
import LoyaltyBalance from "./LoyaltyBalance";

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider value={mockAuthContext()}>{children}</AuthProvider>
);

test("should display loyalty balance", async () => {
  render(
    <MockAuthProvider>
      <LoyaltyBalance />
    </MockAuthProvider>
  );

  expect(screen.getByText("Loading...")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Poin Loyalty")).toBeInTheDocument();
  });
});
```

### 5.3 Manual Testing Checklist

- [ ] Feature works with owner role
- [ ] Feature works with cashier role
- [ ] RLS policies prevent cross-store access
- [ ] Points awarded correctly on transaction
- [ ] Balance calculated correctly
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error handling works

## Phase 6: Documentation & Deployment

### 6.1 Update Documentation

```markdown
# Update README.md

## New Features

- **Loyalty Points**: Customer loyalty program with automatic point awarding

# Update API documentation

## Loyalty Endpoints

- `getLoyaltyBalance(userId)` - Get user's loyalty point balance
- `awardLoyaltyPoints(userId, transactionId, amount)` - Award points for transaction
```

### 6.2 Deployment Checklist

- [ ] Database migration tested
- [ ] Environment variables updated
- [ ] Feature flags configured (if applicable)
- [ ] Monitoring alerts configured
- [ ] Rollback plan prepared

### 6.3 Deployment Commands

```bash
# Deploy to staging
npx supabase db push --project-ref staging-project-id

# Test on staging
npm run test:e2e:staging

# Deploy to production
npx supabase db push --project-ref production-project-id

# Monitor deployment
npx supabase logs --follow --project-ref production-project-id
```

## Phase 7: Post-Deployment

### 7.1 Monitoring

- Check application logs for errors
- Monitor database performance
- Verify feature usage metrics
- Monitor user feedback

### 7.2 Iteration Planning

- Gather user feedback
- Identify improvement opportunities
- Plan next iteration
- Update feature roadmap

## Workflow Commands

### Quick Start New Feature

```bash
# Create feature branch
git checkout -b feature/loyalty-points

# Create migration
npx supabase migration new loyalty_points_system

# Create action file
touch src/app/actions/loyalty.ts

# Create component directory
mkdir -p src/components/loyalty

# Create page
mkdir -p src/app/dashboard/loyalty
touch src/app/dashboard/loyalty/page.tsx

# Start development
npm run dev
```

### Testing Commands

```bash
# Run unit tests
npm test -- loyalty

# Run integration tests
npm run test:integration

# Test database migration
npx supabase db reset && npx supabase db push

# Manual testing
npm run dev
```

### Deployment Commands

```bash
# Deploy database changes
npx supabase db push

# Deploy application
npm run build && npm run deploy

# Verify deployment
curl -f https://your-app.com/dashboard/loyalty || echo "Deployment failed"
```
