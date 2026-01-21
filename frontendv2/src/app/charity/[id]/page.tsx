import { CampaignDetail } from "@/components/charity/campaign-detail";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CampaignPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 flex-grow">
        <div className="mb-8">
            <Link href="/charity" className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <ChevronLeft size={12} /> Return to Grid
            </Link>
        </div>
        
        <CampaignDetail id={parseInt(id)} />
    </div>
  );
}
