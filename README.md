# SecretGift

מערכת ליצירה וניהול מתנות דיגיטליות עם כרטיס גירוד אינטראקטיבי.

## תכונות

### חשבון משתמש
- הרשמה והתחברות עם אימייל וסיסמה
- כל משתמש מנהל את המתנות שלו בלבד

### לוח בקרה
- יצירה, עריכה ומחיקה של מתנות
- הפעלה / השבתה של מתנות
- סטטיסטיקות: צפיות, גירודים, חשיפות, שיתופים
- העלאת תמונות (רקע, שכבת גירוד, תמונת זכייה)

### עמוד מתנה (למקבל)
- כרטיס גירוד אינטראקטיבי (מגע + עכבר)
- אנימציות חשיפה: קונפטי, זיקוקים, נצנצים, זכייה
- שיתוף בוואטסאפ
- מותאם למובייל (Android, iPhone, WhatsApp Browser)

## התקנה

### 1. התקנת תלויות

```bash
npm install
```

### 2. הגדרת Supabase

1. צור פרויקט חדש ב-[Supabase](https://supabase.com)
2. הרץ את הסקריפט `supabase/schema.sql` ב-SQL Editor
3. ב-Supabase Dashboard: **Authentication → Providers → Email** — ודא שהספק פעיל
4. לפיתוח מהיר: **Authentication → Providers → Email** → כבה "Confirm email"
5. העתק את פרטי החיבור

### 3. משתני סביבה

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. הרצה

```bash
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

- **הרשמה:** `/signup`
- **התחברות:** `/login`
- **לוח בקרה:** `/dashboard`
- **עמוד מתנה:** `/g/{slug}`

## פריסה ב-Vercel

### 1. העלאה ל-GitHub

```bash
git add .
git commit -m "Initial commit: SecretGift"
git branch -M main
git remote add origin https://github.com/YOUR_USER/secretgift.git
git push -u origin main
```

### 2. ייבוא ב-Vercel

1. לחץ **הוסף חדש… → Project**
2. בחר את הריפו `secretgift` מ-GitHub
3. Framework: **Next.js** (יזוהה אוטומטית)
4. הוסף **משתני סביבה** (Environment Variables):

| משתנה | ערך |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kbromhwtikvnkgosafsr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | המפתח מ-Supabase |
| `NEXT_PUBLIC_APP_URL` | כתובת האתר ב-Vercel (למשל `https://secretgift.vercel.app`) |

5. לחץ **Deploy**

### 3. הגדרות Supabase אחרי הפריסה

ב-Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`

> חשוב: עדכן את `NEXT_PUBLIC_APP_URL` ב-Vercel לכתובת האמיתית — כך קישורי השיתוף של המתנות יעבדו נכון.

### 4. מסד נתונים

אם עדיין לא הרצת — העתק את `supabase/schema.sql` ל-**SQL Editor** ב-Supabase ולחץ Run.

## טכנולוגיות

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase Auth + PostgreSQL + Storage
- **אנימציות:** canvas-confetti
