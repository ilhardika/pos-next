import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createStoreAndProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      // Exchange the code for a session
      const {
        data: { user },
        error,
      } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_error", request.url)
        );
      }

      if (user) {
        // Check if user already has a profile
        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        // If no profile exists and user is confirmed, create store and profile
        if (!existingProfile && user.email_confirmed_at) {
          const fullName =
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User";
          const storeName =
            user.user_metadata?.store_name || `${fullName}'s Store`;

          try {
            await createStoreAndProfile(
              user.id,
              user.email!,
              fullName,
              storeName
            );
          } catch (createError) {
            console.error("Error creating store and profile:", createError);
            // Don't fail the auth flow, just log the error
          }
        }
      }

      // Redirect to the dashboard or specified next URL
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error("Unexpected error in auth callback:", error);
      return NextResponse.redirect(
        new URL("/login?error=server_error", request.url)
      );
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}
