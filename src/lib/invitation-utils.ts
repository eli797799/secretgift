export function formatEventDateTime(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function getGoogleCalendarUrl(params: {
  title: string;
  start: string;
  location?: string | null;
  details?: string | null;
  durationHours?: number;
}): string {
  const start = new Date(params.start);
  const end = new Date(start.getTime() + (params.durationHours ?? 2) * 60 * 60 * 1000);
  const search = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
  });
  if (params.location) search.set("location", params.location);
  if (params.details) search.set("details", params.details);
  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

export function getGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function getWazeUrl(location: string): string {
  const trimmed = location.trim();
  return `https://www.waze.com/ul?q=${encodeURIComponent(trimmed)}&navigate=yes`;
}

export function buildInvitationConfirmMessage(
  eventName: string,
  eventDatetime: string | null,
  eventLocation: string | null
): string {
  const lines = ["אני מגיע! 🎉", "", eventName];
  if (eventDatetime) lines.push(formatEventDateTime(eventDatetime));
  if (eventLocation) lines.push(`📍 ${eventLocation}`);
  return lines.join("\n");
}

export function buildInvitationShareMessage(
  eventName: string,
  eventDatetime: string | null,
  eventLocation: string | null,
  detailsUrl: string,
  message?: string | null
): string {
  const lines = ["🎟️ אתם מוזמנים!", "", eventName];
  if (eventDatetime) lines.push(`📅 ${formatEventDateTime(eventDatetime)}`);
  if (eventLocation) lines.push(`📍 ${eventLocation}`);
  if (message?.trim()) lines.push("", message.trim());
  lines.push("", "לכל הפרטים ואישור הגעה:", detailsUrl);
  return lines.join("\n");
}
