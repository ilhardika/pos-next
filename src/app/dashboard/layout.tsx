// AuthGuard temporarily disabled to prevent infinite redirect loop
// import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
