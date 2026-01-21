import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { NextRequest, NextResponse } from "next/server";
import { CHARITY_ADDRESS, CHARITY_ABI } from "@/lib/contracts";

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const campaign = await client.readContract({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "getCampaign",
      args: [BigInt(id)],
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      charityAddress: campaign.charityAddress,
      totalDonated: campaign.totalDonated,
      active: campaign.active,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}
