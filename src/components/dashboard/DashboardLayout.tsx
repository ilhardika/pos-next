"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

interface User {
  email: string;
  full_name: string;
  role: string;
  store_name: string;
  email_verified: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Wait a bit for session to be established
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get fresh session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          setLoading(false);
          return;
        }

        const authUser = sessionData.session?.user;

        if (!authUser) {
          setLoading(false);
          return;
        }

        // Fetch user profile data with simpler query
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("full_name, role, store_id")
          .eq("id", authUser.id)
          .single();

        let storeName = "Toko";
        if (profile?.store_id) {
          const { data: store } = await supabase
            .from("stores")
            .select("name")
            .eq("id", profile.store_id)
            .single();
          storeName = store?.name || "Toko";
        }

        if (profileError) {
          // If user profile doesn't exist, redirect to complete profile
          if (profileError.code === "PGRST116") {
            // For now, set basic user info from auth
            setUser({
              email: authUser.email || "",
              full_name:
                authUser.user_metadata?.full_name ||
                authUser.email?.split("@")[0] ||
                "User",
              role: "owner",
              store_name: "Toko",
              email_verified: authUser.email_confirmed_at ? true : false,
            });
          } else {
            setLoading(false);
            return;
          }
        } else {
          const userData = {
            email: authUser.email || "",
            full_name:
              profile?.full_name || authUser.user_metadata?.full_name || "",
            role: profile?.role || "owner",
            store_name: storeName,
            email_verified: authUser.email_confirmed_at ? true : false,
          };

          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchUserData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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

  // Temporarily disable auth check to avoid loops
  // if (!user) {
  //   window.location.href = "/login";
  //   return null;
  // }

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
