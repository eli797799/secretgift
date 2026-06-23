"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isSignup = mode === "signup";
  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!configured) {
      setError("יש להגדיר מפתחות Supabase בקובץ .env.local");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(translateError(signUpError.message));
          return;
        }

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        setMessage("נרשמת בהצלחה! בדוק את תיבת המייל לאימות החשבון, ואז התחבר.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(translateError(signInError.message));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה לא צפויה, נסה שוב";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{isSignup ? "✨" : "🔐"}</div>
          <h1 className="text-2xl font-bold text-gray-800">SecretGift</h1>
          <p className="text-gray-500 mt-2">
            {isSignup ? "צור חשבון חדש" : "התחבר לחשבון שלך"}
          </p>
        </div>

        {!configured && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            חסרים מפתחות Supabase. הוסף אותם ל-<code dir="ltr">.env.local</code> והפעל מחדש את השרת.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם מלא"
              className={inputClass}
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל"
            className={inputClass}
            required
            dir="ltr"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה (לפחות 6 תווים)"
            className={inputClass}
            minLength={6}
            required
            dir="ltr"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-600 text-sm text-center">{message}</p>}

          <button
            type="submit"
            disabled={loading || !configured}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? "רגע..."
              : isSignup
                ? "הרשמה"
                : "התחברות"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isSignup ? (
            <>
              כבר יש לך חשבון?{" "}
              <Link href="/login" className="text-purple-600 font-medium hover:underline">
                התחבר
              </Link>
            </>
          ) : (
            <>
              אין לך חשבון?{" "}
              <Link href="/signup" className="text-purple-600 font-medium hover:underline">
                הירשם בחינם
              </Link>
            </>
          )}
        </p>

        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            חזרה לדף הבית
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg";

function translateError(message: string): string {
  if (message.includes("Invalid login credentials")) return "אימייל או סיסמה שגויים";
  if (message.includes("User already registered")) return "משתמש עם אימייל זה כבר קיים";
  if (message.includes("Password should be at least")) return "הסיסמה חייבת להכיל לפחות 6 תווים";
  if (message.includes("Unable to validate email")) return "כתובת אימייל לא תקינה";
  if (message.includes("Email not confirmed")) return "יש לאמת את האימייל לפני ההתחברות";
  return message;
}
