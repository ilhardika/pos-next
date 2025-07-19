"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUpWithStore } from "@/lib/auth";
import { Loader2, Eye, EyeOff, Store } from "lucide-react";

interface SignupFormProps {
  onToggleMode?: () => void;
}

export function SignupForm({ onToggleMode }: SignupFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    storeName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi tidak cocok");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Kata sandi harus minimal 6 karakter");
      return false;
    }

    if (!formData.fullName.trim()) {
      setError("Nama lengkap wajib diisi");
      return false;
    }

    if (!formData.storeName.trim()) {
      setError("Nama toko wajib diisi");
      return false;
    }

    // Allow all email domains - verification status will be shown in profile

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { user } = await signUpWithStore(
        formData.email,
        formData.password,
        formData.fullName,
        formData.storeName
      );

      if (user) {
        setSuccess(true);
        // Note: Store creation will be handled in Task 4
        setTimeout(() => {
          router.push("/verify-email");
        }, 2000);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Terjadi kesalahan saat mendaftar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Akun Berhasil Dibuat!
          </CardTitle>
          <CardDescription className="text-center">
            Silakan periksa email Anda untuk memverifikasi akun
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4">
            <Store className="h-12 w-12 mx-auto text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Kami telah mengirim tautan verifikasi ke{" "}
            <strong>{formData.email}</strong>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Buat Akun
        </CardTitle>
        <CardDescription className="text-center">
          Siapkan sistem POS Anda dalam hitungan menit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName">Nama Toko</Label>
            <Input
              id="storeName"
              name="storeName"
              type="text"
              placeholder="Masukkan nama toko Anda"
              value={formData.storeName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contoh: demo@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Buat kata sandi"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi kata sandi Anda"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat akun...
              </>
            ) : (
              "Buat Akun"
            )}
          </Button>
        </form>

        {onToggleMode && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={onToggleMode}
                disabled={loading}
              >
                Masuk di sini
              </Button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
