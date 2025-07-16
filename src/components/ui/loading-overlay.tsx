"use client";

import { usePageLoading } from "@/hooks/usePageLoading";
import { Loading } from "./loading";

export function LoadingOverlay() {
  const loading = usePageLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg border">
        <Loading size="lg" text="Memuat halaman..." />
      </div>
    </div>
  );
}
