# UI Component Template

## Component Request Template

````
### Component Purpose
[Jelaskan tujuan dan fungsi component ini]

### Component Type
- [ ] Form component (input, validation)
- [ ] Display component (table, card, list)
- [ ] Layout component (header, sidebar, wrapper)
- [ ] Interactive component (modal, dropdown, tabs)
- [ ] Feedback component (toast, loading, error)

### Props Interface
```typescript
interface ComponentProps {
  // Define expected props
}
````

### Design Requirements

- [ ] Consistent dengan shadcn/ui design system
- [ ] Responsive (mobile-first)
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

### Behavior Requirements

- [ ] Form validation (jika applicable)
- [ ] Data fetching (jika applicable)
- [ ] Real-time updates (jika applicable)
- [ ] Optimistic updates (jika applicable)

### Integration Requirements

- [ ] Authentication integration
- [ ] Database integration via Server Actions
- [ ] Toast notifications
- [ ] Error handling

````

## Component Templates

### 1. Form Component Template
```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  // Add other fields
});

type FormData = z.infer<typeof formSchema>;

interface ComponentFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function ComponentForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}: ComponentFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      // Set default values
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      const result = await onSubmit(data);

      if (result.success) {
        toast.success("Data berhasil disimpan");
        form.reset();
      } else {
        toast.error(result.error || "Gagal menyimpan data");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan yang tidak terduga");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input
                  placeholder="Masukkan nama"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Masukkan email"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Batal
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
````

### 2. Data Table Component Template

```typescript
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface DataItem {
  id: string;
  name: string;
  status: "active" | "inactive";
  created_at: string;
  // Add other fields
}

interface DataTableProps {
  data: DataItem[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (item: DataItem) => void;
  onDelete?: (item: DataItem) => void;
  onRefresh?: () => void;
}

export default function DataTable({
  data,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  {searchQuery
                    ? "Tidak ada data yang sesuai dengan pencarian"
                    : "Belum ada data"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "active" ? "default" : "secondary"
                      }
                    >
                      {item.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### 3. Modal Component Template

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalComponentProps {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ModalComponent({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: ModalComponentProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const modalOpen = isControlled ? open : internalOpen;
  const setModalOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Loading Component Template

```typescript
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function Loading({
  size = "md",
  text,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-gray-600",
          sizeClasses[size]
        )}
      />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
}
```

## Component Best Practices

### 1. Props Design

```typescript
// Good: Clear, specific props
interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  showActions?: boolean;
}

// Avoid: Generic, unclear props
interface ProductCardProps {
  data: any;
  onClick: () => void;
  config?: object;
}
```

### 2. Error Boundaries

```typescript
"use client";

import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold text-red-600 mb-2">
        Terjadi Kesalahan
      </h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Coba Lagi</Button>
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

### 3. Accessibility

```typescript
// Always include ARIA labels and keyboard support
<Button
  aria-label="Hapus produk"
  onClick={() => onDelete(product.id)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      onDelete(product.id);
    }
  }}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### 4. Performance Optimization

```typescript
import { memo } from "react";

// Memoize expensive components
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* Complex rendering */}</div>;
});

// Use callback memoization
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id);
  },
  [onItemClick]
);
```
