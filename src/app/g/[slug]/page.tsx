import { createClient } from "@/lib/supabase/server";
import { isGiftExpired } from "@/lib/utils";
import GiftPageClient from "@/components/gift/GiftPageClient";
import type { Gift } from "@/types/gift";

export default async function GiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("gifts").select("*").eq("slug", slug).single();

  if (!data) {
    return <GiftError message="המתנה לא נמצאה" emoji="😕" />;
  }

  const gift = data as Gift;

  if (!gift.is_active) {
    return <GiftError message="המתנה אינה פעילה" emoji="⏸️" />;
  }

  if (isGiftExpired(gift.expiration_date)) {
    return <GiftError message="תוקף המתנה פג" emoji="⏰" />;
  }

  return <GiftPageClient gift={gift} />;
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
