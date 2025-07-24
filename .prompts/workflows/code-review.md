# Code Review Workflow - POS Next.js Project

## Overview

Proses code review yang comprehensive untuk memastikan kualitas, keamanan, dan konsistensi dalam pengembangan aplikasi POS multi-tenant.

## Pre-Review Checklist (Author)

### 1. Self-Review

```bash
# Before creating PR, do self-review
git diff main...feature-branch

# Check code formatting
npm run lint
npm run format

# Run tests
npm test
npm run type-check

# Test build
npm run build
```

### 2. PR Preparation

```markdown
## Pull Request Template

### 📝 Description

Brief description of changes and why they're needed.

### 🎯 Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Database migration
- [ ] Performance improvement
- [ ] Refactoring

### 🧪 Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)
- [ ] Mobile testing (if UI changes)

### 📋 Database Changes

- [ ] Migration script included
- [ ] RLS policies updated
- [ ] TypeScript types updated
- [ ] Rollback plan documented

### 🔒 Security Considerations

- [ ] Input validation added
- [ ] Authentication/authorization checked
- [ ] RLS policies reviewed
- [ ] Sensitive data handling verified

### 📱 POS-Specific Checks

- [ ] Multi-tenant isolation maintained
- [ ] Store-based data filtering applied
- [ ] Transaction integrity preserved
- [ ] Stock management working
- [ ] Payment processing tested

### 📸 Screenshots/Videos

(If applicable, add screenshots or videos of the changes)

### 🔗 Related Issues

Closes #[issue_number]
```

## Review Process

### Phase 1: Automated Checks (5 minutes)

#### 1.1 CI/CD Pipeline Validation

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on:
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Lint check
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test

      - name: Build check
        run: npm run build
```

#### 1.2 Automated Security Scan

```bash
# Security vulnerability check
npm audit --audit-level=moderate

# Check for hardcoded secrets
git secrets --scan

# Bundle size check
npm run build && npx bundlesize
```

### Phase 2: Code Review Guidelines (15-30 minutes)

#### 2.1 Architecture & Design Review

```typescript
// ✅ Good: Proper separation of concerns
// Server Action
export async function createProductAction(data: ProductData) {
  // Database logic only
}

// Component
function ProductForm() {
  // UI logic only
  const handleSubmit = async (data) => {
    const result = await createProductAction(data);
    // Handle result
  };
}

// ❌ Bad: Mixed concerns
function ProductForm() {
  const handleSubmit = async (data) => {
    // Direct database call in component
    const { data, error } = await supabase.from("products").insert(data);
  };
}
```

#### 2.2 Security Review Checklist

```typescript
// ✅ Security Best Practices

// 1. Input Validation
const productSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  store_id: z.string().uuid()
});

// 2. RLS Enforcement
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', userStoreId); // Always filter by store

// 3. Authentication Check
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { success: false, error: 'Authentication required' };
}

// 4. Permission Check
if (!hasPermission(userRole, 'products:create')) {
  return { success: false, error: 'Insufficient permissions' };
}

// ❌ Security Issues to Flag

// 1. Missing input validation
function createProduct(data: any) { // No validation

// 2. RLS bypass
const { data } = await supabaseAdmin.from('products').select('*'); // Admin client in user context

// 3. Missing authentication
export async function deleteProduct(id: string) {
  // No auth check
  await supabase.from('products').delete().eq('id', id);
}
```

#### 2.3 POS-Specific Review Points

```typescript
// ✅ POS Best Practices

// 1. Multi-tenant isolation
async function getProducts(storeId: string) {
  return await supabase.from("products").select("*").eq("store_id", storeId); // Always scope to store
}

// 2. Transaction integrity
async function createTransaction(data: TransactionData) {
  // Use database transaction for atomic operations
  const { data: transaction } = await supabase.rpc(
    "create_transaction_with_items",
    data
  );
}

// 3. Stock management
async function updateStock(productId: string, quantity: number) {
  // Use optimistic locking or database functions
  await supabase.rpc("update_product_stock", {
    product_uuid: productId,
    quantity_sold: quantity,
  });
}

// 4. Currency handling
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};
```

#### 2.4 Performance Review

```typescript
// ✅ Performance Best Practices

