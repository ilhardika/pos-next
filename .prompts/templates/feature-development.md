# Feature Development Template

## Request Template

```
Saya ingin mengembangkan fitur [NAMA_FITUR] untuk aplikasi POS dengan spesifikasi berikut:

### Functional Requirements:
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Technical Requirements:
- [ ] Menggunakan Server Actions untuk database operations
- [ ] Respect RLS policies (store-based isolation)
- [ ] TypeScript dengan proper typing
- [ ] Responsive design (mobile-first)
- [ ] Error handling dan loading states
- [ ] Integration dengan existing auth system

### UI/UX Requirements:
- [ ] Consistent dengan design system (shadcn/ui)
- [ ] Indonesian language support
- [ ] Loading indicators
- [ ] Toast notifications untuk feedback
- [ ] Accessible (ARIA labels, keyboard navigation)

### Database Changes (jika diperlukan):
- [ ] New tables: [list tables]
- [ ] New columns: [list columns]
- [ ] New functions/triggers: [list functions]
- [ ] RLS policies: [describe policies]

### Files yang kemungkinan akan diubah:
- [ ] `/src/app/actions/[nama-action].ts` - Server Actions
- [ ] `/src/app/dashboard/[nama-page]/page.tsx` - Page component
- [ ] `/src/components/[domain]/[NamaComponent].tsx` - UI Components
- [ ] `/src/lib/[nama-utility].ts` - Utility functions
- [ ] `/src/lib/supabase.ts` - Database types (jika ada perubahan schema)

### Testing Plan:
- [ ] Unit tests untuk utility functions
- [ ] Integration tests untuk Server Actions
- [ ] Manual testing untuk user flow
- [ ] RLS testing untuk data isolation
- [ ] Responsive testing di berbagai device
```

## Implementation Steps

1. **Planning Phase**

   - Review existing codebase patterns
   - Design database schema changes (if needed)
   - Plan component architecture
   - Define API contracts

2. **Database Phase** (if needed)

   - Create migrations
   - Add RLS policies
   - Test with sample data

3. **Backend Phase**

   - Implement Server Actions
   - Add proper error handling
   - Add TypeScript types

4. **Frontend Phase**

   - Create UI components
   - Implement state management
   - Add form validation
   - Integrate with Server Actions

5. **Testing Phase**

   - Unit tests
   - Integration tests
   - Manual testing
   - Performance testing

6. **Polish Phase**
   - Error handling
   - Loading states
   - Responsive design
   - Accessibility
   - Documentation

## Code Templates

### Server Action Template

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase";

type [EntityName] = Database['public']['Tables']['[table_name]']['Row'];
type [EntityName]Insert = Database['public']['Tables']['[table_name]']['Insert'];

export async function create[EntityName]Action(data: [EntityName]Insert) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's store_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.store_id) {
      return { success: false, error: "Store not found" };
    }

    // Insert data with store_id
    const { data: result, error } = await supabase
      .from('[table_name]')
      .insert({
        ...data,
        store_id: userProfile.store_id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/[page-name]');
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Terjadi kesalahan yang tidak terduga' };
  }
}
```

### Component Template

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { create[EntityName]Action } from "@/app/actions/[action-name]";

interface [ComponentName]Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function [ComponentName]({ onSuccess, onCancel }: [ComponentName]Props) {
  const [formData, setFormData] = useState({
    // form fields
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await create[EntityName]Action(formData);

      if (result.success) {
        toast.success('Data berhasil disimpan');
        onSuccess?.(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
```

### Page Template

```typescript
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import [ComponentName] from "@/components/[domain]/[ComponentName]";
import { Loading } from "@/components/ui/loading";

export default async function [PageName]Page() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">[Page Title]</h1>
        {/* Action buttons */}
      </div>

      <Suspense fallback={<Loading />}>
        <[ComponentName] />
      </Suspense>
    </div>
  );
}
```
