import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Compass className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sahifa topilmadi</h1>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Siz izlagan sahifa mavjud emas yoki ko&apos;chirilgan.
        </p>
      </div>
      <Link href="/">
        <Button>Bosh sahifaga qaytish</Button>
      </Link>
    </div>
  );
}
