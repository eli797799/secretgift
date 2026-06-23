export type ScratchCoverType = "gray" | "gold" | "silver" | "custom";
export type RevealAnimationType = "confetti" | "fireworks" | "sparkles" | "win";
export type WinnerImageType = "trophy" | "gift" | "balloons" | "custom" | "none";

export interface ScratchCardItem {
  hidden_scratch_text: string;
  scratch_cover_type: ScratchCoverType;
  scratch_cover_image_url: string | null;
}

export interface Gift {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  message: string;
  hidden_scratch_text: string;
  scratch_cards: ScratchCardItem[] | null;
  background_image_url: string | null;
  scratch_cover_type: ScratchCoverType;
  scratch_cover_image_url: string | null;
  expiration_date: string | null;
  reveal_animation: RevealAnimationType;
  winner_image_type: WinnerImageType;
  winner_image_url: string | null;
  is_active: boolean;
  view_count: number;
  scratch_count: number;
  reveal_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}

export interface GiftFormData {
  title: string;
  message: string;
  scratch_cards: ScratchCardItem[];
  background_image_url: string | null;
  expiration_date: string | null;
  reveal_animation: RevealAnimationType;
  winner_image_type: WinnerImageType;
  winner_image_url: string | null;
  is_active: boolean;
}

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
  title: "",
  message: "",
  scratch_cards: [
    {
      hidden_scratch_text: "",
      scratch_cover_type: "gray",
      scratch_cover_image_url: null,
    },
  ],
  background_image_url: null,
  expiration_date: null,
  reveal_animation: "confetti",
  winner_image_type: "gift",
  winner_image_url: null,
  is_active: true,
};
