"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CodeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/xakcode");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#07070e] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Loading workspace configurations...</span>
      </div>
    </div>
  );
}
