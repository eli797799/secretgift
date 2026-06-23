import Link from "next/link";
import { getAuthUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getAuthUser();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="text-center text-white max-w-md">
        <div className="text-7xl mb-6">🎁</div>
        <h1 className="text-4xl font-bold mb-4">SecretGift</h1>
        <p className="text-lg opacity-90 mb-8">
          צור מתנות מיוחדות עם כרטיס גירוד אינטראקטיבי
        </p>

        {user ? (
          <Link
            href="/dashboard"
            className="inline-block bg-white text-purple-600 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            המתנות שלי
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-white text-purple-600 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              הרשמה
            </Link>
            <Link
              href="/login"
              className="inline-block bg-white/20 text-white font-semibold px-8 py-3 rounded-full border-2 border-white/50 hover:bg-white/30 transition-all hover:scale-105"
            >
              התחברות
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
