# Authentication Tools - POS Next.js Project

## Authentication Flow Tools

### 1. Auth State Manager

```typescript
// src/lib/auth-manager.ts
import { supabase } from "./supabase";
import type { User, AuthError } from "@supabase/supabase-js";

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  async initialize() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    this.currentUser = session?.user || null;

    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      this.notifyListeners();
    });
  }

  subscribe(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as AuthError).message };
    }
  }

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as AuthError).message };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as AuthError).message };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as AuthError).message };
    }
  }
}
```

### 2. Role-Based Access Control (RBAC)

```typescript
// src/lib/rbac.ts
export type UserRole = "owner" | "cashier";

export const permissions = {
  // Products
  "products:read": ["owner", "cashier"],
  "products:create": ["owner", "cashier"],
  "products:update": ["owner", "cashier"],
  "products:delete": ["owner"],

  // Transactions
  "transactions:read": ["owner", "cashier"],
  "transactions:create": ["owner", "cashier"],
  "transactions:update": ["owner"],
  "transactions:delete": ["owner"],

  // Reports
  "reports:read": ["owner"],
  "reports:export": ["owner"],

  // Staff
  "staff:read": ["owner"],
  "staff:create": ["owner"],
  "staff:update": ["owner"],
  "staff:delete": ["owner"],

  // Store Settings
  "store:read": ["owner"],
  "store:update": ["owner"],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  return permissions[permission].includes(userRole);
}

export function checkPermission(userRole: UserRole, permission: Permission) {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Access denied: Missing permission ${permission}`);
  }
}

// React hook for permission checking
export function usePermissions(userRole?: UserRole) {
  return {
    can: (permission: Permission) =>
      userRole ? hasPermission(userRole, permission) : false,
    cannot: (permission: Permission) =>
      userRole ? !hasPermission(userRole, permission) : true,
    check: (permission: Permission) => {
      if (!userRole) throw new Error("User role not available");
      checkPermission(userRole, permission);
    },
  };
}

