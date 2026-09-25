"use client";

import Logo from "@/components/Logo";

export function PageLoader({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[42vh] flex-col items-center justify-center gap-5">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-[loader-spin_1.1s_linear_infinite] rounded-full border-2 border-teal-400/15 border-t-teal-300 border-r-amber-300/70" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-teal-500/15 to-amber-500/10" />
        <Logo size={28} gradientId="pageLoaderMark" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <div className="mx-auto mt-3 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-[loader-dot_1s_ease-in-out_infinite] rounded-full bg-teal-300" />
          <span className="h-1.5 w-1.5 animate-[loader-dot_1s_ease-in-out_0.15s_infinite] rounded-full bg-teal-300/80" />
          <span className="h-1.5 w-1.5 animate-[loader-dot_1s_ease-in-out_0.3s_infinite] rounded-full bg-teal-300/60" />
        </div>
      </div>
    </div>
  );
}
