"use client";

import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getGiftUrl } from "@/lib/utils";

interface GiftQRPrintProps {
  title: string;
  slug: string;
  autoPrint?: boolean;
}

export default function GiftQRPrint({ title, slug, autoPrint = false }: GiftQRPrintProps) {
  const giftUrl = getGiftUrl(slug);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b z-10 p-4 flex gap-3 justify-center">
        <button
          onClick={() => window.print()}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700"
        >
          🖨️ הדפס
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200"
        >
          חזרה
        </button>
      </div>

      <div className="print-page flex items-center justify-center min-h-screen p-8 pt-24 print:pt-8">
        <div className="print-card bg-white rounded-3xl shadow-xl print:shadow-none border print:border-2 print:border-gray-200 p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h1 className="text-2xl font-bold text-purple-700 mb-1">SecretGift</h1>
          <p className="text-gray-400 text-sm mb-8">מתנה דיגיטלית עם כרטיס גירוד</p>

          <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">{title}</h2>

          <div className="inline-block p-4 bg-white border-2 border-gray-100 rounded-2xl mb-6">
            <QRCodeSVG value={giftUrl} size={220} level="H" includeMargin />
          </div>

          <p className="text-xl font-semibold text-gray-800 mb-2">סרקו לגלות את המתנה!</p>
          <p className="text-gray-500 text-sm mb-6">גרדו את הכרטיס וגלו מה מחכה לכם</p>

          <p className="text-xs text-gray-400 break-all font-mono" dir="ltr">
            {giftUrl}
          </p>
        </div>
      </div>

    </div>
  );
}
