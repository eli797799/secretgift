"use client";

import { usePathname } from "next/navigation";

export default function SiteCredit() {
  const pathname = usePathname();
  const onPublicGiftPage = pathname?.startsWith("/g/");

  return (
    <p
      className={`fixed bottom-2 inset-x-0 z-50 pointer-events-none select-none text-center text-[10px] font-normal leading-none ${
        onPublicGiftPage ? "text-white/45" : "text-gray-500/55"
      }`}
      aria-hidden
    >
      נבנה ע&quot;י אלי לבין
    </p>
  );
}
