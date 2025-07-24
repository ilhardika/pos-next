# Development Mode - POS Next.js Project

## Context

Anda sedang dalam mode pengembangan fitur baru untuk aplikasi POS multi-tenant. Fokus pada implementasi yang clean, type-safe, dan sesuai dengan arsitektur existing.

## Key Principles

1. **Type Safety First**: Selalu gunakan TypeScript types yang sudah didefinisikan di `/src/lib/supabase.ts`
2. **RLS Compliance**: Semua database operations harus respect Row Level Security
3. **Store-based Multi-tenancy**: Setiap data harus terisolasi per store
4. **Server Actions**: Gunakan Server Actions, bukan API routes untuk database mutations
5. **PWA Ready**: Pastikan fitur baru compatible dengan PWA functionality

## Development Checklist

- [ ] Baca existing code patterns di folder terkait
- [ ] Check database schema di `/src/lib/database/`
- [ ] Pastikan authentication flow terintegrasi
- [ ] Test dengan different user roles (owner/cashier)
- [ ] Verify RLS policies working correctly
- [ ] Test responsive design (mobile-first)
- [ ] Check PWA functionality tidak terganggu

## Required Imports Pattern

```typescript
// Server Actions
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Client Components
("use client");
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

// UI Components
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
```

## Error Handling Pattern

```typescript
try {
  // Database operation
  const { data, error } = await supabase.from("table").select();

  if (error) {
    console.error("Database error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
} catch (error) {
  console.error("Unexpected error:", error);
  return { success: false, error: "Terjadi kesalahan yang tidak terduga" };
}
```

## Testing Commands

```bash
# Development server with Turbopack
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build check
npm run build
```

## Focus Areas

- Indonesian UX/UI (currency IDR, Indonesian labels)
- Real-time stock management
- Transaction integrity
- Mobile-optimized interface
- Offline capability consideration
