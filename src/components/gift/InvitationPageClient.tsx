"use client";

import { useState, useEffect, useCallback } from "react";
import type { Gift } from "@/types/gift";
import ScratchCard from "./ScratchCard";
import RevealAnimation from "./RevealAnimation";
import WhatsAppShareButton from "./WhatsAppShareButton";
import { getScratchCards } from "@/lib/gift-cards";
import InvitationRsvpForm from "./InvitationRsvpForm";
import {
  formatEventDateTime,
  getGoogleCalendarUrl,
  getGoogleMapsUrl,
  getWazeUrl,
  buildInvitationShareMessage,
} from "@/lib/invitation-utils";
import { getInvitationDetailsUrl } from "@/lib/utils";

interface InvitationPageClientProps {
  gift: Gift;
  startRevealed?: boolean;
}

type Phase = "scratching" | "revealed";

export default function InvitationPageClient({
  gift,
  startRevealed = false,
}: InvitationPageClientProps) {
  const cards = getScratchCards(gift);
  const scratchCard = cards[0];
  const [phase, setPhase] = useState<Phase>(startRevealed ? "revealed" : "scratching");
  const [viewTracked, setViewTracked] = useState(false);

  const eventName = gift.event_name || gift.title;
  const eventDate = formatEventDateTime(gift.event_datetime);
  const eventLocation = gift.event_location?.trim() || "";

  const trackStat = useCallback(
    async (stat: "view" | "scratch" | "reveal" | "share") => {
      await fetch(`/api/gifts/stats/${gift.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat }),
      });
    },
    [gift.slug]
  );

  useEffect(() => {
    if (!viewTracked) {
      trackStat("view");
      setViewTracked(true);
    }
  }, [viewTracked, trackStat]);

  function handleScratchStart() {
    trackStat("scratch");
  }

  function handleScratchReveal() {
    setPhase("revealed");
    trackStat("reveal");
  }

  function handleShare() {
    trackStat("share");
  }

  const bgStyle = gift.background_image_url
    ? {
        backgroundImage: `url(${gift.background_image_url})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : {
        background: "linear-gradient(135deg, #1e3a5f 0%, #4c1d95 50%, #be185d 100%)",
      };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6" style={bgStyle}>
      {phase === "revealed" && <RevealAnimation type={gift.reveal_animation} />}

      <div className="w-full max-w-md">
        {phase === "scratching" && (
          <>
            <div className="text-center mb-6 animate-bounce-in">
              <div className="text-5xl mb-3">🎟️</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                יש לך הזמנה מיוחדת!
              </h1>
              <p className="text-white/90 text-lg drop-shadow">גרד כדי לגלות את הפרטים</p>
            </div>

            {scratchCard && (
              <ScratchCard
                hiddenRevealType={scratchCard.hidden_reveal_type}
                hiddenText={scratchCard.hidden_scratch_text || "אתה מוזמן! 🎉"}
                hiddenImageUrl={scratchCard.hidden_scratch_image_url}
                coverType={scratchCard.scratch_cover_type}
                coverImageUrl={scratchCard.scratch_cover_image_url}
                scratchSoundEnabled={gift.scratch_sound_enabled ?? true}
                customSoundUrl={gift.custom_sound_url}
                onScratchStart={handleScratchStart}
                onReveal={handleScratchReveal}
              />
            )}
          </>
        )}

        {phase === "revealed" && (
          <div className="animate-bounce-in">
            {scratchCard?.hidden_reveal_type === "image" && scratchCard.hidden_scratch_image_url && (
              <div className="mb-6 rounded-2xl overflow-hidden shadow-lg bg-white/10 backdrop-blur">
                <img
                  src={scratchCard.hidden_scratch_image_url}
                  alt=""
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">אתה מוזמן!</h1>
              <h2 className="text-2xl font-bold text-white/95 mb-3 drop-shadow-lg">{eventName}</h2>
              {eventDate && (
                <p className="text-white/95 text-lg drop-shadow mb-2">📅 {eventDate}</p>
              )}
              {eventLocation && (
                <p className="text-white/95 text-lg drop-shadow mb-2">📍 {eventLocation}</p>
              )}
              {gift.message && (
                <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap bg-white/10 backdrop-blur rounded-2xl p-4 mt-4">
                  {gift.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <InvitationRsvpForm
                slug={gift.slug}
                requireName={gift.rsvp_require_name ?? true}
              />

              {gift.event_datetime && (
                <a
                  href={getGoogleCalendarUrl({
                    title: eventName,
                    start: gift.event_datetime,
                    location: eventLocation,
                    details: gift.message,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-gray-800 rounded-xl font-semibold shadow-md hover:bg-gray-100 transition-colors"
                >
                  📅 הוסף ליומן
                </a>
              )}

              {eventLocation && (
                <>
                  <a
                    href={getWazeUrl(eventLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-[#33CCFF] text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
                  >
                    🚗 נווט בוויז
                  </a>
                  <a
                    href={getGoogleMapsUrl(eventLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/20 text-white rounded-xl font-medium border border-white/30 hover:bg-white/30 transition-colors"
                  >
                    🗺️ פתח בגוגל מפות
                  </a>
                </>
              )}

              <WhatsAppShareButton
                message={buildInvitationShareMessage(
                  eventName,
                  gift.event_datetime,
                  eventLocation,
                  getInvitationDetailsUrl(gift.slug),
                  gift.message
                )}
                label="שתף את האירוע 📲"
                onShare={handleShare}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
