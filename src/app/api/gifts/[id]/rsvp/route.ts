import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InvitationRsvp, RsvpSummary } from "@/types/gift";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("id, gift_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!gift) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (gift.gift_type !== "invitation") {
    return NextResponse.json({ error: "Not an invitation" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invitation_rsvps")
    .select("*")
    .eq("gift_id", id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rsvps = (data ?? []) as InvitationRsvp[];
  const attending = rsvps.filter((r) => r.response === "attending");
  const declined = rsvps.filter((r) => r.response === "declined");

  const summary: RsvpSummary = {
    attending,
    declined,
    attending_count: attending.length,
    declined_count: declined.length,
  };

  return NextResponse.json(summary);
}
