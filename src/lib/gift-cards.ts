import type { Gift, ScratchCardItem, GiftFormData } from "@/types/gift";

export const DEFAULT_SCRATCH_CARD: ScratchCardItem = {
  hidden_scratch_text: "",
  scratch_cover_type: "gray",
  scratch_cover_image_url: null,
};

export function getScratchCards(gift: Pick<Gift, "scratch_cards" | "hidden_scratch_text" | "scratch_cover_type" | "scratch_cover_image_url">): ScratchCardItem[] {
  if (gift.scratch_cards && gift.scratch_cards.length > 0) {
    return gift.scratch_cards;
  }
  return [
    {
      hidden_scratch_text: gift.hidden_scratch_text,
      scratch_cover_type: gift.scratch_cover_type,
      scratch_cover_image_url: gift.scratch_cover_image_url,
    },
  ];
}

export function giftToFormData(gift: Gift): GiftFormData {
  return {
    title: gift.title,
    message: gift.message,
    scratch_cards: getScratchCards(gift),
    background_image_url: gift.background_image_url,
    expiration_date: gift.expiration_date,
    reveal_animation: gift.reveal_animation,
    winner_image_type: gift.winner_image_type,
    winner_image_url: gift.winner_image_url,
    owner_whatsapp: gift.owner_whatsapp,
    custom_sound_url: gift.custom_sound_url,
    scratch_sound_enabled: gift.scratch_sound_enabled ?? true,
    is_active: gift.is_active,
  };
}

export function prepareGiftPayload(body: GiftFormData) {
  const first = body.scratch_cards[0] ?? DEFAULT_SCRATCH_CARD;
  return {
    ...body,
    hidden_scratch_text: first.hidden_scratch_text,
    scratch_cover_type: first.scratch_cover_type,
    scratch_cover_image_url: first.scratch_cover_image_url,
    scratch_cards: body.scratch_cards,
  };
}
