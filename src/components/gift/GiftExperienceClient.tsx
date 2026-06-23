"use client";

import { useState, useEffect, useCallback } from "react";
import type { Gift, ScratchCardItem } from "@/types/gift";
import ScratchCard from "./ScratchCard";
import RevealAnimation from "./RevealAnimation";
import WhatsAppShareButton, { buildRecipientShareMessage } from "./WhatsAppShareButton";
import { getGiftUrl, WINNER_EMOJIS, buildRedemptionMessage } from "@/lib/utils";
import { getScratchCards } from "@/lib/gift-cards";

interface GiftExperienceClientProps {
  gift: Gift;
}

export default function GiftExperienceClient({ gift }: GiftExperienceClientProps) {
  const cards = getScratchCards(gift);
  const [cardIndex, setCardIndex] = useState(0);
  const [phase, setPhase] = useState<"scratching" | "between" | "final">("scratching");
  const [viewTracked, setViewTracked] = useState(false);
  const [revealedItems, setRevealedItems] = useState<ScratchCardItem[]>([]);

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

  function handleCardReveal() {
    const current = cards[cardIndex];
    setRevealedItems((prev) => [...prev, current]);

    if (cardIndex < cards.length - 1) {
      setPhase("between");
      setTimeout(() => {
        setCardIndex((i) => i + 1);
        setPhase("scratching");
      }, 1800);
    } else {
      setPhase("final");
      trackStat("reveal");
    }
  }

  function handleWhatsAppShare() {
    trackStat("share");
  }

  const winnerEmoji =
    gift.winner_image_type !== "custom" && gift.winner_image_type !== "none"
      ? WINNER_EMOJIS[gift.winner_image_type]
      : null;

  const currentCard = cards[cardIndex];
  const totalCards = cards.length;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      style={{
        backgroundImage: gift.background_image_url ? `url(${gift.background_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        background: gift.background_image_url
          ? undefined
          : "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      }}
    >
      {phase === "final" && <RevealAnimation type={gift.reveal_animation} />}

      <div className="w-full max-w-md">
        {phase !== "final" ? (
          <div className="text-center mb-6 animate-bounce-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              יש לך הפתעה! 🎁
            </h1>
            <p className="text-white/90 text-lg drop-shadow">
              {phase === "between"
                ? "יש עוד הפתעה... ✨"
                : totalCards > 1
                  ? `גרד את הכרטיס (${cardIndex + 1} מתוך ${totalCards})`
                  : "גרד את הכרטיס כדי לגלות מה קיבלת"}
            </p>
          </div>
        ) : (
          <div className="text-center mb-6 animate-bounce-in">
            {winnerEmoji && <div className="text-7xl mb-4 animate-bounce">{winnerEmoji}</div>}
            {gift.winner_image_type === "custom" && gift.winner_image_url && (
              <img
                src={gift.winner_image_url}
                alt=""
                className="w-32 h-32 mx-auto mb-4 object-contain animate-bounce"
              />
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              {gift.title}
            </h1>
            <p className="text-white/95 text-xl leading-relaxed drop-shadow whitespace-pre-wrap">
              {gift.message}
            </p>
          </div>
        )}

        {revealedItems.length > 0 && phase !== "final" && (
          <div className="mb-4 space-y-2">
            {revealedItems.map((item, i) => (
              <div
                key={i}
                className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white text-center text-sm"
              >
                {item.hidden_reveal_type === "image" && item.hidden_scratch_image_url ? (
                  <img
                    src={item.hidden_scratch_image_url}
                    alt=""
                    className="max-h-24 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  item.hidden_scratch_text || "🎁 הפתעה!"
                )}
              </div>
            ))}
          </div>
        )}

        {phase === "scratching" && currentCard && (
          <ScratchCard
            key={cardIndex}
            hiddenRevealType={currentCard.hidden_reveal_type}
            hiddenText={currentCard.hidden_scratch_text}
            hiddenImageUrl={currentCard.hidden_scratch_image_url}
            coverType={currentCard.scratch_cover_type}
            coverImageUrl={currentCard.scratch_cover_image_url}
            scratchSoundEnabled={gift.scratch_sound_enabled ?? true}
            customSoundUrl={gift.custom_sound_url}
            onScratchStart={handleScratchStart}
            onReveal={handleCardReveal}
          />
        )}

        {phase === "between" && (
          <div className="text-center py-16 animate-pulse">
            {(() => {
              const last = revealedItems[revealedItems.length - 1];
              if (last?.hidden_reveal_type === "image" && last.hidden_scratch_image_url) {
                return (
                  <img
                    src={last.hidden_scratch_image_url}
                    alt=""
                    className="max-h-48 mx-auto rounded-2xl object-contain shadow-lg"
                  />
                );
              }
              return (
                <p className="text-white text-2xl font-bold">
                  {last?.hidden_scratch_text || "🎁 הפתעה!"}
                </p>
              );
            })()}
          </div>
        )}

        {phase === "final" && (
          <div className="mt-8 flex flex-col items-center gap-4 animate-bounce-in">
            {gift.owner_whatsapp && (
              <WhatsAppShareButton
                phone={gift.owner_whatsapp}
                message={buildRedemptionMessage(gift.title, gift.message)}
                label="מימוש לזכייה"
                variant="gold"
              />
            )}
            <WhatsAppShareButton
              message={buildRecipientShareMessage(getGiftUrl(gift.slug))}
              onShare={handleWhatsAppShare}
            />
          </div>
        )}
      </div>
    </div>
  );
}
