"use client";

import { useState, useEffect, useCallback } from "react";
import type { RsvpSummary } from "@/types/gift";

interface InvitationRsvpPanelProps {
  giftId: string;
  requireName?: boolean;
  compact?: boolean;
}

export default function InvitationRsvpPanel({
  giftId,
  requireName = true,
  compact = false,
}: InvitationRsvpPanelProps) {
  const [summary, setSummary] = useState<RsvpSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRsvps = useCallback(async () => {
    const res = await fetch(`/api/gifts/${giftId}/rsvp`);
    if (res.ok) {
      setSummary(await res.json());
    }
    setLoading(false);
  }, [giftId]);

  useEffect(() => {
    fetchRsvps();
  }, [fetchRsvps]);

  if (loading) {
    return (
      <div className="text-xs text-gray-400 py-2">טוען אישורי הגעה...</div>
    );
  }

  if (!summary) return null;

  const total = summary.attending_count + summary.declined_count;
  const namedAttending = summary.attending.filter((r) => r.guest_name);
  const namedDeclined = summary.declined.filter((r) => r.guest_name);
  const anonymousAttending = summary.attending_count - namedAttending.length;
  const anonymousDeclined = summary.declined_count - namedDeclined.length;

  if (compact) {
    return (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <div className="flex items-center gap-3 text-sm mb-2">
          <span className="font-semibold text-amber-800">🎟️ אישורי הגעה</span>
          <span className="text-green-700 font-medium">✅ {summary.attending_count}</span>
          <span className="text-gray-500 font-medium">❌ {summary.declined_count}</span>
          <span className="text-gray-400 text-xs">({total} סה״כ)</span>
        </div>
        {namedAttending.length > 0 && (
          <p className="text-xs text-gray-600 truncate">
            מגיעים: {namedAttending.map((r) => r.guest_name).join(", ")}
          </p>
        )}
        {!requireName && anonymousAttending > 0 && (
          <p className="text-xs text-gray-500">
            {anonymousAttending} אישורי הגעה ללא שם
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800">🎟️ אישורי הגעה</h2>
        <button
          type="button"
          onClick={fetchRsvps}
          className="text-xs text-purple-600 hover:text-purple-700"
        >
          רענן
        </button>
      </div>

      {!requireName && (
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">
          אישור הגעה אנונימי — מוצגים רק מספרים, ללא שמות
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-700">{summary.attending_count}</div>
          <div className="text-xs text-green-600">מאשרים הגעה</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
          <div className="text-2xl font-bold text-gray-600">{summary.declined_count}</div>
          <div className="text-xs text-gray-500">לא מגיעים</div>
        </div>
      </div>

      {namedAttending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-700 mb-2">✅ מי מגיע</h3>
          <ul className="space-y-1">
            {namedAttending.map((r) => (
              <li
                key={r.id}
                className="text-sm text-gray-700 bg-green-50/50 px-3 py-2 rounded-lg flex justify-between"
              >
                <span>{r.guest_name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.updated_at).toLocaleDateString("he-IL")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!requireName && anonymousAttending > 0 && (
        <p className="text-sm text-gray-500 mb-4 bg-green-50/30 px-3 py-2 rounded-lg">
          + {anonymousAttending} אישורי הגעה ללא שם
        </p>
      )}

      {namedDeclined.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">❌ מי לא מגיע</h3>
          <ul className="space-y-1">
            {namedDeclined.map((r) => (
              <li
                key={r.id}
                className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg flex justify-between"
              >
                <span>{r.guest_name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.updated_at).toLocaleDateString("he-IL")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!requireName && anonymousDeclined > 0 && (
        <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          + {anonymousDeclined} סירובים ללא שם
        </p>
      )}

      {total === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">עדיין אין אישורי הגעה</p>
      )}
    </div>
  );
}
