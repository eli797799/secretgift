"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { RevealAnimationType } from "@/types/gift";

interface RevealAnimationProps {
  type: RevealAnimationType;
}

export default function RevealAnimation({ type }: RevealAnimationProps) {
  useEffect(() => {
    switch (type) {
      case "confetti":
        fireConfetti();
        break;
      case "fireworks":
        fireFireworks();
        break;
      case "sparkles":
        fireSparkles();
        break;
      case "win":
        fireWinAnimation();
        break;
    }
  }, [type]);

  return null;
}

function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#ff0", "#f00", "#0f0", "#00f", "#f0f"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ff0", "#f00", "#0f0", "#00f", "#f0f"],
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function fireFireworks() {
  const duration = 4000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 100,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.5,
      },
      colors: ["#ff0000", "#ff7700", "#ffff00", "#00ff00", "#0000ff", "#ff00ff"],
    });

    if (Date.now() < end) {
      setTimeout(frame, 400);
    }
  };
  frame();
}

function fireSparkles() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      spread: 70,
      origin: { x: Math.random(), y: Math.random() * 0.6 },
      colors: ["#FFD700", "#FFF", "#FFA500"],
      shapes: ["star"],
      scalar: 1.2,
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function fireWinAnimation() {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ["#FFD700", "#FFA500", "#FF6347"],
  });

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.7 },
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.7 },
    });
  }, 500);
}
