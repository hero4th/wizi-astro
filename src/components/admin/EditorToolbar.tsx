import { useEffect, useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

/**
 * The always-visible toolbar. Everything the editor can do is reachable from
 * here — the bubble menu and "/" commands are shortcuts, not the only way in.
 */

const FONTS = [
  { label: "Predeterminada", value: "" },
  { label: "Hanken Grotesk", value: "'Hanken Grotesk Variable', sans-serif" },
  { label: "Bricolage Grotesque", value: "'Bricolage Grotesque Variable', sans-serif" },
  { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 30, 36, 48];
const DEFAULT_SIZE = 16;

const TEXT_COLORS = [
  "#060a0a", "#3d4e4d", "#0d9488", "#0f766e", "#1d4ed8",
  "#7c3aed", "#dc2626", "#d97706", "#059669", "#8a9897",
];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

export interface Snippet {
  id: number;
  name: string;
  html: string;
}

interface Props {
  editor: Editor;
  snippets: Snippet[];
  onInsertSnippet: (s: Snippet) => void;
  onSaveSnippet: () => void;
  onDeleteSnippet: (id: number) => void;
  onInsertImage: () => void;
}

function Btn({
  onClick, active, disabled, title, children, wide,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn("tb-btn", active && "is-active", wide && "tb-btn-wide")}
    >
      {children}
    </button>
  );
}

/** A popover anchored to its trigger, closing on outside click or Escape. */
function Popover({
  label, title, children, width,
}: {
  label: React.ReactNode; title: string; children: (close: () => void) => React.ReactNode; width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="tb-pop-wrap" ref={ref}>
      <button
        type="button"
        className={cn("tb-btn", open && "is-active")}
        onClick={() => setOpen((v) => !v)}
        title={title}
        aria-label={title}
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className="tb-pop" style={width ? { width } : undefined}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export default function EditorToolbar({
  editor, snippets, onInsertSnippet, onSaveSnippet, onDeleteSnippet, onInsertImage,
}: Props) {
  /* Tiptap v3 doesn't re-render React on every transaction (that's opt-in
     legacy behaviour), so active states are subscribed to explicitly here.
     This also keeps the toolbar from re-rendering on every keystroke. */
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      subscript: e.isActive("subscript"),
      superscript: e.isActive("superscript"),
      link: e.isActive("link"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      alignLeft: e.isActive({ textAlign: "left" }),
      alignCenter: e.isActive({ textAlign: "center" }),
      alignRight: e.isActive({ textAlign: "right" }),
      alignJustify: e.isActive({ textAlign: "justify" }),
      fontFamily: (e.getAttributes("textStyle").fontFamily as string) ?? "",
      fontSize: (e.getAttributes("textStyle").fontSize as string) ?? "",
      color: (e.getAttributes("textStyle").color as string) ?? "#060a0a",
      block: e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : e.isActive("heading", { level: 4 })
            ? "h4"
            : e.isActive("blockquote")
              ? "quote"
              : e.isActive("codeBlock")
                ? "code"
                : "p",
    }),
  });

  const parsedSize = parseInt(s.fontSize, 10);
  const currentSize = Number.isFinite(parsedSize) ? parsedSize : DEFAULT_SIZE;

  const setSize = (px: number) => {
    const clamped = Math.min(96, Math.max(10, px));
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  };

  const blockValue = s.block;

  const applyBlock = (value: string) => {
    const c = editor.chain().focus();
    if (value === "p") c.setParagraph().run();
    else if (value === "quote") c.setParagraph().toggleBlockquote().run();
    else if (value === "code") c.toggleCodeBlock().run();
    else c.setNode("heading", { level: Number(value.slice(1)) }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("Pega el enlace del video de YouTube");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  };

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Herramientas de edición">
      {/* History */}
      <div className="tb-group">
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!s.canUndo} title="Deshacer (Ctrl+Z)">↶</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!s.canRedo} title="Rehacer (Ctrl+Y)">↷</Btn>
      </div>

      {/* Block type */}
      <div className="tb-group">
        <select
          className="tb-select"
          aria-label="Tipo de bloque"
          value={blockValue}
          onChange={(e) => applyBlock(e.target.value)}
        >
          <option value="p">Párrafo</option>
          <option value="h2">Título H2</option>
          <option value="h3">Subtítulo H3</option>
          <option value="h4">Apartado H4</option>
          <option value="quote">Cita</option>
          <option value="code">Código</option>
        </select>
      </div>

      {/* Font + size */}
      <div className="tb-group">
        <select
          className="tb-select tb-select-font"
          aria-label="Fuente"
          value={s.fontFamily}
          onChange={(e) =>
            e.target.value
              ? editor.chain().focus().setFontFamily(e.target.value).run()
              : editor.chain().focus().unsetFontFamily().run()
          }
        >
          {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>

        <Btn onClick={() => setSize(currentSize - 2)} title="Reducir tamaño">A−</Btn>
        <select
          className="tb-select tb-select-size"
          aria-label="Tamaño de texto"
          value={currentSize}
          onChange={(e) => setSize(Number(e.target.value))}
        >
          {!FONT_SIZES.includes(currentSize) && <option value={currentSize}>{currentSize}</option>}
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={() => setSize(currentSize + 2)} title="Aumentar tamaño">A+</Btn>
      </div>

      {/* Inline marks */}
      <div className="tb-group">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={s.bold} title="Negrita"><strong>N</strong></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={s.italic} title="Cursiva"><em>K</em></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={s.underline} title="Subrayado"><u>S</u></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={s.strike} title="Tachado"><s>T</s></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={s.code} title="Código en línea">{"</>"}</Btn>
        <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={s.subscript} title="Subíndice">X₂</Btn>
        <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={s.superscript} title="Superíndice">X²</Btn>
      </div>

      {/* Colors */}
      <div className="tb-group">
        <Popover title="Color del texto" label={<span className="tb-color-chip" style={{ background: s.color }} />} width={190}>
          {(close) => (
            <>
              <p className="tb-pop-title">Color del texto</p>
              <div className="tb-swatches">
                {TEXT_COLORS.map((c) => (
                  <button key={c} type="button" className="tb-swatch" style={{ background: c }} title={c}
                    onClick={() => { editor.chain().focus().setColor(c).run(); close(); }} />
                ))}
              </div>
              <button type="button" className="tb-pop-action" onClick={() => { editor.chain().focus().unsetColor().run(); close(); }}>
                Quitar color
              </button>
            </>
          )}
        </Popover>

        <Popover title="Resaltar" label={<span className="tb-hl-chip">▮</span>} width={190}>
          {(close) => (
            <>
              <p className="tb-pop-title">Resaltador</p>
              <div className="tb-swatches">
                {HIGHLIGHTS.map((c) => (
                  <button key={c} type="button" className="tb-swatch" style={{ background: c }} title={c}
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); close(); }} />
                ))}
              </div>
              <button type="button" className="tb-pop-action" onClick={() => { editor.chain().focus().unsetHighlight().run(); close(); }}>
                Quitar resaltado
              </button>
            </>
          )}
        </Popover>
      </div>

      {/* Alignment */}
      <div className="tb-group">
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={s.alignLeft} title="Alinear a la izquierda">≡</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={s.alignCenter} title="Centrar">≣</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={s.alignRight} title="Alinear a la derecha">≡</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={s.alignJustify} title="Justificar">☰</Btn>
      </div>

      {/* Lists */}
      <div className="tb-group">
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={s.bulletList} title="Lista con viñetas">•</Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={s.orderedList} title="Lista numerada">1.</Btn>
        <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={s.taskList} title="Lista de tareas">☑</Btn>
      </div>

      {/* Inserts */}
      <div className="tb-group">
        <Btn onClick={setLink} active={s.link} title="Enlace">🔗</Btn>
        <Btn onClick={onInsertImage} title="Insertar imagen">🖼</Btn>
        <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insertar tabla">▦</Btn>
        <Btn onClick={addYoutube} title="Insertar video de YouTube">▶</Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea divisoria">―</Btn>

        <Popover title="Bloque destacado" label="❗" width={200}>
          {(close) => (
            <>
              <p className="tb-pop-title">Bloque destacado</p>
              {([
                ["info", "Información"],
                ["success", "Éxito"],
                ["warning", "Advertencia"],
                ["danger", "Peligro"],
              ] as const).map(([kind, label]) => (
                <button key={kind} type="button" className={cn("tb-pop-item", `is-${kind}`)}
                  onClick={() => { editor.chain().focus().toggleCallout(kind).run(); close(); }}>
                  {label}
                </button>
              ))}
            </>
          )}
        </Popover>
      </div>

      {/* Snippets */}
      <div className="tb-group">
        <Popover title="Bloques guardados" label="⌸" width={260}>
          {(close) => (
            <>
              <p className="tb-pop-title">Bloques guardados</p>
              {snippets.length === 0 && <p className="tb-pop-empty">Aún no guardas ninguno.</p>}
              {snippets.map((s) => (
                <div key={s.id} className="tb-snippet-row">
                  <button type="button" className="tb-pop-item" onClick={() => { onInsertSnippet(s); close(); }}>
                    {s.name}
                  </button>
                  <button type="button" className="tb-snippet-del" title="Eliminar bloque"
                    onClick={() => onDeleteSnippet(s.id)}>×</button>
                </div>
              ))}
              <button type="button" className="tb-pop-action" onClick={() => { onSaveSnippet(); close(); }}>
                + Guardar selección como bloque
              </button>
            </>
          )}
        </Popover>

        <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Limpiar formato">✕ᶠ</Btn>
      </div>
    </div>
  );
}

