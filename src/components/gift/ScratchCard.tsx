"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { HiddenRevealType, ScratchCoverType } from "@/types/gift";
import { ScratchSound } from "@/lib/scratch-sound";

interface ScratchCardProps {
  hiddenRevealType?: HiddenRevealType;
  hiddenText: string;
  hiddenImageUrl?: string | null;
  coverType: ScratchCoverType;
  coverImageUrl: string | null;
  scratchSoundEnabled?: boolean;
  customSoundUrl?: string | null;
  onScratchStart: () => void;
  onReveal: () => void;
}

const COVER_COLORS: Record<string, string> = {
  gray: "#9CA3AF",
  gold: "#D4AF37",
  silver: "#C0C0C0",
};

const COVER_PLACEHOLDER: Record<string, string> = {
  gray: "#9CA3AF",
  gold: "#D4AF37",
  silver: "#C0C0C0",
  custom: "#9CA3AF",
};

const REVEAL_THRESHOLD = 0.6;

export default function ScratchCard({
  hiddenRevealType = "text",
  hiddenText,
  hiddenImageUrl,
  coverType,
  coverImageUrl,
  scratchSoundEnabled = true,
  customSoundUrl,
  onScratchStart,
  onReveal,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const hasScratched = useRef(false);
  const hasRevealed = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const brushSizeRef = useRef(50);
  const scratchSoundRef = useRef<ScratchSound | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const [coverReady, setCoverReady] = useState(false);

  const startCustomSound = useCallback(() => {
    if (!customSoundUrl) return;
    if (!customAudioRef.current) {
      customAudioRef.current = new Audio(customSoundUrl);
    }
    const audio = customAudioRef.current;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // autoplay blocked until user gesture — pointer down counts
    });
  }, [customSoundUrl]);

  const stopCustomSound = useCallback(() => {
    const audio = customAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const checkReveal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealed.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }

    const ratio = transparent / (pixels.length / 4);
    if (ratio >= REVEAL_THRESHOLD) {
      hasRevealed.current = true;
      canvas.style.opacity = "0";
      canvas.style.transition = "opacity 0.5s ease";
      onReveal();
    }
  }, [onReveal]);

  const drawScratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!hasScratched.current) {
        hasScratched.current = true;
        onScratchStart();
      }

      const brush = brushSizeRef.current;

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brush * 2;

      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        const speed = Math.hypot(dx, dy);
        scratchSoundRef.current?.update(speed);
      }

      ctx.beginPath();
      ctx.arc(x, y, brush, 0, Math.PI * 2);
      ctx.fill();

      lastPos.current = { x, y };
    },
    [onScratchStart]
  );

  const getPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    setCoverReady(false);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      brushSizeRef.current = Math.max(canvas.width, canvas.height) * 0.07;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (coverType === "custom" && coverImageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setCoverReady(true);
        };
        img.onerror = () => setCoverReady(true);
        img.src = coverImageUrl;
      } else {
        const color = COVER_COLORS[coverType] || COVER_COLORS.gray;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (coverType === "gold") {
          gradient.addColorStop(0, "#F5E6A3");
          gradient.addColorStop(0.5, "#D4AF37");
          gradient.addColorStop(1, "#B8960C");
        } else if (coverType === "silver") {
          gradient.addColorStop(0, "#E8E8E8");
          gradient.addColorStop(0.5, "#C0C0C0");
          gradient.addColorStop(1, "#A0A0A0");
        } else {
          gradient.addColorStop(0, "#B0B0B0");
          gradient.addColorStop(1, color);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = `${canvas.width * 0.06}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("✋ גרד כאן", canvas.width / 2, canvas.height / 2);
        setCoverReady(true);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [coverType, coverImageUrl]);

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = null;
    if (scratchSoundEnabled) {
      if (!scratchSoundRef.current) scratchSoundRef.current = new ScratchSound();
      scratchSoundRef.current.start();
    }
    startCustomSound();
    const pos = getPos(e.clientX, e.clientY);
    drawScratch(pos.x, pos.y);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    drawScratch(pos.x, pos.y);
    checkReveal();
  }

  function handlePointerUp() {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      scratchSoundRef.current?.stop();
      stopCustomSound();
      checkReveal();
    }
  }

  useEffect(() => {
    return () => {
      scratchSoundRef.current?.stop();
      stopCustomSound();
    };
  }, [stopCustomSound]);

  useEffect(() => {
    customAudioRef.current = null;
  }, [customSoundUrl]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4 ${
          coverReady ? "" : "invisible"
        }`}
      >
        {hiddenRevealType === "image" && hiddenImageUrl ? (
          <img
            src={hiddenImageUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="text-2xl sm:text-3xl font-bold text-center text-gray-800 leading-relaxed px-2">
            {hiddenText || "🎁 הפתעה מיוחדת!"}
          </p>
        )}
      </div>

      {!coverReady && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ backgroundColor: COVER_PLACEHOLDER[coverType] ?? COVER_PLACEHOLDER.gray }}
        >
          <span className="text-white/40 text-lg font-medium">✋ גרד כאן</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`scratch-canvas absolute inset-0 w-full h-full touch-none ${
          coverReady
            ? "opacity-100 cursor-grab active:cursor-grabbing"
            : "opacity-0 pointer-events-none"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <p
        className={`absolute bottom-3 left-0 right-0 text-center text-white/80 text-sm pointer-events-none drop-shadow ${
          coverReady ? "" : "opacity-0"
        }`}
      >
        גרד עם האצבע או העכבר
      </p>
    </div>
  );
}
