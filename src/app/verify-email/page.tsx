"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      // Refresh user data from Supabase
      const {
        data: { user: refreshedUser },
      } = await supabase.auth.getUser();
      if (refreshedUser?.email_confirmed_at) {
        setIsVerified(true);
        // Also refresh the profile data
        await refreshProfile();
      }
    } catch (error) {
      console.error("Error refreshing user status:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check if user is already verified
    if (user?.email_confirmed_at) {
      setIsVerified(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="mt-2 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Email Terverifikasi!
            </CardTitle>
            <CardDescription className="text-center">
              Akun Anda telah berhasil diverifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mb-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Selamat! Email Anda telah berhasil diverifikasi. Sekarang Anda
              dapat mengakses dashboard dan mulai menggunakan aplikasi POS.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
                size="lg"
              >
                Masuk ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Periksa Email Anda
          </CardTitle>
          <CardDescription className="text-center">
            Kami telah mengirimkan tautan verifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="mb-4">
            <Mail className="h-12 w-12 mx-auto text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Kami telah mengirim tautan verifikasi ke:
            </p>
            <p className="font-medium text-sm">
              {user?.email || "alamat email Anda"}
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Langkah selanjutnya:
              </p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Buka email dari aplikasi POS di kotak masuk Anda</li>
                <li>
                  Klik tautan &quot;Verifikasi Email&quot; dalam email tersebut
                </li>
                <li>Setelah berhasil, kembali ke halaman ini</li>
                <li>Klik &quot;Periksa Status Verifikasi&quot; di bawah</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground">
              Tidak menerima email? Periksa folder spam atau tunggu beberapa
              menit lagi.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="w-full"
              variant="default"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Memeriksa Status...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Periksa Status Verifikasi
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Masuk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
