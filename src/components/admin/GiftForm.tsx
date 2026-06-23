"use client";

import { useState } from "react";
import type {
  GiftFormData,
  GiftType,
  ScratchCardItem,
  ScratchCoverType,
  RevealAnimationType,
  WinnerImageType,
} from "@/types/gift";
import {
  DEFAULT_GIFT_FORM,
  GIFT_TYPE_OPTIONS,
  SCRATCH_COVER_OPTIONS,
  REVEAL_ANIMATION_OPTIONS,
  WINNER_IMAGE_OPTIONS,
} from "@/types/gift";
import { DEFAULT_SCRATCH_CARD } from "@/lib/gift-cards";
import SoundUpload from "./SoundUpload";
import DateTimePicker from "./DateTimePicker";

interface GiftFormProps {
  initialData?: GiftFormData;
  onSubmit: (data: GiftFormData) => Promise<void>;
  submitLabel: string;
}

export default function GiftForm({ initialData, onSubmit, submitLabel }: GiftFormProps) {
  const [form, setForm] = useState<GiftFormData>(initialData || DEFAULT_GIFT_FORM);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  function updateField<K extends keyof GiftFormData>(key: K, value: GiftFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateScratchCard(index: number, patch: Partial<ScratchCardItem>) {
    setForm((prev) => ({
      ...prev,
      scratch_cards: prev.scratch_cards.map((card, i) =>
        i === index ? { ...card, ...patch } : card
      ),
    }));
  }

  function addScratchCard() {
    setForm((prev) => ({
      ...prev,
      scratch_cards: [...prev.scratch_cards, { ...DEFAULT_SCRATCH_CARD }],
    }));
  }

  function removeScratchCard(index: number) {
    if (form.scratch_cards.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      scratch_cards: prev.scratch_cards.filter((_, i) => i !== index),
    }));
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void,
    uploadKey: string,
    folder: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(uploadKey);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      onSuccess(url);
    }
    setUploading(null);
  }

  async function handleAudioUpload(file: File) {
    setUploading("custom_sound_url");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "sounds");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      updateField("custom_sound_url", url);
    }
    setUploading(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.gift_type === "invitation") {
      if (!form.event_name?.trim() || !form.event_datetime) {
        alert("נא למלא שם אירוע ותאריך ושעה");
        return;
      }
    }
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  function setGiftType(type: GiftType) {
    if (type === "invitation") {
      setForm((prev) => ({
        ...prev,
        gift_type: type,
        scratch_cards: [
          {
            hidden_reveal_type: "text",
            hidden_scratch_text: "אתה מוזמן! 🎉",
            hidden_scratch_image_url: null,
            scratch_cover_type: "gold",
            scratch_cover_image_url: null,
          },
        ],
      }));
    } else {
      updateField("gift_type", type);
    }
  }

  const isInvitation = form.gift_type === "invitation";
  const invitationCard = form.scratch_cards[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField label="סוג כרטיס">
        <div className="grid grid-cols-2 gap-2">
          {GIFT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGiftType(opt.value)}
              className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                form.gift_type === opt.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl block mb-1">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </FormField>

      {isInvitation ? (
        <>
          <FormField label="שם האירוע" hint="לדוגמה: חתונה / בר מצווה / יום הולדת">
            <input
              type="text"
              value={form.event_name || ""}
              onChange={(e) => updateField("event_name", e.target.value || null)}
              className={inputClass}
              placeholder="חתונת דני ומיה"
              required
            />
          </FormField>

          <FormField label="תאריך ושעה" hint="בחר תאריך מהלוח ושעה — או לחץ על שעה נפוצה">
            <DateTimePicker
              value={form.event_datetime}
              onChange={(iso) => updateField("event_datetime", iso)}
              required
            />
          </FormField>

          <FormField
            label="מיקום האירוע (אופציונלי)"
            hint="כתובת או שם מקום — אם תמלא, המוזמנים יוכלו לנווט בוויז ובמפות"
          >
            <input
              type="text"
              value={form.event_location || ""}
              onChange={(e) => updateField("event_location", e.target.value || null)}
              className={inputClass}
              placeholder="לדוגמה: אולם הר הצופה, ירושלים"
            />
          </FormField>

          <FormField label="הודעה אישית" hint="מוצגת אחרי חשיפת פרטי ההזמנה">
            <textarea
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              className={`${inputClass} min-h-[100px]`}
              placeholder="נשמח לראותכם! ❤️"
            />
          </FormField>

          <FormField
            label="אישור הגעה"
            hint="בחר אם המוזמנים חייבים לכתוב שם כשמאשרים הגעה"
          >
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rsvp_require_name ?? true}
                  onChange={(e) => updateField("rsvp_require_name", e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800 block">
                    דרוש שם באישור הגעה
                  </span>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {(form.rsvp_require_name ?? true)
                      ? "מסומן — המוזמן יכתוב שם ותראה מי מגיע"
                      : "לא מסומן — המוזמן לוחץ כן/לא בלי שם, ותראה רק כמה מגיעים"}
                  </span>
                </div>
              </label>
            </div>
          </FormField>

          <FormField
            label="מה מוסתר מתחת לגירוד?"
            hint="תמונת ההזמנה שתיחשף כשמגרדים, או טקסט פשוט"
          >
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() =>
                  updateScratchCard(0, {
                    hidden_reveal_type: "text",
                    hidden_scratch_image_url: null,
                    hidden_scratch_text: invitationCard?.hidden_scratch_text || "אתה מוזמן! 🎉",
                  })
                }
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  (invitationCard?.hidden_reveal_type ?? "text") === "text"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                ✏️ טקסט
              </button>
              <button
                type="button"
                onClick={() =>
                  updateScratchCard(0, {
                    hidden_reveal_type: "image",
                    hidden_scratch_text: "",
                  })
                }
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  invitationCard?.hidden_reveal_type === "image"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                🖼️ תמונת הזמנה
              </button>
            </div>

            {(invitationCard?.hidden_reveal_type ?? "text") === "text" ? (
              <input
                type="text"
                value={invitationCard?.hidden_scratch_text || ""}
                onChange={(e) =>
                  updateScratchCard(0, { hidden_scratch_text: e.target.value })
                }
                className={inputClass}
                placeholder="אתה מוזמן! 🎉"
              />
            ) : (
              <ImageUpload
                currentUrl={invitationCard?.hidden_scratch_image_url ?? null}
                uploading={uploading === "invitation-hidden"}
                onUpload={(e) =>
                  handleImageUpload(
                    e,
                    (url) =>
                      updateScratchCard(0, {
                        hidden_scratch_image_url: url,
                        hidden_reveal_type: "image",
                      }),
                    "invitation-hidden",
                    "invitation-images"
                  )
                }
                onRemove={() =>
                  updateScratchCard(0, { hidden_scratch_image_url: null })
                }
                label="📷 העלה תמונת הזמנה"
              />
            )}
          </FormField>

          <FormField label="שכבת הגירוד" hint="השכבה שמכסה את ההזמנה — מגרדים אותה לגלות">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {SCRATCH_COVER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    updateScratchCard(0, { scratch_cover_type: opt.value as ScratchCoverType })
                  }
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    invitationCard?.scratch_cover_type === opt.value
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {invitationCard?.scratch_cover_type === "custom" && (
              <ImageUpload
                currentUrl={invitationCard.scratch_cover_image_url}
                uploading={uploading === "invitation-cover"}
                onUpload={(e) =>
                  handleImageUpload(
                    e,
                    (url) => updateScratchCard(0, { scratch_cover_image_url: url }),
                    "invitation-cover",
                    "scratch-covers"
                  )
                }
                onRemove={() => updateScratchCard(0, { scratch_cover_image_url: null })}
              />
            )}
          </FormField>

          <FormField
            label="וואטסאפ שלך"
            hint="לכפתור 'אני מגיע!' — המקבל ישלח לך אישור הגעה"
          >
            <input
              type="tel"
              value={form.owner_whatsapp || ""}
              onChange={(e) => updateField("owner_whatsapp", e.target.value || null)}
              className={inputClass}
              placeholder="0501234567"
              dir="ltr"
            />
          </FormField>
        </>
      ) : (
        <>
      <FormField label="כותרת המתנה" hint="לדוגמה: מזל טוב! / זכית! / הפתעה מיוחדת!">
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={inputClass}
          placeholder="מזל טוב!"
          required
        />
      </FormField>

      <FormField label="תוכן המתנה" hint='מוצג בסוף, אחרי שכל הכרטיסים נגרדו'>
        <textarea
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          className={`${inputClass} min-h-[100px]`}
          placeholder="🎉 קיבלת שובר מתנה בשווי 500 ₪"
          required
        />
      </FormField>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">כרטיסי גירוד</h2>
            <p className="text-xs text-gray-400">המקבל יגרד כרטיס אחרי כרטיס</p>
          </div>
          <button
            type="button"
            onClick={addScratchCard}
            className="text-sm bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-medium hover:bg-purple-200 transition-colors"
          >
            + הוסף כרטיס גרוד
          </button>
        </div>

        {form.scratch_cards.map((card, index) => (
          <div key={index} className="border border-gray-200 rounded-2xl p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">כרטיס {index + 1}</span>
              {form.scratch_cards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScratchCard(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  הסר כרטיס
                </button>
              )}
            </div>

            <FormField label="מה מוסתר מתחת לגירוד?" hint="מוצג אחרי גירוד הכרטיס">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() =>
                    updateScratchCard(index, { hidden_reveal_type: "text", hidden_scratch_image_url: null })
                  }
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    (card.hidden_reveal_type ?? "text") === "text"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  ✏️ טקסט
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateScratchCard(index, { hidden_reveal_type: "image", hidden_scratch_text: "" })
                  }
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    card.hidden_reveal_type === "image"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  🖼️ תמונה
                </button>
              </div>

              {(card.hidden_reveal_type ?? "text") === "text" ? (
                <input
                  type="text"
                  value={card.hidden_scratch_text}
                  onChange={(e) =>
                    updateScratchCard(index, { hidden_scratch_text: e.target.value })
                  }
                  className={inputClass}
                  placeholder="גרד כאן לגלות!"
                />
              ) : (
                <ImageUpload
                  currentUrl={card.hidden_scratch_image_url}
                  uploading={uploading === `card-${index}-hidden`}
                  onUpload={(e) =>
                    handleImageUpload(
                      e,
                      (url) => updateScratchCard(index, { hidden_scratch_image_url: url }),
                      `card-${index}-hidden`,
                      "hidden-reveals"
                    )
                  }
                  onRemove={() => updateScratchCard(index, { hidden_scratch_image_url: null })}
                  label="לחץ להעלאת תמונה לחשיפה"
                />
              )}
            </FormField>

            <FormField label="שכבת הגירוד">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {SCRATCH_COVER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      updateScratchCard(index, { scratch_cover_type: opt.value as ScratchCoverType })
                    }
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      card.scratch_cover_type === opt.value
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt.value === "gray" && (
                      <span className="block w-full h-4 bg-gray-400 rounded mb-1" />
                    )}
                    {opt.value === "gold" && (
                      <span className="block w-full h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded mb-1" />
                    )}
                    {opt.value === "silver" && (
                      <span className="block w-full h-4 bg-gradient-to-r from-gray-300 to-gray-500 rounded mb-1" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
              {card.scratch_cover_type === "custom" && (
                <ImageUpload
                  currentUrl={card.scratch_cover_image_url}
                  uploading={uploading === `card-${index}-cover`}
                  onUpload={(e) =>
                    handleImageUpload(
                      e,
                      (url) => updateScratchCard(index, { scratch_cover_image_url: url }),
                      `card-${index}-cover`,
                      "scratch-covers"
                    )
                  }
                  onRemove={() => updateScratchCard(index, { scratch_cover_image_url: null })}
                />
              )}
            </FormField>
          </div>
        ))}
      </div>

        </>
      )}

      <FormField label="תמונת רקע">
        <ImageUpload
          currentUrl={form.background_image_url}
          uploading={uploading === "background_image_url"}
          onUpload={(e) =>
            handleImageUpload(
              e,
              (url) => updateField("background_image_url", url),
              "background_image_url",
              "backgrounds"
            )
          }
          onRemove={() => updateField("background_image_url", null)}
        />
      </FormField>

      <FormField label="תאריך תפוגה" hint="עד מתי הקישור יהיה פעיל — אופציונלי">
        <DateTimePicker
          value={form.expiration_date}
          onChange={(iso) => updateField("expiration_date", iso)}
          allowPastDates
        />
      </FormField>

      {!isInvitation && (
      <>
      <FormField label="אנימציית חשיפה" hint="מוצגת אחרי גירוד הכרטיס האחרון">
        <div className="grid grid-cols-2 gap-2">
          {REVEAL_ANIMATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateField("reveal_animation", opt.value as RevealAnimationType)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                form.reveal_animation === opt.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="תמונת זכייה">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {WINNER_IMAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateField("winner_image_type", opt.value as WinnerImageType)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                form.winner_image_type === opt.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.value === "trophy" && "🏆"}
              {opt.value === "gift" && "🎁"}
              {opt.value === "balloons" && "🎈"}
              {opt.label}
            </button>
          ))}
        </div>
        {form.winner_image_type === "custom" && (
          <ImageUpload
            currentUrl={form.winner_image_url}
            uploading={uploading === "winner_image_url"}
            onUpload={(e) =>
              handleImageUpload(
                e,
                (url) => updateField("winner_image_url", url),
                "winner_image_url",
                "winners"
              )
            }
            onRemove={() => updateField("winner_image_url", null)}
          />
        )}
      </FormField>

      <FormField
        label="מספר וואטסאפ למימוש זכייה"
        hint="המקבל יוכל ללחוץ 'מימוש לזכייה' ולשלוח לך הודעה. לדוגמה: 0501234567"
      >
        <input
          type="tel"
          value={form.owner_whatsapp || ""}
          onChange={(e) => updateField("owner_whatsapp", e.target.value || null)}
          className={inputClass}
          placeholder="0501234567"
          dir="ltr"
        />
      </FormField>
      </>
      )}

      <FormField
        label={isInvitation ? "סאונד אישי להזמנה" : "סאונד אישי למתנה"}
        hint="סאונד שיתנגן כשמגרדים את הכרטיס — העלה קובץ או הקלט הודעה קולית"
      >
        <SoundUpload
          currentUrl={form.custom_sound_url}
          uploading={uploading === "custom_sound_url"}
          onUpload={handleAudioUpload}
          onRemove={() => updateField("custom_sound_url", null)}
        />
      </FormField>

      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
        <input
          type="checkbox"
          id="scratch_sound_enabled"
          checked={form.scratch_sound_enabled}
          onChange={(e) => updateField("scratch_sound_enabled", e.target.checked)}
          className="w-5 h-5 rounded text-purple-600"
        />
        <label htmlFor="scratch_sound_enabled" className="text-gray-700">
          <span className="font-medium">סאונד גירוד</span>
          <span className="block text-xs text-gray-500 mt-0.5">
            צליל של גרידה בזמן שמגרדים את הכרטיס
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => updateField("is_active", e.target.checked)}
          className="w-5 h-5 rounded text-purple-600"
        />
        <label htmlFor="is_active" className="text-gray-700 font-medium">
          {isInvitation ? "הזמנה פעילה" : "מתנה פעילה"}
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {loading ? "שומר..." : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none";

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function ImageUpload({
  currentUrl,
  uploading,
  onUpload,
  onRemove,
  label = "📷 לחץ להעלאת תמונה",
}: {
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  label?: string;
}) {
  return (
    <div>
      {currentUrl ? (
        <div className="relative inline-block">
          <img src={currentUrl} alt="" className="h-32 rounded-xl object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -left-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 transition-colors">
          <span className="text-gray-400">{uploading ? "מעלה..." : label}</span>
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
}
