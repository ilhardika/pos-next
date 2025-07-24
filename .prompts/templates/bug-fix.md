# Bug Fix Template

## Bug Report Template

```
### Bug Description
[Jelaskan bug yang terjadi dengan jelas dan spesifik]

### Steps to Reproduce
1. [Langkah 1]
2. [Langkah 2]
3. [Langkah 3]

### Expected Behavior
[Apa yang seharusnya terjadi]

### Actual Behavior
[Apa yang sebenarnya terjadi]

### Environment
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile/Tablet]
- Screen size: [if relevant]
- User role: [owner/cashier]

### Error Messages
```

[Copy paste error messages dari console]

```

### Screenshots/Videos
[Attach jika diperlukan]

### Impact Level
- [ ] Critical (app tidak bisa digunakan)
- [ ] High (fitur utama tidak berfungsi)
- [ ] Medium (fitur sekunder bermasalah)
- [ ] Low (UI issue, typo, dll)

### Affected Users
- [ ] All users
- [ ] Specific role: [specify]
- [ ] Specific browser: [specify]
- [ ] Specific device: [specify]
```

## Bug Investigation Process

### 1. Information Gathering

- Reproduce the bug locally
- Check browser console for errors
- Review recent code changes
- Check Supabase logs
- Verify user permissions and data

### 2. Root Cause Analysis

```typescript
// Debug checklist
console.log("User:", user);
console.log("Profile:", profile);
console.log("Store ID:", storeId);
console.log("Form data:", formData);
console.log("API response:", response);
```

### 3. Common Bug Categories

#### Authentication Issues

- Session expired
- Email not verified
- Profile not created
- Store access denied

#### Database Issues

- RLS policies blocking access
- Missing foreign key relations
- Data type mismatches
- Constraint violations

#### UI/UX Issues

- Form validation errors
- Loading states not working
- Responsive design breaks
- Accessibility issues

#### Performance Issues

- Slow database queries
- Large bundle sizes
- Memory leaks
- Network timeouts

## Bug Fix Templates

### Database Fix Template

```typescript
// Before (problematic code)
const { data } = await supabase.from("products").select("*"); // Missing store filtering

// After (fixed code)
const { data } = await supabase
  .from("products")
  .select("*")
  .eq("store_id", userProfile.store_id); // Added store filtering
```

### Error Handling Fix Template

```typescript
// Before (no error handling)
const result = await createProduct(data);
toast.success("Product created");

// After (proper error handling)
try {
  const result = await createProduct(data);
  if (result.success) {
    toast.success("Product created successfully");
  } else {
    toast.error(result.error || "Failed to create product");
  }
} catch (error) {
  console.error("Unexpected error:", error);
  toast.error("Terjadi kesalahan yang tidak terduga");
}
```

### TypeScript Fix Template

```typescript
// Before (type errors)
const handleSubmit = (data: any) => {
  // ...
};

// After (proper typing)
const handleSubmit = (data: ProductFormData) => {
  // ...
};
```

### Performance Fix Template

```typescript
// Before (inefficient)
const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);

useEffect(() => {
  fetchProducts();
  fetchCategories();
}, []);

// After (optimized)
const { data: productsWithCategories } = useSWR(
  "products-with-categories",
  () =>
    supabase.from("products").select(`
      *,
      categories:category_id (
        id,
        name
      )
    `)
);
```

## Testing Fix

### Unit Test for Bug Fix

```typescript
describe("Bug Fix: [Bug Description]", () => {
  test("should handle [specific scenario]", async () => {
    // Arrange
    const mockData = createMockData();

    // Act
    const result = await functionUnderTest(mockData);

    // Assert
    expect(result).toEqual(expectedResult);
  });

  test("should not break existing functionality", async () => {
    // Regression test
    const existingScenario = createExistingScenario();
    const result = await functionUnderTest(existingScenario);
    expect(result).toBeDefined();
  });
});
```

### Manual Testing Checklist

- [ ] Bug is fixed
- [ ] No regression in existing features
- [ ] Works across different browsers
- [ ] Works on mobile devices
- [ ] Error handling works properly
- [ ] Loading states work correctly

## Deployment Checklist

- [ ] Fix tested locally
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Code review completed
- [ ] Database migrations (if needed)
- [ ] Environment variables updated (if needed)
- [ ] Documentation updated (if needed)

## Hot Fix Process (Critical Bugs)

1. **Immediate Response**

   - Acknowledge the issue
   - Assess impact and priority
   - Create hotfix branch

2. **Quick Fix**

   - Minimal code changes
   - Focus on immediate resolution
   - Skip non-critical improvements

3. **Fast Deployment**

   - Direct deployment to production
   - Monitor closely
   - Prepare rollback plan

4. **Follow-up**
   - Document the issue
   - Plan comprehensive fix
   - Review prevention measures
