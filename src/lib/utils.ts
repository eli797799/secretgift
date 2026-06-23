import { nanoid } from "nanoid";

export function generateSlug(): string {
  return nanoid(8);
}

export function getGiftUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/g/${slug}`;
}

export function getInvitationDetailsUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/g/${slug}/details`;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "ללא תפוגה";
  return new Date(dateString).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isGiftExpired(expirationDate: string | null): boolean {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

export function getWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function normalizeWhatsAppPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "972" + digits.slice(1);
  if (digits.length === 9 && !digits.startsWith("972")) digits = "972" + digits;
  return digits;
}

export function getWhatsAppDirectUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return getWhatsAppShareUrl(message);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildRedemptionMessage(giftTitle: string, giftMessage: string): string {
  return `שלום! 🎉\n\nגרדתי את המתנה "${giftTitle}" ואני רוצה לממש את הזכייה.\n\nהפרס שלי:\n${giftMessage}`;
}

export const WINNER_EMOJIS: Record<string, string> = {
  trophy: "🏆",
  gift: "🎁",
  balloons: "🎈",
};
