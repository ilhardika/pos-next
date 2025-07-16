// Simple performance monitoring utilities

export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return fn().finally(() => {
    const end = performance.now();
    const duration = end - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
