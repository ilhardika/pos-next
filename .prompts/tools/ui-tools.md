# UI Tools - POS Next.js Project

## Component Development Tools

### 1. shadcn/ui Component Generator

```bash
# Add new shadcn/ui components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add tabs
npx shadcn@latest add accordion
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add progress
npx shadcn@latest add skeleton
npx shadcn@latest add tooltip

# List available components
npx shadcn@latest add --help
```

### 2. Component Validator

```typescript
// src/lib/component-validator.ts
import { z } from "zod";

export const componentPropsSchema = z.object({
  className: z.string().optional(),
  children: z.any().optional(),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional(),
});

export function validateComponentProps<T extends Record<string, any>>(
  props: T,
  schema: z.ZodSchema<T>
): { isValid: boolean; errors?: string[] } {
  try {
    schema.parse(props);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        ),
      };
    }
    return { isValid: false, errors: ["Unknown validation error"] };
  }
}

// Usage in component
interface MyComponentProps {
  title: string;
  count: number;
  isActive?: boolean;
}

const myComponentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  count: z.number().min(0, "Count must be positive"),
  isActive: z.boolean().optional(),
});

export function MyComponent(props: MyComponentProps) {
  const validation = validateComponentProps(props, myComponentSchema);

  if (!validation.isValid) {
    console.warn("Component props validation failed:", validation.errors);
  }

  // Component logic
}
```

### 3. Responsive Design Helper

```typescript
// src/lib/responsive-helpers.ts
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints | null>(
    null
  );

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints["2xl"]) setBreakpoint("2xl");
      else if (width >= breakpoints.xl) setBreakpoint("xl");
      else if (width >= breakpoints.lg) setBreakpoint("lg");
      else if (width >= breakpoints.md) setBreakpoint("md");
      else if (width >= breakpoints.sm) setBreakpoint("sm");
      else setBreakpoint(null);
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);

    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === null || breakpoint === "sm",
    isTablet: breakpoint === "md",
    isDesktop:
      breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl",
  };
}

// Responsive component wrapper
export function ResponsiveWrapper({
  children,
  mobileComponent,
  desktopComponent,
}: {
  children?: React.ReactNode;
  mobileComponent?: React.ReactNode;
  desktopComponent?: React.ReactNode;
}) {
  const { isMobile } = useBreakpoint();

  if (mobileComponent && desktopComponent) {
    return isMobile ? mobileComponent : desktopComponent;
  }

  return children;
}
```

### 4. Theme Utilities

```typescript
// src/lib/theme-utils.ts
export const colors = {
  primary: {
    50: "#f0f9ff",
    500: "#3b82f6",
    900: "#1e3a8a",
  },
  success: {
    50: "#f0fdf4",
    500: "#22c55e",
    900: "#14532d",
  },
  warning: {
    50: "#fffbeb",
    500: "#f59e0b",
    900: "#78350f",
  },
  error: {
    50: "#fef2f2",
    500: "#ef4444",
    900: "#7f1d1d",
  },
} as const;

export function getStatusColor(
  status: "success" | "warning" | "error" | "info"
) {
  switch (status) {
    case "success":
      return "text-green-600 bg-green-50";
    case "warning":
      return "text-yellow-600 bg-yellow-50";
    case "error":
      return "text-red-600 bg-red-50";
    case "info":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export function getCurrencyColor(amount: number) {
  if (amount > 0) return "text-green-600";
  if (amount < 0) return "text-red-600";
  return "text-gray-600";
}
```

## Form Development Tools

### 1. Form Builder Helper

```typescript
// src/lib/form-builder.ts
import { z } from "zod";

export const commonValidations = {
  required: (field: string) => z.string().min(1, `${field} wajib diisi`),
  email: z.string().email("Format email tidak valid"),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[\d\s-()]+$/, "Format nomor telepon tidak valid"),
  positiveNumber: z.number().min(0, "Nilai harus positif"),
  currency: z.number().min(1, "Nilai harus lebih dari 0"),
  nonEmptyArray: (field: string) =>
    z.array(z.any()).min(1, `${field} harus diisi`),
};

export function createFormSchema<T extends Record<string, z.ZodTypeAny>>(
  fields: T
) {
  return z.object(fields);
}

// Usage example
const productFormSchema = createFormSchema({
  name: commonValidations.required("Nama produk"),
  price: commonValidations.currency,
  category: commonValidations.required("Kategori"),
  stock_quantity: commonValidations.positiveNumber,
});

type ProductFormData = z.infer<typeof productFormSchema>;
```

### 2. Input Formatter Utilities

```typescript
// src/lib/input-formatters.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function parseCurrency(value: string): number {
  return parseInt(value.replace(/[^\d]/g, "")) || 0;
}

export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.startsWith("62")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0")) {
    return `+62${cleaned.slice(1)}`;
  }
  return `+62${cleaned}`;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("id-ID", options).format(value);
}

// React hook for formatted inputs
export function useFormattedInput(
  initialValue: string = "",
  formatter: (value: string) => string
) {
  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(formatter(initialValue));

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setDisplayValue(formatter(newValue));
  };

  return {
    value,
    displayValue,
    setValue: handleChange,
  };
}
```

