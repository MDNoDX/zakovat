"use client";

import type { CSSProperties } from "react";
import { DEFAULT_INTRO_STYLE, isLocalizedTextEmpty, type Stage, type Language } from "@/types/quiz";
import { tFor } from "@/lib/i18n";
import { MultiLangText } from "@/components/present/MultiLangText";
import { cn } from "@/lib/utils";

export function StageIntroSlide({ stage, languages }: { stage: Stage; languages: Language[] }) {
  const hasName = !isLocalizedTextEmpty(stage.name);
  const hasDescription = !isLocalizedTextEmpty(stage.description);
  const primaryLanguage = languages[0] ?? "uz";
  const style = stage.introStyle ?? DEFAULT_INTRO_STYLE;

  const alignItems =
    style.align === "left" ? "items-start" : style.align === "right" ? "items-end" : "items-center";
  const textAlign =
    style.align === "left" ? "text-left" : style.align === "right" ? "text-right" : "text-center";

  // Overriding these CSS custom properties on a wrapper flips every
  // "prose" text color underneath it (headings, bold, body) without ever
  // touching the app's own theme tokens — a per-stage override, scoped
  // only to this slide.
  const colorVars: CSSProperties | undefined = style.textColor
    ? ({
        "--tw-prose-body": style.textColor,
        "--tw-prose-headings": style.textColor,
        "--tw-prose-bold": style.textColor,
        color: style.textColor,
      } as CSSProperties)
    : undefined;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {style.background === "solid" && (
        <div className="absolute inset-0" style={{ backgroundColor: style.backgroundColor }} />
      )}
      {style.background === "gradient" && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${style.backgroundColor}55, transparent 70%)`,
          }}
        />
      )}
      <div
        className={cn(
          "relative z-10 flex h-full w-full flex-col justify-center px-16",
          alignItems,
          textAlign
        )}
        style={colorVars}
      >
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.4em] text-accent">
          {stage.questions.length > 0
            ? `${stage.questions.length} ${tFor("questionWord", primaryLanguage)}`
            : tFor("newStage", primaryLanguage)}
        </p>
        {hasName ? (
          <MultiLangText
            text={stage.name}
            languages={languages}
            size={style.nameSize}
            align={style.align}
            weight="font-bold"
            proseClassName={style.textColor ? undefined : "text-foreground"}
          />
        ) : (
          <h1
            className="max-w-5xl text-6xl font-bold leading-tight tracking-tight text-foreground md:text-7xl"
            style={style.textColor ? { color: style.textColor } : undefined}
          >
            {tFor("untitledStage", primaryLanguage)}
          </h1>
        )}
        {hasDescription && (
          <MultiLangText
            text={stage.description}
            languages={languages}
            size={style.descriptionSize}
            align={style.align}
            weight="font-normal"
            className="mt-8"
            proseClassName={style.textColor ? undefined : "max-w-2xl text-muted-foreground"}
          />
        )}
      </div>
    </div>
  );
}