// 1. Efficient queries
const { data } = await supabase
  .from("transactions")
  .select(
    `
    *,
    transaction_items (
      quantity,
      price,
      products (name)
    )
  `
  )
  .eq("store_id", storeId)
  .limit(50); // Always limit results

// 2. Proper pagination
const { data } = await supabase
  .from("products")
  .select("*")
  .range(offset, offset + limit - 1);

// 3. Component optimization
const MemoizedProductCard = memo(ProductCard);

// 4. Lazy loading
const ReportsPage = lazy(() => import("./ReportsPage"));

// ❌ Performance Issues to Flag

// 1. N+1 queries
for (const transaction of transactions) {
  const items = await supabase
    .from("transaction_items")
    .select("*")
    .eq("transaction_id", transaction.id); // Should use joins
}

// 2. Missing pagination
const allProducts = await supabase.from("products").select("*"); // Could be thousands

// 3. Unnecessary re-renders
function Component({ data }: { data: any[] }) {
  const processedData = data.map((item) => ({ ...item, processed: true })); // Recreated on every render
}
```

### Phase 3: Testing Review (10-15 minutes)

#### 3.1 Test Coverage Review

```typescript
// ✅ Good Test Coverage

describe("Product Actions", () => {
  describe("createProductAction", () => {
    test("should create product successfully", async () => {
      const result = await createProductAction(validProductData);
      expect(result.success).toBe(true);
    });

    test("should validate required fields", async () => {
      const result = await createProductAction({});
      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
    });

    test("should enforce store isolation", async () => {
      const result = await createProductAction({
        ...validProductData,
        store_id: "different-store-id",
      });
      expect(result.success).toBe(false);
    });

    test("should handle database errors", async () => {
      jest.mocked(supabase.from).mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const result = await createProductAction(validProductData);
      expect(result.success).toBe(false);
    });
  });
});
```

#### 3.2 Manual Testing Requirements

```markdown
### Manual Testing Checklist

#### Functional Testing

- [ ] Happy path works as expected
- [ ] Error scenarios handled gracefully
- [ ] Edge cases considered
- [ ] Input validation working

#### Cross-browser Testing (if UI changes)

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### Mobile Testing (if UI changes)

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Responsive breakpoints

#### Role-based Testing

- [ ] Owner permissions
- [ ] Cashier permissions
- [ ] Unauthorized access blocked

#### Data Isolation Testing

- [ ] Store A cannot see Store B data
- [ ] RLS policies enforced
- [ ] Multi-tenant isolation maintained
```

### Phase 4: Documentation Review (5 minutes)

#### 4.1 Code Documentation

````typescript
// ✅ Well-documented code

/**
 * Creates a new product for the authenticated user's store
 *
 * @param data - Product data to create
 * @param data.name - Product name (required, 1-255 chars)
 * @param data.price - Product price in IDR (required, > 0)
 * @param data.category - Product category (required)
 * @param data.stock_quantity - Initial stock (optional, default: 0)
 *
 * @returns Promise resolving to creation result
 * @throws {Error} When authentication fails or validation errors occur
 *
 * @example
 * ```typescript
 * const result = await createProductAction({
 *   name: 'Nasi Ayam',
 *   price: 15000,
 *   category: 'Makanan',
 *   stock_quantity: 100
 * });
 *
 * if (result.success) {
 *   console.log('Product created:', result.data);
 * }
 * ```
 */
export async function createProductAction(data: ProductData) {
  // Implementation
}
````

#### 4.2 API Documentation

````markdown
# API Documentation Updates

## New Endpoint: Create Product

- **Method**: Server Action
- **Function**: `createProductAction`
- **Auth Required**: Yes
- **Permissions**: `products:create`

### Parameters

| Name     | Type   | Required | Description                |
| -------- | ------ | -------- | -------------------------- |
| name     | string | Yes      | Product name (1-255 chars) |
| price    | number | Yes      | Price in IDR (> 0)         |
| category | string | Yes      | Product category           |

### Response

```json
{
  "success": boolean,
  "data": Product | null,
  "error": string | null
}
```
````

````

## Review Comments Templates

### Architecture Comments
```markdown
**Architecture Concern**:
This component is doing too much. Consider splitting into:
- `ProductFormLogic` (data handling)
- `ProductFormUI` (presentation)

