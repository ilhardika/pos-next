# Database Migration Template

## Migration Request Template

```
### Migration Purpose
[Jelaskan mengapa migration ini diperlukan]

### Database Changes
#### New Tables
- [ ] `table_name`
  - Columns: [list columns with types]
  - Constraints: [list constraints]
  - Indexes: [list indexes]

#### Modified Tables
- [ ] `existing_table`
  - Added columns: [list new columns]
  - Modified columns: [list changes]
  - Dropped columns: [list dropped columns]

#### New Functions/Triggers
- [ ] `function_name()` - [purpose]
- [ ] `trigger_name` - [when it fires]

#### RLS Policies
- [ ] `policy_name` on `table_name` - [description]

### Data Migration
- [ ] Existing data needs to be migrated
- [ ] New default values needed
- [ ] Data validation required

### Rollback Plan
- [ ] Can be rolled back safely
- [ ] Data backup required
- [ ] Dependencies to consider
```

## Migration Implementation

### 1. Schema Migration SQL

```sql
-- Migration: [migration_name]
-- Date: [YYYY-MM-DD]
-- Description: [Brief description]

BEGIN;

-- Create new tables
CREATE TABLE IF NOT EXISTS public.new_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing tables
ALTER TABLE public.existing_table
ADD COLUMN IF NOT EXISTS new_column VARCHAR(100);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_new_table_store_id ON public.new_table(store_id);
CREATE INDEX IF NOT EXISTS idx_new_table_active ON public.new_table(is_active) WHERE is_active = true;

-- Create functions
CREATE OR REPLACE FUNCTION update_new_table_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_new_table_updated_at_trigger
    BEFORE UPDATE ON public.new_table
    FOR EACH ROW
    EXECUTE FUNCTION update_new_table_updated_at();

-- Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their store's data" ON public.new_table
    FOR ALL USING (
        store_id IN (
            SELECT store_id
            FROM public.users
            WHERE id = auth.uid()
        )
    );

-- Insert default data (if needed)
-- INSERT INTO public.new_table (store_id, name) VALUES (...);

COMMIT;
```

### 2. TypeScript Types Update

```typescript
// Update src/lib/supabase.ts
export type Database = {
  public: {
    Tables: {
      // ... existing tables
      new_table: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
```

### 3. Migration Testing

```typescript
// Test migration locally
describe("Database Migration", () => {
  test("new table should exist", async () => {
    const { data, error } = await supabase
      .from("new_table")
      .select("*")
      .limit(1);

    expect(error).toBeNull();
  });

  test("RLS policies should work", async () => {
    // Test with different users
    const result1 = await supabaseUser1.from("new_table").select("*");
    const result2 = await supabaseUser2.from("new_table").select("*");

    // Users should only see their store's data
    expect(result1.data).not.toContain(
      expect.objectContaining({ store_id: "different-store-id" })
    );
  });

  test("triggers should work", async () => {
    const { data } = await supabase
      .from("new_table")
      .insert({ name: "Test" })
      .select()
      .single();

    expect(data.created_at).toBeDefined();
    expect(data.updated_at).toBeDefined();
  });
});
```

## Migration Process

### 1. Development Phase

```bash
# 1. Start local Supabase
npx supabase start

# 2. Create migration file
npx supabase migration new migration_name

# 3. Write migration SQL
# Edit the generated file in supabase/migrations/

# 4. Apply migration locally
npx supabase db push

# 5. Generate TypeScript types
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### 2. Testing Phase

```bash
# Reset database to test migration from scratch
npx supabase db reset

# Test with sample data
npx supabase seed run
```

### 3. Production Deployment

```bash
# 1. Deploy to staging first
npx supabase db push --project-id staging-project-id

# 2. Test on staging
# Run integration tests

# 3. Deploy to production
npx supabase db push --project-id production-project-id

# 4. Verify deployment
# Check tables, data, policies
```

## Rollback Plan

### 1. Rollback SQL Template

```sql
-- Rollback: [migration_name]
-- Date: [YYYY-MM-DD]

BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS public.new_table CASCADE;

-- Remove new columns
ALTER TABLE public.existing_table
DROP COLUMN IF EXISTS new_column;

-- Remove functions and triggers
DROP TRIGGER IF EXISTS update_new_table_updated_at_trigger ON public.new_table;
DROP FUNCTION IF EXISTS update_new_table_updated_at();

-- Remove policies
DROP POLICY IF EXISTS "Users can only access their store's data" ON public.new_table;

COMMIT;
```

### 2. Emergency Rollback Process

```bash
# 1. Connect to production database
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# 2. Run rollback SQL
\i rollback_migration.sql

# 3. Verify rollback
\dt public.*
```

## Migration Checklist

### Pre-Migration

- [ ] Migration tested locally
- [ ] TypeScript types updated
- [ ] Rollback plan prepared
- [ ] Backup created (if needed)
- [ ] Team notified about downtime (if needed)

### During Migration

- [ ] Apply migration
- [ ] Verify tables created
- [ ] Test RLS policies
- [ ] Check functions/triggers
- [ ] Test sample operations

### Post-Migration

- [ ] Update application code
- [ ] Deploy frontend changes
- [ ] Monitor for errors
- [ ] Update documentation
- [ ] Clean up old code (if applicable)

## Common Migration Patterns

### Adding Audit Trail

```sql
-- Add audit columns to existing table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create audit trigger
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Data Migration with Validation

```sql
-- Migrate data with validation
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT * FROM old_table LOOP
        IF rec.field IS NOT NULL AND rec.field != '' THEN
            INSERT INTO new_table (new_field, migrated_from)
            VALUES (rec.field, rec.id);
        END IF;
    END LOOP;
END $$;
```
