/**
 * /helpline — EV Emergency Assistance Page Shell (NEW FILE)
 *
 * This is a server component that wraps the interactive client content
 * in a Suspense boundary. Required by Next.js App Router when using
 * useSearchParams() in a client component.
 *
 * No existing file is modified.
 */

import { Suspense } from "react";
import HelplineContent from "./HelplineContent";

export default function HelplinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-mute">
          Loading EV Emergency Assistance…
        </div>
      }
    >
      <HelplineContent />
    </Suspense>
  );
}
