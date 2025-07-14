"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

interface User {
  email: string;
  full_name: string;
  role: string;
  store_name: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error("Auth error:", authError);
          setLoading(false);
          return;
        }

        // Fetch user profile data
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select(
            `
            full_name,
            role,
            stores (
              name
            )
          `
          )
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          setLoading(false);
          return;
        }

        console.log("Profile data:", profile);

        setUser({
          email: authUser.email || "",
          full_name: profile?.full_name || "",
          role: profile?.role || "cashier",
          store_name: profile?.stores?.name || "Toko",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        userRole={user?.role}
      />

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <DashboardHeader onMenuToggle={handleSidebarToggle} user={user} />

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-6 py-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
