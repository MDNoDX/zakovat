"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/lib/store";

export function NewQuizDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const createQuiz = useQuizStore((s) => s.createQuiz);
  const router = useRouter();

  function handleCreate() {
    const id = createQuiz(title.trim() || "Nomsiz Zakovat");
    setTitle("");
    onOpenChange(false);
    router.push(`/edit/${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi Zakovat yaratish</DialogTitle>
          <DialogDescription>Nomini kiriting, keyin bosqichlar qo&apos;shasiz.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masalan: Kino Zakovati 2026"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleCreate}>Yaratish</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
