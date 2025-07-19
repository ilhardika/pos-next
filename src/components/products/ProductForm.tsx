"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  createProductAction,
  updateProductAction,
  checkCategoryUsageAction,
  checkUnitUsageAction,
} from "@/app/actions/products";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputSelect } from "@/components/ui/input-select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Loader2, Save, X } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  price: z.string().min(1, "Harga wajib diisi"),
  cost: z.string().min(1, "Harga beli wajib diisi"),
  stock: z.string().min(1, "Stok wajib diisi"),
  min_stock: z.string().min(1, "Minimum stok wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  unit: z.string().min(1, "Satuan wajib diisi"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    cost: number;
    stock_quantity: number;
    min_stock_level: number;
    category: string;
    unit: string;
    is_active: boolean;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProductForm({
  initialData,
  onCancel,
  onSuccess,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Load saved categories and units from localStorage (user-specific)
  useEffect(() => {
    const loadUserData = async () => {
      // Get current user to make data user-specific
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || "default";

      const savedCategories = localStorage.getItem(`pos-categories-${userId}`);
      const savedUnits = localStorage.getItem(`pos-units-${userId}`);

      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      } else {
        setCategories([
          "Makanan",
          "Minuman",
          "Elektronik",
          "Pakaian",
          "Kesehatan",
          "Kecantikan",
        ]);
      }

      if (savedUnits) {
        setUnits(JSON.parse(savedUnits));
      } else {
        setUnits(["pcs", "kg", "gram", "liter", "ml", "box", "pack"]);
      }
    };

    loadUserData();
  }, []);

  const addCategory = async (newCategory: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "default";

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    localStorage.setItem(
      `pos-categories-${userId}`,
      JSON.stringify(updatedCategories)
    );
    toast.success(`Kategori "${newCategory}" berhasil ditambahkan`);
  };

  const deleteCategory = async (
    categoryToDelete: string,
    force: boolean = false
  ) => {
    if (!force) {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check if category is used in products
      const result = await checkCategoryUsageAction(categoryToDelete, user?.id);

      if (!result.success) {
        toast.error("Gagal mengecek penggunaan kategori: " + result.error);
        return;
      }

      if (result.products.length > 0) {
        const productNames = result.products
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ");
        const moreText =
          result.products.length > 3
            ? ` dan ${result.products.length - 3} lainnya`
            : "";

        // Show custom confirmation dialog
        setConfirmDialog({
          open: true,
          title: "Hapus Kategori",
          description: `Kategori "${categoryToDelete}" digunakan di produk:\n${productNames}${moreText}\n\nApakah Anda yakin ingin menghapus kategori ini?`,
          onConfirm: () => deleteCategory(categoryToDelete, true),
        });
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "default";

    const updatedCategories = categories.filter(
      (cat) => cat !== categoryToDelete
    );
    setCategories(updatedCategories);
    localStorage.setItem(
      `pos-categories-${userId}`,
      JSON.stringify(updatedCategories)
    );
    toast.success(`Kategori "${categoryToDelete}" berhasil dihapus`);
  };

  const addUnit = async (newUnit: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "default";

    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
    localStorage.setItem(`pos-units-${userId}`, JSON.stringify(updatedUnits));
    toast.success(`Satuan "${newUnit}" berhasil ditambahkan`);
  };

  const deleteUnit = async (unitToDelete: string, force: boolean = false) => {
    if (!force) {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check if unit is used in products
      const result = await checkUnitUsageAction(unitToDelete, user?.id);

      if (!result.success) {
        toast.error("Gagal mengecek penggunaan satuan: " + result.error);
        return;
      }

      if (result.products.length > 0) {
        const productNames = result.products
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ");
        const moreText =
          result.products.length > 3
            ? ` dan ${result.products.length - 3} lainnya`
            : "";

        // Show custom confirmation dialog
        setConfirmDialog({
          open: true,
          title: "Hapus Satuan",
          description: `Satuan "${unitToDelete}" digunakan di produk:\n${productNames}${moreText}\n\nApakah Anda yakin ingin menghapus satuan ini?`,
          onConfirm: () => deleteUnit(unitToDelete, true),
        });
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "default";

    const updatedUnits = units.filter((unit) => unit !== unitToDelete);
    setUnits(updatedUnits);
    localStorage.setItem(`pos-units-${userId}`, JSON.stringify(updatedUnits));
    toast.success(`Satuan "${unitToDelete}" berhasil dihapus`);
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price?.toString() || "",
      cost: initialData?.cost?.toString() || "",
      stock: initialData?.stock_quantity?.toString() || "",
      min_stock: initialData?.min_stock_level?.toString() || "5",
      category: initialData?.category || "",
      unit: initialData?.unit || "",
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      const productData = {
        name: values.name,
        description: values.description || null,
        price: parseFloat(values.price),
        cost: parseFloat(values.cost),
        stock_quantity: parseInt(values.stock),
        min_stock_level: parseInt(values.min_stock),
        category: values.category,
        unit: values.unit,
        is_active: true,
      };

      if (initialData) {
        // Update existing product using server action
        const result = await updateProductAction(initialData.id, productData);

        if (!result.success) {
          toast.error("Gagal mengupdate produk: " + result.error);
          return;
        }
        toast.success("Produk berhasil diupdate!");
      } else {
        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Create new product using server action with user ID
        const result = await createProductAction(productData, user?.id);

        if (!result.success) {
          toast.error("Gagal menambah produk: " + result.error);
          return;
        }
        toast.success("Produk berhasil ditambahkan!");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Terjadi kesalahan saat menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Produk" : "Tambah Produk Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama produk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori *</FormLabel>
                    <FormControl>
                      <InputSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Pilih atau ketik kategori"
                        options={categories}
                        onAddOption={addCategory}
                        onDeleteOption={deleteCategory}
                      />
                    </FormControl>
                    <FormDescription>
                      Pilih dari daftar atau ketik kategori baru
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Harga jual ke customer</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Beli *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Harga beli dari supplier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stock */}
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Min Stock */}
              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stok *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alert ketika stok di bawah angka ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan *</FormLabel>
                    <FormControl>
                      <InputSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Pilih atau ketik satuan"
                        options={units}
                        onAddOption={addUnit}
                        onDeleteOption={deleteUnit}
                      />
                    </FormControl>
                    <FormDescription>
                      Pilih dari daftar atau ketik satuan baru
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi produk (opsional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {initialData ? "Update Produk" : "Simpan Produk"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </Card>
  );
}
