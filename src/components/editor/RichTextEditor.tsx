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

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minimal?: boolean;
}

const FONT_SIZES = [
  { label: "S", value: "0.875em" },
  { label: "M", value: "1em" },
  { label: "L", value: "1.4em" },
  { label: "XL", value: "1.9em" },
];

const SWATCHES = ["#F8FAFC", "#3B82F6", "#F87171", "#FBBF24", "#34D399", "#A78BFA"];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minimal,
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
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || "" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "editor-content prose prose-invert max-w-none text-sm leading-relaxed",
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

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Havola manzili (URL):", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={cn("rounded-lg border border-border bg-surface-2", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Qalin"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Kursiv"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="Tag'ich chizilgan"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        {!minimal && (
          <>
            <Divider />
            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              label="Chapga"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              label="Markazga"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              label="Ro'yxat"
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              label="Raqamli ro'yxat"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={setLink} active={editor.isActive("link")} label="Havola">
              <LinkIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <Divider />
            <div className="flex items-center gap-0.5 px-0.5">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => editor.chain().focus().setFontSize(f.value).run()}
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                >
                  {f.label}
                </button>
              ))}
            </div>
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
