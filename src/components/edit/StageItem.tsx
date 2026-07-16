"use client";

import { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  GripVertical,
  Plus,
  Copy,
  Trash2,
  Settings2,
} from "lucide-react";
import { resolveText, type Stage } from "@/types/quiz";
import { useQuizStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { QuestionItem } from "@/components/edit/QuestionItem";
import { AddQuestionMenu } from "@/components/edit/AddQuestionMenu";
import { useT, confirmDeleteStageMessage, useUiLanguageStore } from "@/lib/i18n";

interface DragItem {
  id: string;
  index: number;
}

export function StageItem({
  quizId,
  stage,
  index,
  selection,
  onSelectStage,
  onSelectQuestion,
}: {
  quizId: string;
  stage: Stage;
  index: number;
  selection: { stageId: string | null; questionId: string | null };
  onSelectStage: (stageId: string) => void;
  onSelectQuestion: (stageId: string, questionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const reorderStages = useQuizStore((s) => s.reorderStages);
  const deleteStage = useQuizStore((s) => s.deleteStage);
  const duplicateStage = useQuizStore((s) => s.duplicateStage);
  const addQuestion = useQuizStore((s) => s.addQuestion);
  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);

  const [, drop] = useDrop<DragItem>({
    accept: "STAGE",
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      reorderStages(quizId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "STAGE",
    item: (): DragItem => ({ id: stage.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const isStageActive = selection.stageId === stage.id && !selection.questionId;
  const name = resolveText(stage.name, "uz") || `${index + 1}-bosqich`;

  return (
    <div ref={ref} className={cn(isDragging && "opacity-40")}>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm font-medium transition-colors",
          isStageActive ? "bg-accent/15 text-foreground" : "text-foreground/90 hover:bg-foreground/5"
        )}
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")}
          />
        </button>
        <button
          onClick={() => onSelectStage(stage.id)}
          className="min-w-0 flex-1 truncate text-left"
        >
          {name}
        </button>
        <span className="shrink-0 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {stage.questions.length}
        </span>
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            title={t("settings")}
            aria-label={t("settings")}
            onClick={() => onSelectStage(stage.id)}
            className="rounded p-1 hover:bg-foreground/10"
          >
            <Settings2 className="h-3 w-3" />
          </button>
          <button
            title={t("duplicate")}
            aria-label={t("duplicate")}
            onClick={() => duplicateStage(quizId, stage.id)}
            className="rounded p-1 hover:bg-foreground/10"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            title={t("delete")}
            aria-label={t("delete")}
            onClick={() => {
              if (confirm(confirmDeleteStageMessage(name, uiLanguage))) deleteStage(quizId, stage.id);
            }}
            className="rounded p-1 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="ml-4 overflow-hidden border-l border-border pl-2"
          >
            <div className="flex flex-col gap-0.5 py-1">
              {stage.questions.map((q, qIndex) => (
                <QuestionItem
                  key={q.id}
                  quizId={quizId}
                  stageId={stage.id}
                  question={q}
                  index={qIndex}
                  order={qIndex + 1}
                  isActive={selection.questionId === q.id}
                  onSelect={() => onSelectQuestion(stage.id, q.id)}
                />
              ))}
              <AddQuestionMenu
                onPick={(type) => {
                  const id = addQuestion(quizId, stage.id, type);
                  onSelectQuestion(stage.id, id);
                }}
              >
                <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
                  <Plus className="h-3 w-3" /> {t("addQuestion")}
                </button>
              </AddQuestionMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
