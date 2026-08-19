import { Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="bg-brand-gradient grid size-9 place-items-center rounded-xl shadow-soft">
        <Leaf className="size-5 text-primary-foreground" strokeWidth={2.2} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">EcoPath</span>
    </span>
  );
}