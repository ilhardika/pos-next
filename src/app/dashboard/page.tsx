"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StoreInfo } from "@/components/dashboard/StoreInfo";
import { Store, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="mt-2 text-sm text-muted-foreground">
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  Halo, {profile?.full_name || user.email}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Store Information */}
        {profile ? (
          <StoreInfo />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Menyiapkan toko Anda...</CardTitle>
              <CardDescription>
                {user?.email_confirmed_at
                  ? "Membuat toko dan profil Anda. Mohon tunggu sebentar..."
                  : "Silakan verifikasi email Anda untuk menyelesaikan pengaturan toko."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user?.email_confirmed_at && (
                <div className="text-sm text-muted-foreground">
                  <p>Periksa email Anda untuk tautan verifikasi.</p>
                  <p className="mt-2">
                    Email: <strong>{user?.email}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
