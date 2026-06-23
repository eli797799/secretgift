"use client";

import { useState, useEffect } from "react";

interface InvitationRsvpFormProps {
  slug: string;
  requireName?: boolean;
}

export default function InvitationRsvpForm({
  slug,
  requireName = true,
}: InvitationRsvpFormProps) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState<"attending" | "declined" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedResponse = localStorage.getItem(`rsvp-response-${slug}`);
    if (savedResponse === "attending" || savedResponse === "declined") {
      setSubmitted(savedResponse);
    }
    if (requireName) {
      const savedName = localStorage.getItem(`rsvp-name-${slug}`);
      if (savedName) setName(savedName);
    }
  }, [slug, requireName]);

  async function submit(response: "attending" | "declined") {
    const guestName = requireName ? name.trim() : "";
    if (requireName && !guestName) {
      setError("נא להזין את שמך");
      return;
    }

    setError(null);
    setLoading(true);

    const rsvpId = localStorage.getItem(`rsvp-id-${slug}`);
    const res = await fetch(`/api/gifts/rsvp/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest_name: guestName,
        response,
        rsvp_id: rsvpId || undefined,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      setSubmitted(response);
      localStorage.setItem(`rsvp-response-${slug}`, response);
      if (body.id) localStorage.setItem(`rsvp-id-${slug}`, body.id);
      if (guestName) localStorage.setItem(`rsvp-name-${slug}`, guestName);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "שגיאה בשליחה, נסה שוב");
    }

    setLoading(false);
  }

  function handleChangeResponse() {
    setSubmitted(null);
    setError(null);
  }

  return (
    <div className="bg-white/15 backdrop-blur rounded-2xl p-5 border border-white/20">
      <h3 className="text-white font-bold text-lg text-center mb-1">אישור הגעה</h3>
      <p className="text-white/70 text-sm text-center mb-4">ספר לנו אם תגיע לאירוע</p>

      {submitted ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">{submitted === "attending" ? "🎉" : "💙"}</div>
          <p className="text-white font-semibold text-lg">
            {submitted === "attending"
              ? requireName && name
                ? `תודה ${name}! נשמח לראות אותך`
                : "תודה! נשמח לראות אותך"
              : requireName && name
                ? `תודה ${name} על העדכון`
                : "תודה על העדכון"}
          </p>
          <button
            type="button"
            onClick={handleChangeResponse}
            className="mt-3 text-white/60 text-sm underline hover:text-white"
          >
            שנה תשובה
          </button>
        </div>
      ) : (
        <>
          {requireName && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלך"
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 placeholder:text-gray-400 outline-none mb-3 text-center font-medium"
            />
          )}

          {error && <p className="text-red-200 text-sm text-center mb-3">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => submit("attending")}
              className="py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50"
            >
              ✅ כן, אני מגיע
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => submit("declined")}
              className="py-3.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold border border-white/30 transition-colors disabled:opacity-50"
            >
              😔 לא יכול להגיע
            </button>
          </div>
        </>
      )}
    </div>
  );
}
