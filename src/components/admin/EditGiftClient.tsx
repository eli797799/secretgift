"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import GiftForm from "./GiftForm";
import type { Gift, GiftFormData } from "@/types/gift";
import { giftToFormData } from "@/lib/gift-cards";
import { getGiftUrl } from "@/lib/utils";
import WhatsAppShareButton, { buildSenderShareMessage } from "@/components/gift/WhatsAppShareButton";

interface EditGiftClientProps {
  gift: Gift;
}

export default function EditGiftClient({ gift }: EditGiftClientProps) {
  const router = useRouter();

  const initialData = giftToFormData(gift);

  async function handleSubmit(data: GiftFormData) {
    const res = await fetch(`/api/gifts/${gift.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
              →
            </Link>
            <h1 className="text-xl font-bold text-gray-800">עריכת מתנה</h1>
          </div>
          <Link
            href={`/g/${gift.slug}`}
            target="_blank"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            תצוגה מקדימה
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm space-y-3">
          <div>
            <span className="font-medium text-blue-700">קישור: </span>
            <span className="text-blue-600 break-all">{getGiftUrl(gift.slug)}</span>
          </div>
          <WhatsAppShareButton
            message={buildSenderShareMessage(getGiftUrl(gift.slug), gift.title)}
            size="sm"
            label="שלח בוואטסאפ"
            className="!w-auto"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <MiniStat label="צפיות" value={gift.view_count} />
          <MiniStat label="גירודים" value={gift.scratch_count} />
          <MiniStat label="חשיפות" value={gift.reveal_count} />
          <MiniStat label="שיתופים" value={gift.share_count} />
        </div>

        <GiftForm initialData={initialData} onSubmit={handleSubmit} submitLabel="שמור שינויים" />
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg p-3 text-center border">
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
