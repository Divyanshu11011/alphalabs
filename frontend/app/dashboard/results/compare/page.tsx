import { CompareResults } from "@/components/results/compare-results";
import { PageTransition } from "@/components/ui/page-transition";

// Force dynamic rendering to avoid prerendering errors with useSearchParams
export const dynamic = 'force-dynamic';

export default function CompareResultsPage() {
  return (
    <PageTransition>
      <CompareResults />
    </PageTransition>
  );
}

