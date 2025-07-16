---
type: "always_apply"
---

# rules-pos.md

- Use Supabase for authentication, database, and row-level security (RLS).
- Never use Stripe or any third-party payment gateways.
- All user-related data must be scoped by `store_id` to support multi-tenant architecture.
- Every user must belong to a `store_id` (even the owner).
- Every user must have a `role` (either "owner" or "cashier") stored in Supabase.
- Use `shadcn/ui` for all components. Do not write custom HTML/CSS unless unavoidable.
- Use Tailwind CSS for all styling. Avoid plain CSS, SCSS, or CSS modules.
- All form data must be validated using `zod` before any database mutation.
- Write DRY (Don't Repeat Yourself) code. Avoid repetition across pages or features.
- Split logic into utilities/helpers. Keep JSX files clean and declarative.
- Automatically remove unused files, imports, and dead code.
- All user-facing UI text must be written in Bahasa Indonesia.
