import { createPublicClient } from "@/lib/supabase";
import { isGiftExpired } from "@/lib/utils";
import InvitationPageClient from "@/components/gift/InvitationPageClient";
import { redirect } from "next/navigation";
import type { Gift } from "@/types/gift";

export default async function InvitationDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data } = await supabase.from("gifts").select("*").eq("slug", slug).single();

  if (!data) {
    return <GiftError message="ההזמנה לא נמצאה" emoji="😕" />;
  }

  const gift = data as Gift;

  if ((gift.gift_type ?? "gift") !== "invitation") {
    redirect(`/g/${slug}`);
  }

  if (!gift.is_active) {
    return <GiftError message="ההזמנה אינה פעילה" emoji="⏸️" />;
  }

  if (isGiftExpired(gift.expiration_date)) {
    return <GiftError message="תוקף ההזמנה פג" emoji="⏰" />;
  }

  return <InvitationPageClient gift={gift} startRevealed />;
}

function GiftError({ message, emoji }: { message: string; emoji: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 p-6">
      <div className="text-center text-white">
        <div className="text-7xl mb-4">{emoji}</div>
        <h1 className="text-2xl font-bold">{message}</h1>
      </div>
    </div>
  );
}
