import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const guestName =
    typeof body.guest_name === "string" ? body.guest_name.trim() : "";
  const response = body.response;
  const rsvpId =
    typeof body.rsvp_id === "string" && body.rsvp_id ? body.rsvp_id : null;

  if (response !== "attending" && response !== "declined") {
    return NextResponse.json({ error: "Invalid response" }, { status: 400 });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("submit_invitation_rsvp", {
    gift_slug: slug,
    guest_name: guestName || null,
    rsvp_response: response,
    rsvp_id: rsvpId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data });
}
