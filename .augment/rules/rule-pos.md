---
type: "always_apply"
---

# rules-pos.md

- Use Supabase for authentication, database, and row-level security.
- Never use Stripe or any other third-party payment providers.
- All data must be scoped by `store_id` to support multi-tenant architecture.
- Every user must be assigned a `role` (either "owner" or "cashier").
- Every user must belong to a `store_id` (even owners).
- Use `shadcn/ui` components for all UI elements. Do not create custom-styled HTML unless necessary.
- Use Tailwind CSS for all styling. Avoid plain CSS or SCSS.
- Validate form inputs with `zod` before any write action (especially mutations).
- Follow a DRY (Don't Repeat Yourself) principle in all code.
- Follow a clean code structure: split logic into utilities, use reusable components, and avoid inline business logic in JSX.
- Auto delete unused codes or files
- All System Language text use "Bahasa Indonesia"
