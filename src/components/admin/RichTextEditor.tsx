import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const FONTS = [
  { label: "Predeterminada", value: "" },
  { label: "Hanken Grotesk", value: "'Hanken Grotesk Variable', sans-serif" },
  { label: "Bricolage Grotesque", value: "'Bricolage Grotesque Variable', sans-serif" },
  { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
];

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.url as string;
}

function Toolbar({ editor, uploading }: { editor: Editor; uploading: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickImage = () => fileInputRef.current?.click();

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      alert(`No se pudo subir la imagen: ${(err as Error).message}`);
    }
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

  const Btn = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`rte-btn${active ? " is-active" : ""}`}>
      {children}
    </button>
  );

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Formato de texto">
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileChosen} />

      <div className="rte-group">
        <Btn label="Deshacer" onClick={() => editor.chain().focus().undo().run()}>↶</Btn>
        <Btn label="Rehacer" onClick={() => editor.chain().focus().redo().run()}>↷</Btn>
      </div>

      <select
        className="rte-select"
        aria-label="Estilo de bloque"
        value={
          editor.isActive("heading", { level: 2 }) ? "h2" :
          editor.isActive("heading", { level: 3 }) ? "h3" :
          editor.isActive("heading", { level: 4 }) ? "h4" :
          editor.isActive("blockquote") ? "quote" : "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          const chain = editor.chain().focus();
          if (v === "p") chain.setParagraph().run();
          else if (v === "h2") chain.toggleHeading({ level: 2 }).run();
          else if (v === "h3") chain.toggleHeading({ level: 3 }).run();
          else if (v === "h4") chain.toggleHeading({ level: 4 }).run();
          else if (v === "quote") chain.toggleBlockquote().run();
        }}
      >
        <option value="p">Párrafo</option>
        <option value="h2">Título (H2)</option>
        <option value="h3">Subtítulo (H3)</option>
        <option value="h4">Subtítulo menor (H4)</option>
        <option value="quote">Cita</option>
      </select>

      <select
        className="rte-select"
        aria-label="Fuente"
        value={(editor.getAttributes("textStyle").fontFamily as string) ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
      >
        {FONTS.map((f) => (
          <option key={f.label} value={f.value}>{f.label}</option>
        ))}
      </select>

      <div className="rte-group">
        <Btn label="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>N</strong></Btn>
        <Btn label="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>K</em></Btn>
        <Btn label="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>S</u></Btn>
        <Btn label="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><s>T</s></Btn>
        <Btn label="Código" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>{"</>"}</Btn>
      </div>

      <label className="rte-color" title="Color de texto">
        <span aria-hidden="true">A</span>
        <input
          type="color"
          value={(editor.getAttributes("textStyle").color as string) || "#0f172a"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          aria-label="Color de texto"
        />
      </label>

      <div className="rte-group">
        <Btn label="Alinear izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⯇</Btn>
        <Btn label="Centrar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>≡</Btn>
        <Btn label="Alinear derecha" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>⯈</Btn>
      </div>

      <div className="rte-group">
        <Btn label="Lista con viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>•≡</Btn>
        <Btn label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.≡</Btn>
      </div>

      <div className="rte-group">
        <Btn label="Enlace" active={editor.isActive("link")} onClick={setLink}>🔗</Btn>
        <Btn label={uploading ? "Subiendo…" : "Insertar imagen"} onClick={pickImage}>🖼</Btn>
        <Btn label="Tabla" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</Btn>
        <Btn label="Línea divisoria" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</Btn>
      </div>
    </div>
  );
}

export default function RichTextEditor({
  initialContent,
  onReady,
}: {
  initialContent: string;
  onReady?: (getHtml: () => string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      Color,
      Placeholder.configure({ placeholder: "Escribe el contenido del post…" }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: { class: "rte-content prose-pa" },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        (async () => {
          setUploading(true);
          try {
            for (const file of files) {
              const url = await uploadImage(file);
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url, alt: file.name });
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              const tr = view.state.tr.insert(coords?.pos ?? view.state.doc.content.size, node);
              view.dispatch(tr);
            }
          } catch (err) {
            alert(`No se pudo subir la imagen: ${(err as Error).message}`);
          } finally {
            setUploading(false);
          }
        })();
        return true;
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        (async () => {
          setUploading(true);
          try {
            for (const file of files) {
              const url = await uploadImage(file);
              editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
            }
          } catch (err) {
            alert(`No se pudo subir la imagen: ${(err as Error).message}`);
          } finally {
            setUploading(false);
          }
        })();
        return true;
      },
    },
  });

  const getHtml = useCallback(() => editor?.getHTML() ?? "", [editor]);

  // Astro islands (client:load) can't receive function props from the
  // server-rendered page — props are JSON-serialized across that boundary.
  // Exposing getHtml on window is how the plain <script> submit handler on
  // the surrounding page reads the editor's current content.
  useEffect(() => {
    if (!editor) return;
    (window as unknown as { __rteGetHtml?: () => string }).__rteGetHtml = getHtml;
    onReady?.(getHtml);
    return () => {
      delete (window as unknown as { __rteGetHtml?: () => string }).__rteGetHtml;
    };
  }, [editor, getHtml, onReady]);

  if (!editor) {
    return <div className="rte-loading">Cargando editor…</div>;
  }

  const words = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="rte-wrap">
      <Toolbar editor={editor} uploading={uploading} />
      <div className={`rte-canvas${uploading ? " is-uploading" : ""}`}>
        <EditorContent editor={editor} />
      </div>
      <div className="rte-footer">{words} palabras{uploading && " · subiendo imagen…"}</div>
    </div>
  );
}
