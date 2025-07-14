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
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyEmailPage() {
  const [isVerified, setIsVerified] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already verified
    if (user?.email_confirmed_at) {
      setIsVerified(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [user, router]);

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
          <CardContent className="text-center">
            <div className="mb-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Mengarahkan Anda ke dashboard...
            </p>
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

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Klik tautan di email untuk memverifikasi akun Anda dan
              menyelesaikan pengaturan.
            </p>
            <p className="text-xs text-muted-foreground">
              Tidak menerima email? Periksa folder spam atau hubungi dukungan.
            </p>
          </div>

          <div className="pt-4">
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
