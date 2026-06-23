"use client";

import type { Gift } from "@/types/gift";
import GiftExperienceClient from "./GiftExperienceClient";
import InvitationPageClient from "./InvitationPageClient";

interface GiftPageClientProps {
  gift: Gift;
}

export default function GiftPageClient({ gift }: GiftPageClientProps) {
  if ((gift.gift_type ?? "gift") === "invitation") {
    return <InvitationPageClient gift={gift} />;
  }
  return <GiftExperienceClient gift={gift} />;
}