// Component wrapper for permission-based rendering
export function PermissionGuard({
  permission,
  userRole,
  children,
  fallback = null,
}: {
  permission: Permission;
  userRole?: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (!userRole || !hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 3. Session Management

```typescript
// src/lib/session-manager.ts
export class SessionManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_MARGIN = 60; // seconds before token expires

  async startSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      this.scheduleRefresh(session.expires_at);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        this.scheduleRefresh(session.expires_at);
      } else if (event === "SIGNED_OUT") {
        this.clearRefreshTimer();
      }
    });
  }

  private scheduleRefresh(expiresAt?: number) {
    this.clearRefreshTimer();

    if (!expiresAt) return;

    const expiresAtMs = expiresAt * 1000;
    const now = Date.now();
    const refreshAt = expiresAtMs - this.REFRESH_MARGIN * 1000;
    const delay = refreshAt - now;

    if (delay > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await supabase.auth.refreshSession();
        } catch (error) {
          console.error("Session refresh failed:", error);
          // Handle refresh failure (redirect to login, etc.)
        }
      }, delay);
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async extendSession() {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  getSessionInfo() {
    const session = supabase.auth.session;
    if (!session) return null;

    const expiresAt = session.expires_at! * 1000;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    return {
      isExpired: timeUntilExpiry <= 0,
      expiresIn: Math.max(0, Math.floor(timeUntilExpiry / 1000)),
      expiresAt: new Date(expiresAt),
      user: session.user,
    };
  }
}
```

### 4. Auth Guards & Middleware

```typescript
// src/lib/auth-guards.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

export async function requireEmailVerification() {
  const user = await requireAuth();

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  return user;
}

export async function requireProfile() {
  const user = await requireEmailVerification();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/complete-profile");
  }

  return { user, profile };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const { profile } = await requireProfile();

  if (!allowedRoles.includes(profile.role as UserRole)) {
    redirect("/dashboard?error=insufficient_permissions");
  }

  return profile;
}

// Component-level auth guards
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireEmailVerification?: boolean;
    requireProfile?: boolean;
    allowedRoles?: UserRole[];
    fallback?: React.ComponentType;
  }
) {
  return function AuthGuardedComponent(props: P) {
    const { user, profile, loading } = useAuth();
    const {
      requireEmailVerification,
      requireProfile,
      allowedRoles,
      fallback: Fallback,
    } = options || {};

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      redirect("/login");
      return null;
    }

    if (requireEmailVerification && !user.email_confirmed_at) {
      redirect("/verify-email");
      return null;
    }

    if (requireProfile && !profile) {
      redirect("/complete-profile");
      return null;
    }

    if (
      allowedRoles &&
      profile &&
      !allowedRoles.includes(profile.role as UserRole)
    ) {
      return Fallback ? <Fallback /> : <div>Access denied</div>;
    }

    return <Component {...props} />;
  };
}
```

## Email Verification Tools

### 1. Email Verification Handler

```typescript
// src/lib/email-verification.ts
export class EmailVerificationManager {
  async sendVerificationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async checkVerificationStatus(userId: string) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { isVerified: false, error: "User not found" };
    }

    return {
      isVerified: !!user.email_confirmed_at,
      verifiedAt: user.email_confirmed_at,
      email: user.email,
    };
  }

  async handleEmailConfirmation(token: string, email: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: "signup",
        email,
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// React component for email verification
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);

  if (!user || user.email_confirmed_at) return null;

  const handleResendEmail = async () => {
    setIsResending(true);
    const manager = new EmailVerificationManager();
    const result = await manager.sendVerificationEmail(user.email!);

    if (result.success) {
      toast.success("Email verifikasi telah dikirim ulang");
    } else {
      toast.error(result.error || "Gagal mengirim email");
    }

    setIsResending(false);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            Email Anda belum diverifikasi. Silakan cek email untuk
            mengkonfirmasi akun.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendEmail}
          disabled={isResending}
        >
          {isResending ? "Mengirim..." : "Kirim Ulang"}
        </Button>
      </div>
    </div>
  );
}
```

### 2. Password Management

```typescript
// src/lib/password-manager.ts
export class PasswordManager {
  // Password strength checker
  checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push("Password minimal 8 karakter");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Tambahkan huruf kecil");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Tambahkan huruf besar");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Tambahkan angka");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("Tambahkan karakter khusus");

    return {
      score,
      feedback,
      isStrong: score >= 4,
    };
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
```

## Development & Testing Tools

### 1. Auth Mock System

```typescript
// src/lib/auth-mock.ts
export class AuthMockSystem {
  private mockUsers = [
    {
      id: "owner-1",
      email: "owner@test.com",
      role: "owner",
      store_id: "store-1",
      email_confirmed_at: new Date().toISOString(),
    },
    {
      id: "cashier-1",
      email: "cashier@test.com",
      role: "cashier",
      store_id: "store-1",
      email_confirmed_at: new Date().toISOString(),
    },
  ];

  async mockSignIn(
    email: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    const user = this.mockUsers.find((u) => u.email === email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Store in localStorage for testing
    localStorage.setItem("mock-auth-user", JSON.stringify(user));

    return { success: true, user };
  }

  getCurrentMockUser() {
    const stored = localStorage.getItem("mock-auth-user");
    return stored ? JSON.parse(stored) : null;
  }

  mockSignOut() {
    localStorage.removeItem("mock-auth-user");
  }

  createMockUser(userData: Partial<(typeof this.mockUsers)[0]>) {
    const user = {
      id: `mock-${Date.now()}`,
      email: userData.email || "test@example.com",
      role: userData.role || "cashier",
      store_id: userData.store_id || "store-1",
      email_confirmed_at: new Date().toISOString(),
      ...userData,
    };

    this.mockUsers.push(user);
    return user;
  }
}

// Development only - enable mock auth
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true"
) {
  window.authMock = new AuthMockSystem();
}
```

### 2. Auth Testing Utilities

```typescript
// src/lib/auth-test-utils.ts
import { createClient } from "@supabase/supabase-js";

export async function createTestUser(
  email: string = "test@example.com",
  password: string = "testpassword123"
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create auth user
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) throw authError;

  // Create user profile
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .insert({
      id: authUser.user.id,
      email,
      full_name: "Test User",
      role: "owner",
      store_id: "test-store-id",
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return { authUser: authUser.user, profile };
}

export async function cleanupTestUser(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("users").delete().eq("id", userId);
  await supabase.auth.admin.deleteUser(userId);
}

export function mockAuthContext(user?: any) {
  return {
    user: user || {
      id: "test-user",
      email: "test@example.com",
      email_confirmed_at: new Date().toISOString(),
    },
    profile: {
      id: "test-user",
      store_id: "test-store",
      role: "owner",
      full_name: "Test User",
    },
    loading: false,
    signOut: jest.fn(),
    refreshProfile: jest.fn(),
  };
}
```

## CLI Commands & Scripts

### Authentication Development Commands

```bash
# Reset user passwords (development only)
npx supabase auth reset-password test@example.com

# List all users
npx supabase auth list-users

# Create test user
npx supabase auth create-user --email=test@example.com --password=password123

# Delete test user
npx supabase auth delete-user <user-id>

# Generate new JWT secret
npx supabase auth generate-secret

# Test auth flow
curl -X POST "http://localhost:54321/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Quick Auth Testing Script

```bash
#!/bin/bash
# scripts/test-auth.sh

echo "Testing authentication flow..."

# Test signup
echo "1. Testing signup..."
curl -s -X POST "http://localhost:54321/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .

# Test signin
echo "2. Testing signin..."
curl -s -X POST "http://localhost:54321/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .

echo "Auth testing complete!"
```
