"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  GripVertical,
  Type,
  ListChecks,
  Image as ImageIcon,
  LayoutGrid,
  Music,
  Video,
  Copy,
  Trash2,
} from "lucide-react";
import type { Question } from "@/types/quiz";
import { useQuizStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<Question["type"], React.ElementType> = {
  text: Type,
  "multiple-choice": ListChecks,
  image: ImageIcon,
  "multi-image": LayoutGrid,
  music: Music,
  video: Video,
};

interface DragItem {
  id: string;
  index: number;
  stageId: string;
}

export function QuestionItem({
  quizId,
  stageId,
  question,
  index,
  order,
  isActive,
  onSelect,
}: {
  quizId: string;
  stageId: string;
  question: Question;
  index: number;
  order: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reorderQuestions = useQuizStore((s) => s.reorderQuestions);
  const deleteQuestion = useQuizStore((s) => s.deleteQuestion);
  const duplicateQuestion = useQuizStore((s) => s.duplicateQuestion);

  const [, drop] = useDrop<DragItem>({
    accept: "QUESTION",
    hover(item, monitor) {
      if (!ref.current || item.stageId !== stageId) return;
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
      reorderQuestions(quizId, stageId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "QUESTION",
    item: (): DragItem => ({ id: question.id, index, stageId }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const Icon = TYPE_ICON[question.type];
  const title = question.prompt.uz || question.prompt.ru || question.prompt.en;

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        isActive ? "bg-accent/15 text-foreground" : "text-muted-foreground hover:bg-foreground/5",
        isDragging && "opacity-40"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {title ? (
          <span dangerouslySetInnerHTML={{ __html: stripHeavyTags(title) }} />
        ) : (
          <span className="italic text-muted-foreground/60">{order}-savol</span>
        )}
      </span>
      <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
        <button
          title="Nusxalash"
          onClick={(e) => {
            e.stopPropagation();
            duplicateQuestion(quizId, stageId, question.id);
          }}
          className="rounded p-1 hover:bg-foreground/10"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          title="O'chirish"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Savolni o'chirasizmi?")) deleteQuestion(quizId, stageId, question.id);
          }}
          className="rounded p-1 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function stripHeavyTags(html: string) {
  return html.replace(/<(?!\/?(b|strong|i|em)\b)[^>]*>/gi, "").slice(0, 80);
}
