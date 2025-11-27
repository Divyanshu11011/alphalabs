import { ResultDetail } from "@/components/results/result-detail";

interface Props {
  params: Promise<{ resultId: string }>;
}

export default async function ResultDetailPage({ params }: Props) {
  const { resultId } = await params;
  
  return <ResultDetail resultId={resultId} />;
}

