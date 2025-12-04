import { ForwardTestConfig } from "@/components/arena/forward/forward-test-config";
import { PageTransition } from "@/components/ui/page-transition";

// Force dynamic rendering to avoid prerendering errors with useSearchParams
export const dynamic = 'force-dynamic';

export default function ForwardTestPage() {
  return (
    <PageTransition>
      <ForwardTestConfig />
    </PageTransition>
  );
}

