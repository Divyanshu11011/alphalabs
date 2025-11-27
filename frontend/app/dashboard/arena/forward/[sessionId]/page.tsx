import { LiveSessionView } from "@/components/arena/forward/live-session-view";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function ForwardTestLivePage({ params }: Props) {
  const { sessionId } = await params;
  
  return <LiveSessionView sessionId={sessionId} />;
}

