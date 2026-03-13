"use client";

import { useParams } from "next/navigation";
import { LandDetail } from "@/components/ledgeland/land-detail";

export default function LedgeLandDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <LandDetail id={id} />;
}
