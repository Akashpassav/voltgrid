"use client";

import dynamic from "next/dynamic";
import type { LiveStation, OptimizedRoute } from "@/lib/types";

const Inner = dynamic(() => import("./MapCanvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-line bg-navy-900 text-sm text-mute">
      Loading corridor map…
    </div>
  ),
});

export function RouteMap(props: {
  stations: LiveStation[];
  route?: OptimizedRoute | null;
  recommendedIds?: string[];
}) {
  return <Inner {...props} />;
}