**Suggestion**: Extract business logic into a custom hook like `useProductForm()`
````

### Security Comments

````markdown
**Security Issue**:
Missing input validation for user-provided data.

**Recommendation**: Add Zod schema validation:

```typescript
const productSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
});
```
````

### Performance Comments

````markdown
**Performance Issue**:
This query could return thousands of records without pagination.

**Fix**: Add limit and pagination:

```typescript
.limit(50)
.range(offset, offset + limit - 1)
```
````

### POS-Specific Comments

````markdown
**Multi-tenancy Issue**:
Query doesn't filter by store_id, breaking tenant isolation.

**Fix**: Always include store filtering:

```typescript
.eq('store_id', userProfile.store_id)
```
````

## Approval Criteria

### Required for Approval

- [ ] All automated checks pass
- [ ] Security review complete
- [ ] Performance impact assessed
- [ ] Multi-tenancy maintained
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Manual testing completed

### Approval Levels

#### Level 1: Minor Changes

- Bug fixes
- UI improvements
- Documentation updates
  **Approvers**: Any team member (1 approval)

#### Level 2: Feature Changes

- New features
- API changes
- Database schema changes
  **Approvers**: Senior developer + lead (2 approvals)

#### Level 3: Critical Changes

- Security fixes
- Breaking changes
- Infrastructure changes
  **Approvers**: Lead + architect + QA (3 approvals)

## Review Tools & Commands

### Code Review Commands

```bash
# Check diff
git diff main...feature-branch

# Check file changes
git diff --name-only main...feature-branch

# Check specific files
git show HEAD:src/app/actions/products.ts

# Run specific tests for changed files
npm test -- --changedSince=main

# Security scan
npm audit
git secrets --scan

# Performance check
npm run build && npm run analyze
```

### Review Checklist Script

```bash
#!/bin/bash
# scripts/review-checklist.sh

echo "🔍 Running code review checklist..."

echo "✅ Checking linting..."
npm run lint || exit 1

echo "✅ Checking types..."
npx tsc --noEmit || exit 1

echo "✅ Running tests..."
npm test || exit 1

echo "✅ Checking build..."
npm run build || exit 1

echo "✅ Security scan..."
npm audit --audit-level=moderate

echo "✅ All checks passed! Ready for review."
```

## Post-Review Actions

### After Approval

```bash
# Merge PR (squash commits for cleaner history)
git checkout main
git pull origin main
git merge --squash feature-branch
git commit -m "feat: add product management feature

- Add create/update/delete product actions
- Add product form components
- Add validation and error handling
- Add comprehensive tests

Closes #123"

# Deploy
npm run deploy
```

### Follow-up Tasks

- [ ] Monitor deployment for errors
- [ ] Update project documentation
- [ ] Close related issues
- [ ] Update changelog
- [ ] Inform stakeholders of completion

## Review Quality Metrics

### Track Review Effectiveness

- Time to review (target: < 24 hours)
- Bugs found in review vs production
- Review comment resolution rate
- Code quality improvements over time

### Continuous Improvement

- Weekly review retrospectives
- Update review guidelines based on learnings
- Automated check improvements
- Review template updates
