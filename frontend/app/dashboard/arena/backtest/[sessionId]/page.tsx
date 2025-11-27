import { BattleScreen } from "@/components/arena/backtest/battle-screen";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function BacktestBattlePage({ params }: Props) {
  const { sessionId } = await params;
  
  return <BattleScreen sessionId={sessionId} />;
}

