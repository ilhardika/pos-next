"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log("[AuthGuard] Checking auth...");
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log(
          "[AuthGuard] User:",
          user ? "Found" : "Not found",
          error ? `Error: ${error.message}` : ""
        );

        if (!mounted) return;

        if (error || !user) {
          console.log("[AuthGuard] No user, redirecting to login...");
          setRedirecting(true);
          const currentPath = window.location.pathname;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        console.log("[AuthGuard] User authenticated, setting user...");
        setUser(user);
      } catch (error) {
        console.error("[AuthGuard] Auth check error:", error);
        if (mounted && !redirecting) {
          setRedirecting(true);
          router.push("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "[AuthGuard] Auth state change:",
        event,
        session ? "Session exists" : "No session"
      );

      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        console.log("[AuthGuard] User signed out, redirecting...");
        setUser(null);
        if (!redirecting) {
          setRedirecting(true);
          router.push("/login");
        }
      } else if (event === "SIGNED_IN" && session) {
        console.log("[AuthGuard] User signed in, setting user...");
        setUser(session.user);
        setRedirecting(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase.auth, redirecting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (redirecting || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Mengalihkan...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
