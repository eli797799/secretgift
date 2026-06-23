import { nanoid } from "nanoid";

export function generateSlug(): string {
  return nanoid(8);
}

export function getGiftUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/g/${slug}`;
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

export const WINNER_EMOJIS: Record<string, string> = {
  trophy: "🏆",
  gift: "🎁",
  balloons: "🎈",
};
