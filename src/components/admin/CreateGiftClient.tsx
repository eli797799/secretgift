"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import GiftForm from "./GiftForm";
import type { GiftFormData } from "@/types/gift";
import { getGiftUrl } from "@/lib/utils";
import WhatsAppShareButton, { buildSenderShareMessage } from "@/components/gift/WhatsAppShareButton";
import { useState } from "react";

export default function CreateGiftClient() {
  const router = useRouter();
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: GiftFormData) {
    setError(null);

    const res = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const gift = await res.json();
      setCreatedSlug(gift.slug);
      return;
    }

    const body = await res.json().catch(() => ({}));
    setError(formatGiftError(res.status, body.error));
  }

  if (createdSlug) {
    const url = getGiftUrl(createdSlug);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">המתנה נוצרה בהצלחה!</h2>
          <p className="text-gray-500 mb-6">הקישור הייחודי שלך:</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 break-all text-sm font-mono text-purple-600">
            {url}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(url)}
              className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700"
            >
              📋 העתק קישור
            </button>
            <WhatsAppShareButton
              message={buildSenderShareMessage(url)}
              label="שלח בוואטסאפ"
              className="!max-w-none"
            />
            <Link
              href={`/g/${createdSlug}`}
              target="_blank"
              className="bg-blue-50 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-100"
            >
              👁️ תצוגה מקדימה
            </Link>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 py-2 hover:text-gray-700"
            >
              חזרה ללוח הבקרה
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            →
          </Link>
          <h1 className="text-xl font-bold text-gray-800">יצירת מתנה חדשה</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        <GiftForm onSubmit={handleSubmit} submitLabel="צור מתנה" />
      </main>
    </div>
  );
}

function formatGiftError(status: number, message?: string): string {
  if (status === 401) return "יש להתחבר מחדש כדי ליצור מתנה.";
  if (
    message?.includes("gifts") ||
    message?.includes("scratch_cards") ||
    message?.includes("PGRST205") ||
    message?.includes("schema cache")
  ) {
    return "מסד הנתונים לא מוגדר. ב-Supabase פתח SQL Editor, העתק והרץ את הקובץ supabase/schema.sql.";
  }
  return message || "שגיאה ביצירת המתנה. נסה שוב.";
}
