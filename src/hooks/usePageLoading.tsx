"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function usePageLoading() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return loading;
}
