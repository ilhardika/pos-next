"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Store, LogIn, UserPlus } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-8">
          <Store className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem POS</h1>
          <p className="text-gray-600">
            Sistem Point of Sale untuk UMKM Indonesia
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 rounded-md font-medium inline-flex items-center justify-center transition-colors"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Masuk
          </Link>

          <Link
            href="/register"
            className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md font-medium inline-flex items-center justify-center transition-colors"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Daftar
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Kelola toko Anda dengan mudah dan efisien
          </p>
        </div>
      </div>
    </div>
  );
}
