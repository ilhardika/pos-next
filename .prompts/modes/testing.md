# Testing Mode - POS Next.js Project

## Context

Anda sedang dalam mode testing untuk memastikan quality dan reliability aplikasi POS. Fokus pada testing strategy yang comprehensive dan practical.

## Testing Strategy

### 1. Unit Testing

- **Utilities & Helpers**: Pure functions di `/src/lib/`
- **Custom Hooks**: React hooks dengan mock data
- **Server Actions**: Database operations dengan test database

### 2. Integration Testing

- **Authentication Flow**: Login → Profile → Store access
- **Transaction Flow**: Cart → Payment → Database → Stock update
- **Real-time Updates**: Supabase subscriptions

### 3. E2E Testing

- **Critical User Journeys**: Complete POS transaction flow
- **PWA Functionality**: Install prompt, offline capability
- **Multi-tenant Isolation**: Different stores can't access each other's data

## Test Environment Setup

### Database Testing

```bash
# Setup test Supabase instance
npx supabase start
npx supabase db reset

# Run migrations
npx supabase db push
```

### Mock Data

```typescript
// Test fixtures
export const mockProduct = {
  id: "test-product-1",
  name: "Test Product",
  price: 25000,
  stock_quantity: 100,
  category: "Makanan",
  unit: "pcs",
  is_active: true,
  store_id: "test-store-1",
};

export const mockUser = {
  id: "test-user-1",
  email: "test@example.com",
  full_name: "Test User",
  role: "owner",
  store_id: "test-store-1",
};
```

## Testing Patterns

### Server Actions Testing

```typescript
import { createProductAction } from "@/app/actions/products";

describe("Product Actions", () => {
  beforeEach(async () => {
    // Setup test store and user
    await setupTestData();
  });

  test("should create product successfully", async () => {
    const result = await createProductAction(mockProduct, "test-user-1");

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: mockProduct.name,
      price: mockProduct.price,
    });
  });

  test("should handle duplicate product names", async () => {
    await createProductAction(mockProduct, "test-user-1");
    const result = await createProductAction(mockProduct, "test-user-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("sudah ada");
  });
});
```

### React Component Testing

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "@/hooks/useAuth";
import ProductForm from "@/components/products/ProductForm";

test("ProductForm should submit valid data", async () => {
  render(
    <AuthProvider>
      <ProductForm onSubmit={jest.fn()} />
    </AuthProvider>
  );

  fireEvent.change(screen.getByLabelText("Nama Produk"), {
    target: { value: "Test Product" },
  });

  fireEvent.click(screen.getByText("Simpan"));

  await waitFor(() => {
    expect(screen.getByText("Produk berhasil ditambahkan")).toBeInTheDocument();
  });
});
```

### RLS Testing

```typescript
describe("Row Level Security", () => {
  test("users should only see their store products", async () => {
    // Create two stores with different users
    const store1Products = await getProductsForUser("user-store-1");
    const store2Products = await getProductsForUser("user-store-2");

    // Verify isolation
    expect(store1Products).not.toContainEqual(
      expect.objectContaining({ store_id: "store-2" })
    );
  });
});
```

## Manual Testing Checklist

### Authentication Flow

- [ ] Sign up dengan email baru
- [ ] Verify email dari inbox
- [ ] Auto-redirect ke dashboard
- [ ] Profile dan store dibuat otomatis
- [ ] Logout dan login ulang

### Product Management

- [ ] Create product dengan semua fields
- [ ] Edit product existing
- [ ] Delete product (soft delete)
- [ ] Search dan filter products
- [ ] Stock quantity validation

### Transaction Flow

- [ ] Add products to cart
- [ ] Update quantities di cart
- [ ] Remove items dari cart
- [ ] Select payment method
- [ ] Process payment dengan validation
- [ ] Verify stock berkurang
- [ ] Check transaction tersimpan

### PWA Functionality

- [ ] Install prompt muncul setelah 30 detik
- [ ] App bisa di-install di home screen
- [ ] Offline functionality (cached pages)
- [ ] Service worker caching working

### Responsive Design

- [ ] Mobile layout (< 768px)
- [ ] Tablet layout (768px - 1024px)
- [ ] Desktop layout (> 1024px)
- [ ] Touch interactions di mobile

## Performance Testing

### Database Performance

```typescript
// Test query performance
console.time("products-query");
const products = await supabase
  .from("products")
  .select("*")
  .eq("store_id", storeId);
console.timeEnd("products-query");
```

### Bundle Size

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for large dependencies
npx bundlesize
```

### Lighthouse Testing

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 85
- PWA: All checks passing

## Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test ProductForm.test.tsx

# Generate coverage report
npm test -- --coverage

# E2E tests (if using Playwright)
npm run test:e2e
```

## Test Data Cleanup

```typescript
afterEach(async () => {
  // Clean up test data
  await supabase.from("transaction_items").delete().match({});
  await supabase.from("transactions").delete().match({});
  await supabase.from("products").delete().match({});
  await supabase.from("users").delete().match({});
  await supabase.from("stores").delete().match({});
});
```
