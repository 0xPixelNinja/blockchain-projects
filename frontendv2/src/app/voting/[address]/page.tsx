import { PollDetail } from "@/components/voting/poll-detail";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function PollPageWrapper({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  
  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 flex-grow">
        <div className="mb-8">
            <Link href="/voting" className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <ChevronLeft size={12} /> Return to Grid
            </Link>
        </div>
        
        <PollDetail address={address as `0x${string}`} />
    </div>
  );
}
