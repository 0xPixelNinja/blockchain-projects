import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json({ error: "Pinata not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const pinataForm = new FormData();
  pinataForm.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: pinataForm,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Pinata upload failed", details: err }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ ipfsHash: data.IpfsHash });
}
