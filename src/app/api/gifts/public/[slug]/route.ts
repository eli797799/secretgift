import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isGiftExpired } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("gifts").select("*").eq("slug", slug).single();

  if (error || !data) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  if (!data.is_active) {
    return NextResponse.json({ error: "Gift is disabled" }, { status: 403 });
  }

  if (isGiftExpired(data.expiration_date)) {
    return NextResponse.json({ error: "Gift has expired" }, { status: 410 });
  }

  return NextResponse.json(data);
}
