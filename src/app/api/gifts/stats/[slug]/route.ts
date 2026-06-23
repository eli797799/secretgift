import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase";

const VALID_STATS = ["view", "scratch", "reveal", "share"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { stat } = await request.json();

  if (!VALID_STATS.includes(stat)) {
    return NextResponse.json({ error: "Invalid stat" }, { status: 400 });
  }

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("increment_gift_stat", {
    gift_slug: slug,
    stat_name: stat,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
