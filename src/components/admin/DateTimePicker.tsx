"use client";

interface DateTimePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  required?: boolean;
  minDate?: string;
  allowPastDates?: boolean;
}

function splitLocalDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function combineLocalDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T${time || "12:00"}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function todayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const QUICK_TIMES = ["17:00", "18:00", "19:00", "19:30", "20:00", "21:00"];

const inputClass =
  "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white";

export default function DateTimePicker({
  value,
  onChange,
  required = false,
  minDate,
  allowPastDates = false,
}: DateTimePickerProps) {
  const { date, time } = splitLocalDateTime(value);

  function updateDate(newDate: string) {
    if (!newDate) {
      onChange(null);
      return;
    }
    onChange(combineLocalDateTime(newDate, time || "19:00"));
  }

  function updateTime(newTime: string) {
    if (!date) {
      onChange(combineLocalDateTime(todayDateString(), newTime));
      return;
    }
    onChange(combineLocalDateTime(date, newTime));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">📅 תאריך</label>
          <input
            type="date"
            value={date}
            min={allowPastDates ? undefined : (minDate ?? todayDateString())}
            onChange={(e) => updateDate(e.target.value)}
            className={inputClass}
            required={required}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">🕐 שעה</label>
          <input
            type="time"
            value={time}
            onChange={(e) => updateTime(e.target.value)}
            className={inputClass}
            required={required}
            step={300}
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-2">שעות נפוצות — לחץ לבחירה מהירה</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateTime(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                time === t
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
