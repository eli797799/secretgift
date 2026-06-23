"use client";

import { useRef, useState } from "react";

interface SoundUploadProps {
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

export default function SoundUpload({
  currentUrl,
  uploading,
  onUpload,
  onRemove,
}: SoundUploadProps) {
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = "";
  }

  async function startRecording() {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "audio";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: mimeType });
        await onUpload(file);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecordError("לא ניתן לגשת למיקרופון. בדוק הרשאות בדפדפן.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <audio src={currentUrl} controls className="w-full mb-3" />
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            ✕ הסר סאונד
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <label className="flex items-center justify-center w-full py-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-600 font-medium">
              {uploading ? "מעלה..." : "📁 העלה קובץ סאונד (MP3, WAV, WebM)"}
            </span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading || recording}
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">או</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 animate-pulse"
            >
              ⏹️ עצור הקלטה
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 disabled:opacity-50"
            >
              🎙️ הקלט סאונד
            </button>
          )}
        </div>
      )}

      {recordError && <p className="text-sm text-red-600">{recordError}</p>}
    </div>
  );
}
