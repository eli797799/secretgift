import type { Gift, ScratchCardItem, GiftFormData } from "@/types/gift";

export const DEFAULT_SCRATCH_CARD: ScratchCardItem = {
  hidden_reveal_type: "text",
  hidden_scratch_text: "",
  hidden_scratch_image_url: null,
  scratch_cover_type: "gray",
  scratch_cover_image_url: null,
};

function normalizeScratchCard(card: ScratchCardItem): ScratchCardItem {
  return {
    hidden_reveal_type: card.hidden_reveal_type ?? (card.hidden_scratch_image_url ? "image" : "text"),
    hidden_scratch_text: card.hidden_scratch_text ?? "",
    hidden_scratch_image_url: card.hidden_scratch_image_url ?? null,
    scratch_cover_type: card.scratch_cover_type ?? "gray",
    scratch_cover_image_url: card.scratch_cover_image_url ?? null,
  };
}

export function getScratchCards(gift: Pick<Gift, "scratch_cards" | "hidden_scratch_text" | "scratch_cover_type" | "scratch_cover_image_url">): ScratchCardItem[] {
  if (gift.scratch_cards && gift.scratch_cards.length > 0) {
    return gift.scratch_cards.map(normalizeScratchCard);
  }
  return [
    normalizeScratchCard({
      hidden_reveal_type: "text",
      hidden_scratch_text: gift.hidden_scratch_text,
      hidden_scratch_image_url: null,
      scratch_cover_type: gift.scratch_cover_type,
      scratch_cover_image_url: gift.scratch_cover_image_url,
    }),
  ];
}

export function giftToFormData(gift: Gift): GiftFormData {
  return {
    gift_type: gift.gift_type ?? "gift",
    title: gift.title,
    message: gift.message,
    event_name: gift.event_name,
    event_datetime: gift.event_datetime,
    event_location: gift.event_location,
    scratch_cards: getScratchCards(gift),
    background_image_url: gift.background_image_url,
    expiration_date: gift.expiration_date,
    reveal_animation: gift.reveal_animation,
    winner_image_type: gift.winner_image_type,
    winner_image_url: gift.winner_image_url,
    owner_whatsapp: gift.owner_whatsapp,
    custom_sound_url: gift.custom_sound_url,
    scratch_sound_enabled: gift.scratch_sound_enabled ?? true,
    rsvp_require_name: gift.rsvp_require_name ?? true,
    is_active: gift.is_active,
  };
}

export function prepareGiftPayload(body: GiftFormData) {
  const first = body.scratch_cards[0] ?? DEFAULT_SCRATCH_CARD;
  const isInvitation = body.gift_type === "invitation";
  return {
    ...body,
    title: isInvitation ? (body.event_name?.trim() || body.title) : body.title,
    hidden_scratch_text: isInvitation
      ? first.hidden_scratch_text || "אתה מוזמן! 🎉"
      : first.hidden_scratch_text,
    scratch_cover_type: first.scratch_cover_type,
    scratch_cover_image_url: first.scratch_cover_image_url,
    scratch_cards: isInvitation
      ? [
          {
            ...first,
            hidden_reveal_type:
              first.hidden_reveal_type === "image" && first.hidden_scratch_image_url
                ? ("image" as const)
                : ("text" as const),
            hidden_scratch_text: first.hidden_scratch_text || "אתה מוזמן! 🎉",
            hidden_scratch_image_url:
              first.hidden_reveal_type === "image" ? first.hidden_scratch_image_url : null,
          },
        ]
      : body.scratch_cards,
  };
}
