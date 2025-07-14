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
import { Store, User, LogOut } from "lucide-react";
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
            Loading dashboard...
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
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.store_name || "POS Dashboard"}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {profile?.full_name || user.email}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Store Information */}
        {profile ? (
          <StoreInfo />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Setting up your store...</CardTitle>
              <CardDescription>
                {user?.email_confirmed_at
                  ? "Creating your store and profile. This may take a moment..."
                  : "Please verify your email to complete store setup."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user?.email_confirmed_at && (
                <div className="text-sm text-muted-foreground">
                  <p>Check your email for a verification link.</p>
                  <p className="mt-2">
                    Email: <strong>{user?.email}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                User Profile
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.full_name || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile?.role || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Store</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.store_name || "No store assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Authentication Status
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Email Verified</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email_confirmed_at ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Sign In</p>
                  <p className="text-sm text-muted-foreground">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
