"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Gift } from "@/types/gift";
import GiftCard from "./GiftCard";

export default function AdminDashboard() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchGifts = useCallback(async () => {
    const res = await fetch("/api/gifts");
    if (res.ok) {
      setGifts(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/gifts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (res.ok) fetchGifts();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
    if (res.ok) fetchGifts();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const totalViews = gifts.reduce((s, g) => s + g.view_count, 0);
  const totalScratches = gifts.reduce((s, g) => s + g.scratch_count, 0);
  const totalReveals = gifts.reduce((s, g) => s + g.reveal_count, 0);
  const totalShares = gifts.reduce((s, g) => s + g.share_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">🎁 SecretGift</h1>
            <p className="text-sm text-gray-500">{gifts.length} מתנות</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/gifts/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              + מתנה חדשה
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors"
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard icon="👁️" label="סה״כ צפיות" value={totalViews} />
          <SummaryCard icon="✋" label="סה״כ גירודים" value={totalScratches} />
          <SummaryCard icon="🎉" label="סה״כ חשיפות" value={totalReveals} />
          <SummaryCard icon="📱" label="סה״כ שיתופים" value={totalShares} />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">טוען...</div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-500 mb-4">עדיין אין מתנות</p>
            <Link
              href="/dashboard/gifts/new"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700"
            >
              צור מתנה ראשונה
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {gifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
