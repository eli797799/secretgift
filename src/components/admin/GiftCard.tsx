"use client";

import type { Gift } from "@/types/gift";
import { getGiftUrl, formatDate } from "@/lib/utils";
import { getScratchCards } from "@/lib/gift-cards";
import WhatsAppShareButton, { buildSenderShareMessage } from "@/components/gift/WhatsAppShareButton";
import Link from "next/link";
import InvitationRsvpPanel from "./InvitationRsvpPanel";

interface GiftCardProps {
  gift: Gift;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export default function GiftCard({ gift, onToggle, onDelete }: GiftCardProps) {
  const giftUrl = getGiftUrl(gift.slug);
  const cardCount = getScratchCards(gift).length;

  function copyLink() {
    navigator.clipboard.writeText(giftUrl);
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 ${!gift.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-800 truncate">
          {gift.gift_type === "invitation" ? "🎟️ " : "🎁 "}
          {gift.gift_type === "invitation" ? gift.event_name || gift.title : gift.title}
        </h3>
          <p className="text-gray-500 text-sm truncate mt-1">{gift.message}</p>
        </div>
        <span
          className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
            gift.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {gift.is_active ? "פעיל" : "מושבת"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <StatBadge icon="👁️" label="צפיות" value={gift.view_count} />
        <StatBadge icon="✋" label="גירודים" value={gift.scratch_count} />
        <StatBadge icon="🎉" label="חשיפות" value={gift.reveal_count} />
        <StatBadge icon="📱" label="שיתופים" value={gift.share_count} />
      </div>

      {gift.gift_type === "invitation" && (
        <InvitationRsvpPanel
          giftId={gift.id}
          requireName={gift.rsvp_require_name ?? true}
          compact
        />
      )}

      <div className="text-xs text-gray-400 mb-4">
        {cardCount} כרטיסי גירוד · תפוגה: {formatDate(gift.expiration_date)}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyLink}
          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          📋 העתק קישור
        </button>
        <WhatsAppShareButton
          message={buildSenderShareMessage(giftUrl, gift.title)}
          size="sm"
          label="וואטסאפ"
          className="!w-auto"
        />
        <Link
          href={`/g/${gift.slug}`}
          target="_blank"
          className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
        >
          👁️ תצוגה מקדימה
        </Link>
        <Link
          href={`/dashboard/gifts/${gift.id}/print`}
          className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
        >
          🖨️ הדפס QR
        </Link>
        <Link
          href={`/dashboard/gifts/${gift.id}/edit`}
          className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
        >
          ✏️ עריכה
        </Link>
        <button
          onClick={() => onToggle(gift.id, !gift.is_active)}
          className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {gift.is_active ? "⏸️ השבת" : "▶️ הפעל"}
        </button>
        <button
          onClick={() => {
            if (confirm("האם למחוק את המתנה?")) onDelete(gift.id);
          }}
          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
        >
          🗑️ מחק
        </button>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className="text-lg">{icon}</div>
      <div className="font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