/** Contextual controls, shown only while the caret is inside a table. */
export function TableToolbar({ editor }: { editor: Editor }) {
  const inTable = useEditorState({
    editor,
    selector: ({ editor: e }) => e.isActive("table"),
  });
  if (!inTable) return null;
  const run = (fn: () => void) => () => fn();

  return (
    <div className="editor-toolbar editor-toolbar-context" role="toolbar" aria-label="Herramientas de tabla">
      <span className="tb-context-label">Tabla</span>
      <div className="tb-group">
        <Btn onClick={run(() => editor.chain().focus().addColumnBefore().run())} title="Insertar columna antes">↞col</Btn>
        <Btn onClick={run(() => editor.chain().focus().addColumnAfter().run())} title="Insertar columna después">col↠</Btn>
        <Btn onClick={run(() => editor.chain().focus().deleteColumn().run())} title="Eliminar columna">✕col</Btn>
      </div>
      <div className="tb-group">
        <Btn onClick={run(() => editor.chain().focus().addRowBefore().run())} title="Insertar fila arriba">↑fila</Btn>
        <Btn onClick={run(() => editor.chain().focus().addRowAfter().run())} title="Insertar fila abajo">fila↓</Btn>
        <Btn onClick={run(() => editor.chain().focus().deleteRow().run())} title="Eliminar fila">✕fila</Btn>
      </div>
      <div className="tb-group">
        <Btn onClick={run(() => editor.chain().focus().toggleHeaderRow().run())} title="Alternar fila de encabezado">Encab. fila</Btn>
        <Btn onClick={run(() => editor.chain().focus().toggleHeaderColumn().run())} title="Alternar columna de encabezado">Encab. col</Btn>
      </div>
      <div className="tb-group">
        <Btn onClick={run(() => editor.chain().focus().mergeOrSplit().run())} title="Combinar o dividir celdas">Combinar/dividir</Btn>
        <Btn onClick={run(() => editor.chain().focus().deleteTable().run())} title="Eliminar tabla">✕ Tabla</Btn>
      </div>
    </div>
  );
}

