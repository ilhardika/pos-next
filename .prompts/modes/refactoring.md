# Refactoring Mode - POS Next.js Project

## Context

Anda sedang dalam mode refactoring untuk meningkatkan code quality, performance, dan maintainability tanpa mengubah functionality.

## Refactoring Priorities

1. **Type Safety**: Improve TypeScript coverage
2. **Performance**: Optimize database queries dan UI rendering
3. **Code Reusability**: Extract common patterns ke reusable components/hooks
4. **Error Handling**: Standardize error handling patterns
5. **Testing**: Add unit tests untuk critical functions

## Code Quality Checklist

- [ ] Remove unused imports dan variables
- [ ] Consistent naming conventions (camelCase untuk variables, PascalCase untuk components)
- [ ] Extract magic numbers ke constants
- [ ] Add JSDoc comments untuk complex functions
- [ ] Optimize bundle size (dynamic imports untuk large components)

## Performance Optimization

### Database Queries

```typescript
// Before: Multiple queries
const products = await supabase.from("products").select("*");
const categories = await supabase.from("categories").select("*");

// After: Single query with joins
const products = await supabase.from("products").select(`
    *,
    categories:category_id (
      id,
      name
    )
  `);
```

### React Components

```typescript
// Before: Prop drilling
<Component prop1={data} prop2={data.id} prop3={data.name} />;

// After: Context atau composition
const ProductContext = createContext(data);
```

### Bundle Optimization

```typescript
// Dynamic imports untuk large components
const ChartComponent = dynamic(() => import("./ChartComponent"), {
  loading: () => <Loading />,
  ssr: false,
});
```

## Common Refactoring Patterns

### Extract Custom Hooks

```typescript
// Before: Logic scattered di multiple components
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

// After: Custom hook
const { products, loading, refresh } = useProducts();
```

### Extract Server Actions

```typescript
// Before: Database logic di component
const handleSubmit = async () => {
  const { data, error } = await supabase.from("products").insert(formData);
};

// After: Server Action
const result = await createProductAction(formData);
```

### Standardize Error Handling

```typescript
// Create error boundary
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryPrimitive
      fallback={<ErrorFallback />}
      onError={(error) => console.error("App Error:", error)}
    >
      {children}
    </ErrorBoundaryPrimitive>
  );
}
```

## File Organization Improvements

```
// Before: Flat structure
components/
├── ProductForm.tsx
├── ProductList.tsx
├── ProductCard.tsx

// After: Domain-based grouping
components/
├── products/
│   ├── ProductForm.tsx
│   ├── ProductList.tsx
│   └── ProductCard.tsx
├── transactions/
└── shared/
```

## Code Splitting Strategy

```typescript
// Route-based splitting
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));

// Feature-based splitting
const ProductManagement = lazy(() => import("./features/ProductManagement"));
```

## TypeScript Improvements

```typescript
// Before: any types
const handleData = (data: any) => {};

// After: Proper typing
const handleData = (
  data: Database["public"]["Tables"]["products"]["Row"]
) => {};

// Create utility types
type ProductFormData = Pick<Product, "name" | "price" | "category">;
type ProductListItem = Omit<Product, "created_at" | "updated_at">;
```

## Testing Strategy

```typescript
// Unit tests for utilities
// Integration tests for Server Actions
// E2E tests for critical user flows

// Example: Testing Server Actions
import { createProductAction } from "@/app/actions/products";

test("createProductAction should create product successfully", async () => {
  const result = await createProductAction(mockProductData);
  expect(result.success).toBe(true);
});
```

## Refactoring Commands

```bash
# Analyze bundle
npm run build && npx @next/bundle-analyzer

# Find unused exports
npx unimported

# Format code
npx prettier --write .

# Check types
npx tsc --noEmit
```
