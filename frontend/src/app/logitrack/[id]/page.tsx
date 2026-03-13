import { LogiTrackDetail } from "@/components/logitrack/logitrack-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LogiTrackDetailPage({ params }: Props) {
  const { id } = await params;
  return <LogiTrackDetail id={id} />;
}
