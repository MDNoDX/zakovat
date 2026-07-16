"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Kept simple on purpose — no external error-reporting service is wired
    // up (no backend), so this just surfaces the error where a developer
    // would actually see it.
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Nimadir noto&apos;g&apos;ri ketdi</h1>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Kutilmagan xatolik yuz berdi. Sahifani qayta yuklashga urinib ko&apos;ring — sizning
          ma&apos;lumotlaringiz brauzeringizda saqlanib qolgan.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => reset()}>
          <RotateCcw className="h-4 w-4" /> Qayta urinish
        </Button>
        <Link href="/">
          <Button>Bosh sahifaga qaytish</Button>
        </Link>
      </div>
    </div>
  );
}
