"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { isLocalizedTextEmpty, type ClosingWinners, type Language, type Quiz } from "@/types/quiz";
import { useQuizStore } from "@/lib/store";
import { MultiLangText } from "@/components/present/MultiLangText";
import { tFor } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MEDAL = ["🥇", "🥈", "🥉"] as const;
const RANK_KEYS: (keyof ClosingWinners)[] = ["first", "second", "third"];
const RANK_LABEL_KEY = ["firstPlaceLabel", "secondPlaceLabel", "thirdPlaceLabel"] as const;

/**
 * The one-time closing slide, shown after the very last stage's last
 * answer. Scoring itself happens outside the app (e.g. tallying paper
 * answer cards), so the winner name(s) usually aren't known until the
 * event is already underway — this slide lets the moderator type them in
 * directly, live, without leaving Presentation Mode.
 */
export function FinalSlide({ quiz, languages }: { quiz: Quiz; languages: Language[] }) {
  const updateQuiz = useQuizStore((s) => s.updateQuiz);
  const primaryLanguage = languages[0] ?? quiz.defaultLanguage;
  const closing = quiz.closingSlide;
  const hasTitle = !!closing && !isLocalizedTextEmpty(closing.title);
  const hasMessage = !!closing && !isLocalizedTextEmpty(closing.message);
  const showRanking = closing?.showRanking ?? true;
  const winners = closing?.winners ?? {};

  function setWinner(key: keyof ClosingWinners, value: string) {
    updateQuiz(quiz.id, {
      closingSlide: {
        enabled: true,
        showRanking,
        ...closing,
        winners: { ...winners, [key]: value },
      },
    });
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-16 text-center">
      <Trophy className="h-14 w-14 text-accent" />
      {hasTitle ? (
        <MultiLangText text={closing!.title} languages={languages} size="hero" weight="font-bold" />
      ) : (
        <h1 className="max-w-4xl text-6xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
          {tFor("closingDefaultTitle", primaryLanguage)}
        </h1>
      )}
      {hasMessage && (
        <MultiLangText
          text={closing!.message}
          languages={languages}
          size="small"
          weight="font-normal"
          proseClassName="max-w-2xl text-muted-foreground"
        />
      )}
      {showRanking && (
        <div className="mt-4 flex flex-wrap items-end justify-center gap-5">
          {RANK_KEYS.map((key, i) => (
            <WinnerCard
              key={key}
              medal={MEDAL[i]}
              label={tFor(RANK_LABEL_KEY[i], primaryLanguage)}
              value={winners[key] ?? ""}
              placeholder={tFor("teamNamePlaceholder", primaryLanguage)}
              onChange={(v) => setWinner(key, v)}
              emphasis={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WinnerCard({
  medal,
  label,
  value,
  placeholder,
  onChange,
  emphasis,
}: {
  medal: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  emphasis?: boolean;
}) {
  // Local draft so keystrokes don't each round-trip through the store —
  // only committed on blur/Enter, same spirit as every other free-text
  // field in the app.
  const [draft, setDraft] = useState(value);

  // Keep in sync with external changes (e.g. Ctrl+Z undo, or the same
  // field being pre-filled in Quiz Settings while this slide is mounted).
  useEffect(() => setDraft(value), [value]);

  return (
    <div
      className={cn(
        "flex w-56 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 backdrop-blur-sm",
        emphasis && "w-64 border-accent/40 bg-accent/10 py-8"
      )}
    >
      <span className={cn("leading-none", emphasis ? "text-5xl" : "text-3xl")}>{medal}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
        {label}
      </span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(draft.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder={placeholder}
        className={cn(
          "w-full border-b border-transparent bg-transparent text-center font-bold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/50 focus:border-accent/50",
          emphasis ? "text-2xl" : "text-lg"
        )}
      />
    </div>
  );
}
