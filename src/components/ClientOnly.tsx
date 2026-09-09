import { useEffect, useState, type ReactNode } from "react";

export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-cyan-400">Loading Slope...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
