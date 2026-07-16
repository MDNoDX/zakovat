"use client";

import { useQuizStore } from "@/lib/store";
import { LocalizedTextInput } from "@/components/editor/LocalizedTextInput";
import { LocalizedRichTextEditor } from "@/components/editor/LocalizedRichTextEditor";
import { Select } from "@/components/ui/select";
import { REVEAL_MODES, type Stage } from "@/types/quiz";

export function StageSettingsPanel({
  quizId,
  stage,
}: {
  quizId: string;
  stage: Stage;
}) {
  const updateStage = useQuizStore((s) => s.updateStage);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-10 py-10">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent">
          Bosqich sozlamalari
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Kirish slaydi va qoidalar</h1>
      </div>

      <LocalizedTextInput
        label="Bosqich nomi"
        value={stage.name}
        placeholder="Masalan: 1-BOSQICH"
        onChange={(name) => updateStage(quizId, stage.id, { name })}
      />

      <LocalizedRichTextEditor
        label="Tavsif / qoidalar"
        value={stage.description}
        placeholder="Ushbu bosqich qoidalarini yozing..."
        onChange={(description) => updateStage(quizId, stage.id, { description })}
      />

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Javob ochilish tartibi</p>
        <div className="flex flex-col gap-2">
          {REVEAL_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateStage(quizId, stage.id, { revealMode: mode.value })}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                stage.revealMode === mode.value
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-surface-2 hover:bg-foreground/5"
              }`}
            >
              <div className="text-sm font-medium">{mode.label}</div>
              <div className="text-xs text-muted-foreground">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        Ushbu bosqichda <span className="text-foreground">{stage.questions.length}</span> ta
        savol bor. Savol qo&apos;shish yoki tartiblash uchun chapdagi ro&apos;yxatdan
        foydalaning.
      </div>
    </div>
  );
}
