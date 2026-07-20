"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignCenter,
  AlignLeft,
  List,
  ListOrdered,
  Link as LinkIcon,
  Type,
} from "lucide-react";
import { FontSize } from "@/lib/tiptap-font-size";
import { cn } from "@/lib/utils";
import { useT, promptSizeLabel, useUiLanguageStore } from "@/lib/i18n";
import { PROMPT_SIZES, type PromptSize } from "@/types/quiz";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minimal?: boolean;
  /**
   * Swaps the toolbar's S/M/L/XL size buttons from their normal per-selection
   * behavior (a Tiptap mark on just the highlighted text — great for the
   * odd emphasized word, but easy to apply inconsistently across languages)
   * into a single whole-field tier control: clicking sets one size for the
   * entire field via `onSizeChange`, and whichever tier is currently active
   * is highlighted. Used for the question prompt, where one consistent size
   * matters far more than per-run styling, and text length must never
   * affect the rendered size.
   */
  sizeValue?: PromptSize;
  onSizeChange?: (size: PromptSize) => void;
}

const FONT_SIZES = [
  { label: "S", value: "0.875em" },
  { label: "M", value: "1em" },
  { label: "L", value: "1.4em" },
  { label: "XL", value: "1.9em" },
];

const SIZE_TIER_LABEL: Record<PromptSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
  hero: "XL",
};

const SWATCHES = ["#F8FAFC", "#3B82F6", "#F87171", "#FBBF24", "#34D399", "#A78BFA"];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minimal,
  sizeValue,
  onSizeChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      TextAlign.configure({ types: ["paragraph"] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Placeholder.configure({ placeholder: placeholder || "" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "editor-content prose max-w-none text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync when switching languages (external value change).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const t = useT();
  const uiLanguage = useUiLanguageStore((s) => s.language);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("linkPromptMessage"), previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    // Belt-and-suspenders: reject anything but http(s)/mailto even though the
    // Link extension is already configured with an allowlist — a manually
    // typed "javascript:" URL should never make it into stored content.
    if (!/^(https?:|mailto:)/i.test(url.trim())) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Per-selection sizing: with real highlighted text, resize just that
  // run — same as any word processor. But a plain cursor position with
  // nothing selected is the common case here (short fields like the
  // description or correct-answer text), and applying a mark to an empty
  // selection only affects characters typed *after* the click — nothing
  // visibly changes, which reads as "the button doesn't work." So an
  // empty selection instead resizes the whole paragraph/list-item the
  // cursor is currently in, giving an immediate, visible result.
  const applyFontSize = (size: string) => {
    const { selection } = editor.state;
    if (selection.empty) {
      const { $from } = selection;
      editor
        .chain()
        .focus()
        .setTextSelection({ from: $from.start(), to: $from.end() })
        .setFontSize(size)
        .run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  return (
    <div className={cn("rounded-lg border border-border bg-surface-2", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label={t("toolbarBold")}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label={t("toolbarItalic")}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label={t("toolbarUnderline")}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />
        <div className="flex items-center gap-0.5 px-0.5">
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          {sizeValue !== undefined && onSizeChange ? (
            // Whole-field tier mode: one size for the entire text, always
            // visibly reflecting what's currently active — no per-run
            // marks to accidentally leave inconsistent across languages.
            PROMPT_SIZES.map((tier) => (
              <button
                key={tier}
                type="button"
                title={promptSizeLabel(tier, uiLanguage)}
                onClick={() => onSizeChange(tier)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                  sizeValue === tier
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                {SIZE_TIER_LABEL[tier]}
              </button>
            ))
          ) : (
            FONT_SIZES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => applyFontSize(f.value)}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                {f.label}
              </button>
            ))
          )}
        </div>

        {!minimal && (
          <>
            <Divider />
            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              label={t("toolbarAlignLeft")}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              label={t("toolbarAlignCenter")}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              label={t("toolbarBulletList")}
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              label={t("toolbarOrderedList")}
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={setLink} active={editor.isActive("link")} label={t("toolbarLink")}>
              <LinkIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <div className="flex items-center gap-1 px-1">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  className="h-4 w-4 rounded-full border border-border transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
        active && "bg-accent/15 text-accent"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px bg-border" />;
}
