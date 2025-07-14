"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Store } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Store className="h-12 w-12 mx-auto text-primary animate-pulse" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">POS System</h1>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