### 3. Form Validation Helper

```typescript
// src/lib/form-validation.ts
export function createFieldValidator<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (value: unknown) => {
      try {
        schema.parse(value);
        return { isValid: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            isValid: false,
            error: error.errors[0]?.message || "Validation error",
          };
        }
        return { isValid: false, error: "Unknown error" };
      }
    },

    validateAsync: async (value: unknown) => {
      try {
        await schema.parseAsync(value);
        return { isValid: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            isValid: false,
            error: error.errors[0]?.message || "Validation error",
          };
        }
        return { isValid: false, error: "Unknown error" };
      }
    },
  };
}

// Usage
const emailValidator = createFieldValidator(z.string().email());
const result = emailValidator.validate("test@example.com");
```

## Layout & Navigation Tools

### 1. Layout Builder

```typescript
// src/components/layout/LayoutBuilder.tsx
interface LayoutConfig {
  header?: boolean;
  sidebar?: boolean;
  footer?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
}

export function LayoutBuilder({
  children,
  config = {},
}: {
  children: React.ReactNode;
  config?: LayoutConfig;
}) {
  const {
    header = true,
    sidebar = true,
    footer = false,
    maxWidth = "full",
    padding = true,
  } = config;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {header && <DashboardHeader />}

      <div className="flex">
        {sidebar && <DashboardSidebar />}

        <main
          className={cn("flex-1", maxWidthClasses[maxWidth], padding && "p-6")}
        >
          {children}
        </main>
      </div>

      {footer && <footer>Footer content</footer>}
    </div>
  );
}
```

### 2. Navigation Helper

```typescript
// src/lib/navigation.ts
export const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "Home",
    roles: ["owner", "cashier"],
  },
  {
    title: "Produk",
    href: "/dashboard/products",
    icon: "Package",
    roles: ["owner", "cashier"],
  },
  {
    title: "Transaksi",
    href: "/dashboard/transactions",
    icon: "ShoppingCart",
    roles: ["owner", "cashier"],
  },
  {
    title: "Laporan",
    href: "/dashboard/reports",
    icon: "BarChart3",
    roles: ["owner"],
  },
  {
    title: "Staff",
    href: "/dashboard/staff",
    icon: "Users",
    roles: ["owner"],
  },
] as const;

export function getNavigationForRole(role: "owner" | "cashier") {
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(href);
}
```

## Component Testing Tools

### 1. Component Test Helper

```typescript
// src/lib/test-utils.tsx
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/hooks/useAuth";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  full_name: "Test User",
  role: "owner" as const,
  store_id: "test-store-id",
};

export const mockProduct = {
  id: "test-product-id",
  name: "Test Product",
  price: 10000,
  stock_quantity: 50,
  category: "Test Category",
  unit: "pcs",
  is_active: true,
  store_id: "test-store-id",
};
```

### 2. Accessibility Testing

```typescript
// src/lib/a11y-helpers.ts
export function checkAccessibility(element: HTMLElement): {
  issues: string[];
  score: number;
} {
  const issues: string[] = [];

  // Check for alt text on images
  const images = element.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.alt) {
      issues.push("Image missing alt text");
    }
  });

  // Check for aria-labels on buttons without text
  const buttons = element.querySelectorAll("button");
  buttons.forEach((button) => {
    if (!button.textContent?.trim() && !button.getAttribute("aria-label")) {
      issues.push("Button missing text or aria-label");
    }
  });

  // Check form labels
  const inputs = element.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    const id = input.id;
    if (id) {
      const label = element.querySelector(`label[for="${id}"]`);
      if (!label && !input.getAttribute("aria-label")) {
        issues.push(`Input missing label: ${id}`);
      }
    }
  });

  const score = Math.max(0, 100 - issues.length * 10);
  return { issues, score };
}
```

## UI Development Commands

### Quick Component Creation

```bash
# Create new component with template
mkdir -p src/components/domain
cat > src/components/domain/ComponentName.tsx << 'EOF'
"use client";

interface ComponentNameProps {
  // Define props
}

export default function ComponentName(props: ComponentNameProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
EOF

# Create component test file
cat > src/components/domain/ComponentName.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName />);
    // Add assertions
  });
});
EOF
```

### UI Development Workflow

```bash
# Start development with component isolation
npm run dev

# Run Storybook (if configured)
npm run storybook

# Test components
npm test -- --watch

# Check accessibility
npm run a11y

# Build and analyze bundle
npm run build && npm run analyze
```

### CSS/Styling Tools

```bash
# Tailwind CSS class sorting
npx prettier --plugin=prettier-plugin-tailwindcss --write .

# Check for unused CSS classes
npx tailwindcss-unused-classes

# Generate Tailwind config intellisense
npx tailwindcss init -p
```
