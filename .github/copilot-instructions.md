# POS Next.js Application - AI Coding Assistant Instructions

## Architecture Overview

This is a **Point of Sale (POS) system** built with Next.js 15, TypeScript, Supabase, and Tailwind CSS. The app is designed as a PWA for Indonesian small businesses (UMKM).

### Key Technologies

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS 4, shadcn/ui components, Radix UI
- **State**: React hooks + Context API (no external state library)
- **PWA**: next-pwa with Workbox caching

## Critical Patterns & Conventions

### Database & Authentication

- **Supabase RLS (Row Level Security)** is extensively used - always consider user permissions
- **Two-tier authentication**: Supabase Auth + custom user profiles in `users` table
- **Store-based multi-tenancy**: Each user belongs to a store, data is filtered by `store_id`
- **Server Actions** in `/src/app/actions/` handle database mutations (not API routes)
- **Type-safe database**: Full TypeScript types defined in `/src/lib/supabase.ts`

### Core Data Flow

1. Auth user → User profile (`users` table) → Store access (`stores` table)
2. Products managed per store with real-time stock updates
3. Transactions create both `transactions` and `transaction_items` records
4. Stock automatically decreases via `update_product_stock()` function

### File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── actions/           # Server Actions (database mutations)
│   ├── dashboard/         # Protected dashboard pages
│   └── (auth)/           # Auth pages (login, register, verify)
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── dashboard/        # Dashboard layout components
│   ├── pos/              # POS-specific components (CartModal)
│   └── auth/             # Authentication components
├── hooks/                # React hooks (useAuth, useDebounce)
└── lib/                  # Utilities and configurations
```

## Development Workflows

### Essential Commands

```bash
npm run dev          # Start with Turbopack (faster)
npm run build        # Production build
npm run lint         # ESLint check
```

### Environment Setup

- Copy `env.example` to `.env.local`
- Requires Supabase project with specific table structure (see `/src/lib/database/`)
- PWA manifest and service worker auto-generated in production

### Testing New Features

1. Always test authentication flow: login → profile creation → store access
2. Test RLS policies: verify users only see their store's data
3. PWA testing: test offline functionality and install prompt
4. Transaction flow: cart → payment → stock update → database persistence

## Integration Points

### Supabase Integration

- **Client**: `/src/lib/supabase.ts` (browser)
- **Server**: `/src/lib/supabase/server.ts` (SSR)
- **Admin**: Service role client in Server Actions for RLS bypass
- **Real-time**: Automatic UI updates when data changes

### Key Server Actions

- `createProductAction()`: Product CRUD with store validation
- `createTransactionAction()`: Complete transaction processing
- Both include extensive error handling and logging

### PWA Configuration

- **Manifest**: `/public/manifest.json` - defines app metadata
- **Service Worker**: Auto-generated, handles caching and offline
- **Install Prompt**: `PWAInstallPrompt.tsx` - auto-shows after 30s

## Common Pitfalls

### RLS Security

- Never bypass RLS unless using service role client
- Always filter by `store_id` in queries
- Test with different user roles (owner/cashier)

### TypeScript Patterns

- Use `Database` types from `supabase.ts` for all queries
- Server Actions must be marked with `"use server"`
- Client components need `"use client"` for hooks/state

### Transaction Handling

- Always update stock within transactions
- Use optimistic updates in UI for better UX
- Handle payment validation (cash amount ≥ total)

### PWA Considerations

- Service worker caches aggressively - test cache invalidation
- Offline functionality limited to cached pages
- Install prompt appears only on HTTPS (or localhost)

## Key Components

### AuthProvider (`/src/hooks/useAuth.tsx`)

Manages authentication state and automatic profile creation post-email verification.

### DashboardLayout (`/src/components/dashboard/DashboardLayout.tsx`)

Main dashboard wrapper with sidebar navigation and user context.

### CartModal (`/src/components/pos/CartModal.tsx`)

Complete POS transaction flow: cart management → payment → confirmation.

### Server Actions Pattern

All database operations use Server Actions for better security and performance than API routes.

## Business Logic

This POS system is specifically designed for Indonesian small businesses with:

- Indonesian currency formatting (IDR)
- Multi-payment methods (cash, card, e-wallet)
- Real-time stock management
- Role-based access (owner/cashier)
- PWA for mobile-first usage

When implementing new features, always consider the multi-tenant store structure and ensure proper RLS policies are in place.
