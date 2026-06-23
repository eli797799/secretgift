export type RsvpResponse = "attending" | "declined";

export interface InvitationRsvp {
  id: string;
  gift_id: string;
  guest_name: string | null;
  response: RsvpResponse;
  created_at: string;
  updated_at: string;
}

export interface RsvpSummary {
  attending: InvitationRsvp[];
  declined: InvitationRsvp[];
  attending_count: number;
  declined_count: number;
}

export type GiftType = "gift" | "invitation";
export type ScratchCoverType = "gray" | "gold" | "silver" | "custom";
export type RevealAnimationType = "confetti" | "fireworks" | "sparkles" | "win";
export type WinnerImageType = "trophy" | "gift" | "balloons" | "custom" | "none";

export type HiddenRevealType = "text" | "image";

export interface ScratchCardItem {
  hidden_reveal_type: HiddenRevealType;
  hidden_scratch_text: string;
  hidden_scratch_image_url: string | null;
  scratch_cover_type: ScratchCoverType;
  scratch_cover_image_url: string | null;
}

export interface Gift {
  id: string;
  user_id: string;
  slug: string;
  gift_type: GiftType;
  title: string;
  message: string;
  event_name: string | null;
  event_datetime: string | null;
  event_location: string | null;
  hidden_scratch_text: string;
  scratch_cards: ScratchCardItem[] | null;
  background_image_url: string | null;
  scratch_cover_type: ScratchCoverType;
  scratch_cover_image_url: string | null;
  expiration_date: string | null;
  reveal_animation: RevealAnimationType;
  winner_image_type: WinnerImageType;
  winner_image_url: string | null;
  owner_whatsapp: string | null;
  custom_sound_url: string | null;
  scratch_sound_enabled: boolean;
  rsvp_require_name: boolean;
  is_active: boolean;
  view_count: number;
  scratch_count: number;
  reveal_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}

export interface GiftFormData {
  gift_type: GiftType;
  title: string;
  message: string;
  event_name: string | null;
  event_datetime: string | null;
  event_location: string | null;
  scratch_cards: ScratchCardItem[];
  background_image_url: string | null;
  expiration_date: string | null;
  reveal_animation: RevealAnimationType;
  winner_image_type: WinnerImageType;
  winner_image_url: string | null;
  owner_whatsapp: string | null;
  custom_sound_url: string | null;
  scratch_sound_enabled: boolean;
  rsvp_require_name: boolean;
  is_active: boolean;
}

export const GIFT_TYPE_OPTIONS: { value: GiftType; label: string; emoji: string }[] = [
  { value: "gift", label: "מתנה", emoji: "🎁" },
  { value: "invitation", label: "הזמנה לאירוע", emoji: "🎟️" },
];

export const SCRATCH_COVER_OPTIONS: { value: ScratchCoverType; label: string }[] = [
  { value: "gray", label: "צבע אפור קלאסי" },
  { value: "gold", label: "זהב" },
  { value: "silver", label: "כסף" },
  { value: "custom", label: "תמונה מותאמת אישית" },
];

export const REVEAL_ANIMATION_OPTIONS: { value: RevealAnimationType; label: string }[] = [
  { value: "confetti", label: "קונפטי" },
  { value: "fireworks", label: "זיקוקים" },
  { value: "sparkles", label: "נצנצים" },
  { value: "win", label: "אנימציית זכייה" },
];

export const WINNER_IMAGE_OPTIONS: { value: WinnerImageType; label: string }[] = [
  { value: "trophy", label: "גביע" },
  { value: "gift", label: "מתנה" },
  { value: "balloons", label: "בלונים" },
  { value: "custom", label: "תמונה מותאמת אישית" },
  { value: "none", label: "ללא" },
];

export const DEFAULT_GIFT_FORM: GiftFormData = {
  gift_type: "gift",
  title: "",
  message: "",
  event_name: null,
  event_datetime: null,
  event_location: null,
  scratch_cards: [
    {
      hidden_reveal_type: "text",
      hidden_scratch_text: "",
      hidden_scratch_image_url: null,
      scratch_cover_type: "gray",
      scratch_cover_image_url: null,
    },
  ],
  background_image_url: null,
  expiration_date: null,
  reveal_animation: "confetti",
  winner_image_type: "gift",
  winner_image_url: null,
  owner_whatsapp: null,
  custom_sound_url: null,
  scratch_sound_enabled: true,
  rsvp_require_name: true,
  is_active: true,
};
