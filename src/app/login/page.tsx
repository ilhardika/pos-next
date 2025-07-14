"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { Store } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="mt-2 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Sistem POS</h1>
          <p className="mt-2 text-sm text-gray-600">
            Point of sale modern untuk UMKM
          </p>
        </div>

        {/* Login Form */}
        <LoginForm onToggleMode={() => router.push("/register")} />

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Dengan melanjutkan, Anda menyetujui Syarat Layanan dan Kebijakan
            Privasi kami
          </p>
        </div>
      </div>
    </div>
  );
}
