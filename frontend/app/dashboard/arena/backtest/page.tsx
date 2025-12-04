import { BacktestConfig } from "@/components/arena/backtest/backtest-config";
import { PageTransition } from "@/components/ui/page-transition";

// Force dynamic rendering to avoid prerendering errors with useSearchParams
export const dynamic = 'force-dynamic';

export default function BacktestPage() {
  return (
    <PageTransition>
      <BacktestConfig />
    </PageTransition>
  );
}

