import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { NextRequest, NextResponse } from "next/server";
import { VOTING_ADDRESS, VOTING_ABI } from "@/lib/contracts";

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
    const candidate = await client.readContract({
      address: VOTING_ADDRESS,
      abi: VOTING_ABI,
      functionName: "getCandidate",
      args: [BigInt(id)],
    });

    return NextResponse.json({
      id: candidate.id,
      name: candidate.name,
      voteCount: candidate.voteCount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
  }
}