/** Contextual controls, shown only while an image is selected. */
export function ImageToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      active: e.isActive("image"),
      attrs: e.getAttributes("image") as Record<string, string>,
    }),
  });
  if (!state.active) return null;

  const attrs = state.attrs;
  const set = (patch: Record<string, string>) =>
    editor.chain().focus().updateAttributes("image", patch).run();

  const editAlt = () => {
    const alt = window.prompt("Texto alternativo (describe la imagen para accesibilidad y SEO)", attrs.alt ?? "");
    if (alt !== null) set({ alt });
  };

  return (
    <div className="editor-toolbar editor-toolbar-context" role="toolbar" aria-label="Herramientas de imagen">
      <span className="tb-context-label">Imagen</span>
      <div className="tb-group">
        {([["small", "S"], ["medium", "M"], ["large", "L"], ["full", "Completa"]] as const).map(([size, label]) => (
          <Btn key={size} onClick={() => set({ "data-size": size })} active={attrs["data-size"] === size} title={`Tamaño ${label}`}>
            {label}
          </Btn>
        ))}
      </div>
      <div className="tb-group">
        {([["left", "◧"], ["center", "▣"], ["right", "◨"]] as const).map(([align, icon]) => (
          <Btn key={align} onClick={() => set({ "data-align": align })} active={attrs["data-align"] === align} title={`Alinear ${align}`}>
            {icon}
          </Btn>
        ))}
      </div>
      <div className="tb-group">
        <Btn onClick={editAlt} title="Editar texto alternativo" wide>
          Alt{attrs.alt ? " ✓" : " ⚠"}
        </Btn>
        <Btn onClick={() => editor.chain().focus().deleteSelection().run()} title="Eliminar imagen">✕</Btn>
      </div>
    </div>
  );
}
