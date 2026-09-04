/**
 * "/" command menu — type "/" anywhere on an empty-ish line to open a
 * filterable list of blocks to insert (heading, list, quote, image, table…).
 * Standard Tiptap Suggestion pattern: a plugin watches for the trigger
 * character, and on each keystroke re-renders a floating React menu
 * positioned with tippy.js.
 */
import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Editor, Range } from "@tiptap/core";

export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  command: (opts: { editor: Editor; range: Range }) => void;
}

const promptForImageUrl = (editor: Editor, range: Range) => {
  const url = window.prompt("URL de la imagen");
  if (!url) {
    editor.chain().focus().deleteRange(range).run();
    return;
  }
  editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
};

export const COMMAND_ITEMS: CommandItem[] = [
  {
    title: "Texto",
    description: "Párrafo normal",
    icon: "¶",
    keywords: ["parrafo", "texto", "p"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Título",
    description: "Encabezado de sección (H2)",
    icon: "H2",
    keywords: ["titulo", "h2", "encabezado", "heading"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Subtítulo",
    description: "Encabezado menor (H3)",
    icon: "H3",
    keywords: ["subtitulo", "h3", "encabezado"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Lista con viñetas",
    description: "Lista simple sin orden",
    icon: "•",
    keywords: ["lista", "bullet", "viñetas"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Lista numerada",
    description: "Lista con orden",
    icon: "1.",
    keywords: ["lista", "numerada", "ordenada"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Cita",
    description: "Bloque de cita destacado",
    icon: "❝",
    keywords: ["cita", "quote", "blockquote"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Código",
    description: "Bloque de código con formato monoespaciado",
    icon: "</>",
    keywords: ["codigo", "code"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Imagen",
    description: "Insertar desde una URL",
    icon: "🖼",
    keywords: ["imagen", "image", "foto"],
    command: ({ editor, range }) => promptForImageUrl(editor, range),
  },
  {
    title: "Tabla",
    description: "Tabla de 3×3 con encabezado",
    icon: "▦",
    keywords: ["tabla", "table"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "Línea divisoria",
    description: "Separador horizontal",
    icon: "―",
    keywords: ["linea", "divisoria", "separador", "hr"],
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

interface MenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MenuProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

const CommandMenu = forwardRef<MenuHandle, MenuProps>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setSelected((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return <div className="slash-menu slash-menu-empty">Sin resultados</div>;
  }

  return (
    <div className="slash-menu">
      {items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          className={`slash-item${i === selected ? " is-selected" : ""}`}
          onMouseEnter={() => setSelected(i)}
          onClick={() => command(item)}
        >
          <span className="slash-item-icon">{item.icon}</span>
          <span className="slash-item-text">
            <span className="slash-item-title">{item.title}</span>
            <span className="slash-item-desc">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
});
CommandMenu.displayName = "CommandMenu";

const suggestion: Omit<SuggestionOptions<CommandItem>, "editor"> = {
  char: "/",
  items: ({ query }) => {
    const q = query.toLowerCase();
    return COMMAND_ITEMS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q))
    ).slice(0, 10);
  },
  command: ({ editor, range, props }) => {
    (props as CommandItem).command({ editor, range });
  },
  render: () => {
    let component: ReactRenderer<MenuHandle, MenuProps>;
    let popup: TippyInstance[];

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandMenu, {
          props: { items: props.items, command: (item: CommandItem) => props.command(item) },
          editor: props.editor,
        });
        if (!props.clientRect) return;
        popup = tippy("body", {
          getReferenceClientRect: () => props.clientRect!()!,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: "slash-menu",
        });
      },
      onUpdate: (props) => {
        component.updateProps({ items: props.items, command: (item: CommandItem) => props.command(item) });
        if (!props.clientRect) return;
        popup[0]?.setProps({ getReferenceClientRect: () => props.clientRect!()! });
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          popup[0]?.hide();
          return true;
        }
        return component.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
};

export const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return { suggestion };
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});
