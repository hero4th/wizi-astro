import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { DOMSerializer } from "@tiptap/pm/model";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontFamily, FontSize, Color, BackgroundColor } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { SlashCommand } from "./slash-command";
import { Callout, SizedImage } from "./extensions";
import EditorToolbar, { TableToolbar, ImageToolbar, type Snippet } from "./EditorToolbar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------

export interface PostInitial {
  id?: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  categorySlug: string;
  pubDate: string; // yyyy-mm-dd
  author: string;
  image: string;
  imageAlt: string;
  draft: boolean;
  html: string;
  /** Hidden metadata — never rendered in the article, only in <head>. */
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  ogImage: string;
  keywords: string;
}

async function uploadFile(file: File): Promise<string> {
  // Raw binary body, not FormData — Astro's built-in CSRF guard blocks
  // form-urlencoded/multipart/text-plain content types, which a FormData
  // POST would be classified as.
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": file.type, "X-Filename": encodeURIComponent(file.name) },
    body: file,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.url as string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// ---------------------------------------------------------------------------

export default function PostEditor({ isNew, initial }: { isNew: boolean; initial: PostInitial }) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug);
  const [pubDate, setPubDate] = useState(initial.pubDate);
  const [author, setAuthor] = useState(initial.author);
  const [image, setImage] = useState(initial.image);
  const [imageAlt, setImageAlt] = useState(initial.imageAlt);
  const [draft, setDraft] = useState(initial.draft);

  // Hidden metadata
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl);
  const [noindex, setNoindex] = useState(initial.noindex);
  const [ogImage, setOgImage] = useState(initial.ogImage);
  const [keywords, setKeywords] = useState(initial.keywords);

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"post" | "seo">("post");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => autoGrow(titleRef.current), [title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      SizedImage.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      BackgroundColor,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ nocookie: true, modestBranding: true, width: 640, height: 360 }),
      Callout,
      Placeholder.configure({ placeholder: "Escribe '/' para insertar un bloque, o simplemente empieza a escribir…" }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      SlashCommand,
    ],
    content: initial.html || "<p></p>",
    editorProps: {
      attributes: { class: "prose-pa editor-canvas-content" },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        (async () => {
          for (const file of files) {
            try {
              const url = await uploadFile(file);
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url, alt: file.name });
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              view.dispatch(view.state.tr.insert(coords?.pos ?? view.state.doc.content.size, node));
            } catch (err) {
              setError(`No se pudo subir la imagen: ${(err as Error).message}`);
            }
          }
        })();
        return true;
      },
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        (async () => {
          for (const file of files) {
            try {
              const url = await uploadFile(file);
              editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
            } catch (err) {
              setError(`No se pudo subir la imagen: ${(err as Error).message}`);
            }
          }
        })();
        return true;
      },
    },
  });

  const words = editor?.storage.characterCount?.words() ?? 0;
  const readingTime = Math.max(1, Math.round(words / 200));

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const insertImageViaToolbar = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadFile(file);
        editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (err) {
        setError(`No se pudo subir la imagen: ${(err as Error).message}`);
      }
    };
    input.click();
  };

  const onCoverFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setImage(url);
      if (!imageAlt) setImageAlt(title);
    } catch (err) {
      setError(`No se pudo subir la imagen: ${(err as Error).message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  // --- Reusable blocks (snippets) -----------------------------------------
  useEffect(() => {
    fetch("/api/admin/snippets")
      .then((r) => (r.ok ? r.json() : { snippets: [] }))
      .then((d) => setSnippets(d.snippets ?? []))
      .catch(() => setSnippets([]));
  }, []);

  const saveSnippet = async () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      setError("Selecciona primero el contenido que quieres guardar como bloque.");
      return;
    }
    const name = window.prompt("Nombre del bloque (para reutilizarlo después)");
    if (!name) return;

    // Serialize just the selected slice, not the whole document.
    const slice = editor.state.doc.slice(from, to);
    const fragment = DOMSerializer.fromSchema(editor.schema).serializeFragment(slice.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const res = await fetch("/api/admin/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, html: container.innerHTML }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el bloque.");
      return;
    }
    setSnippets((prev) => [data.snippet, ...prev]);
  };

  const deleteSnippet = async (id: number) => {
    if (!window.confirm("¿Eliminar este bloque guardado?")) return;
    const res = await fetch("/api/admin/snippets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const insertSnippet = (s: Snippet) => {
    editor?.chain().focus().insertContent(s.html).run();
  };

  const setSelectionLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const save = useCallback(
    async (publishOverride?: boolean) => {
      if (!editor) return;
      setError(null);

      const body = editor.getHTML();
      if (!title.trim()) return setError("Escribe un título antes de guardar.");
      if (!body || body === "<p></p>") return setError("Escribe algo de contenido antes de guardar.");

      setSaving(true);
      const payload = {
        title,
        slug,
        description,
        category,
        categorySlug,
        categories: [{ name: category, slug: categorySlug }],
        pubDate,
        updatedDate: isNew ? undefined : new Date().toISOString().slice(0, 10),
        author,
        image: image || null,
        imageAlt,
        draft: publishOverride ?? draft,
        body,
        seoTitle,
        seoDescription,
        canonicalUrl,
        noindex,
        ogImage,
        keywords,
      };

      try {
        const res = await fetch(isNew ? "/api/admin/posts" : `/api/admin/posts/${initial.id}`, {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setError(await res.text());
          setSaving(false);
          return;
        }
        const data = await res.json();
        if (isNew) {
          window.location.href = `/admin/posts/edit/${data.id}`;
          return;
        }
        setDraft(publishOverride ?? draft);
        setSavedAt(new Date());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [editor, title, slug, description, category, categorySlug, pubDate, author, image, imageAlt, draft,
     seoTitle, seoDescription, canonicalUrl, noindex, ogImage, keywords, isNew, initial.id]
  );

  const deletePost = async () => {
    if (!initial.id) return;
    if (!window.confirm("¿Eliminar este post? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/admin/posts/${initial.id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/admin";
    else setError(await res.text());
  };

  // Keyboard shortcut: Cmd/Ctrl+S to save.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  const previewData = useMemo(
    () => ({ title, description, category, categorySlug, author, pubDate, image, imageAlt, readingTime }),
    [title, description, category, categorySlug, author, pubDate, image, imageAlt, readingTime]
  );

  if (!editor) return <div className="editor-loading">Cargando editor…</div>;

  return (
    <div className="editor-shell">
      {/* ---- Top bar ---------------------------------------------------- */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <a href="/admin" className="editor-back" aria-label="Volver a posts">←</a>
          <span className={`status-pill ${draft ? "is-draft" : "is-published"}`}>
            {draft ? "Borrador" : "Publicado"}
          </span>
          <span className="editor-meta-text">{words} palabras · {readingTime} min de lectura</span>
          {savedAt && <span className="editor-meta-text editor-saved">Guardado {savedAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <div className="editor-topbar-right">
          <div className="mode-toggle" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "edit"} className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}>
              Editar
            </button>
            <button type="button" role="tab" aria-selected={mode === "preview"} className={mode === "preview" ? "is-active" : ""} onClick={() => setMode("preview")}>
              Vista previa
            </button>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setSettingsOpen(true)}>
            ⚙ Detalles
          </button>
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={deletePost}>
              Eliminar
            </button>
          )}
          {draft ? (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save(false)}>
              {saving ? "Publicando…" : "Publicar"}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save()}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="editor-error-banner">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Cerrar">×</button>
        </div>
      )}

      {/* ---- Main area ---------------------------------------------------- */}
      {mode === "edit" ? (
        <>
          <div className="editor-toolbars">
            <EditorToolbar
              editor={editor}
              snippets={snippets}
              onInsertSnippet={insertSnippet}
              onSaveSnippet={saveSnippet}
              onDeleteSnippet={deleteSnippet}
              onInsertImage={insertImageViaToolbar}
            />
            <TableToolbar editor={editor} />
            <ImageToolbar editor={editor} />
          </div>

          <div className="editor-page">
          <div className="editor-canvas">
            {/* Cover image */}
            <div className={`cover-drop${image ? " has-image" : ""}${uploadingCover ? " is-uploading" : ""}`} onClick={() => coverInputRef.current?.click()}>
              {image ? (
                <img src={image} alt={imageAlt} />
              ) : (
                <div className="cover-drop-empty">
                  <span>🖼</span>
                  <span>{uploadingCover ? "Subiendo…" : "Agregar imagen destacada"}</span>
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={onCoverFileChosen} />
            </div>

            {/* Title */}
            <textarea
              ref={titleRef}
              className="title-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título del post"
              rows={1}
            />

            {/* Editor content */}
            <div className="editor-content-wrap">
              {editor && (
                <BubbleMenu editor={editor} className="bubble-menu">
                  <button type="button" className={editor.isActive("bold") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrita"><strong>N</strong></button>
                  <button type="button" className={editor.isActive("italic") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Cursiva"><em>K</em></button>
                  <button type="button" className={editor.isActive("underline") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Subrayado"><u>S</u></button>
                  <button type="button" className={editor.isActive("strike") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Tachado"><s>T</s></button>
                  <button type="button" className={editor.isActive("code") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleCode().run()} aria-label="Código">{"</>"}</button>
                  <span className="bubble-sep" />
                  <button type="button" className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Título H2">H2</button>
                  <button type="button" className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Título H3">H3</button>
                  <button type="button" className={editor.isActive("highlight") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} aria-label="Resaltar">▮</button>
                  <span className="bubble-sep" />
                  {/* Fonts, sizes and colours live in the always-visible toolbar;
                      the bubble menu stays to the essentials for a selection. */}
                  <button type="button" className={editor.isActive("link") ? "is-active" : ""} onClick={setSelectionLink} aria-label="Enlace">🔗</button>
                </BubbleMenu>
              )}

              <DragHandle editor={editor}>
                <div className="drag-handle" title="Arrastra para reordenar">⠿</div>
              </DragHandle>

              <EditorContent editor={editor} />
            </div>
          </div>
          </div>
        </>
      ) : (
        <PreviewPane data={previewData} html={editor.getHTML()} />
      )}

      {/* ---- Settings drawer ---------------------------------------------------- */}
      {settingsOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setSettingsOpen(false)} />
          <aside className="drawer">
            <div className="drawer-header">
              <h2>Detalles del post</h2>
              <button type="button" className="btn-ghost" onClick={() => setSettingsOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <div className="drawer-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={settingsTab === "post"}
                className={settingsTab === "post" ? "is-active" : ""} onClick={() => setSettingsTab("post")}>
                Publicación
              </button>
              <button type="button" role="tab" aria-selected={settingsTab === "seo"}
                className={settingsTab === "seo" ? "is-active" : ""} onClick={() => setSettingsTab("seo")}>
                SEO y metadatos
              </button>
            </div>

            <div className="drawer-body" hidden={settingsTab !== "post"}>
              <div className="field">
                <label htmlFor="pe-slug">Slug (URL)</label>
                <input id="pe-slug" type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
                <p className="hint">/blog/{slug || "…"}</p>
              </div>
              <div className="field">
                <label htmlFor="pe-desc">Descripción (SEO, ~155 caracteres)</label>
                <textarea id="pe-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="pe-cat">Categoría</label>
                  <input id="pe-cat" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pe-catslug">Slug de categoría</label>
                  <input id="pe-catslug" type="text" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="pe-date">Fecha de publicación</label>
                  <input id="pe-date" type="date" value={pubDate} onChange={(e) => setPubDate(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pe-author">Autor</label>
                  <input id="pe-author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="pe-imgalt">Texto alternativo de la imagen</label>
                <input id="pe-imgalt" type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
              </div>
              <div className="checkbox-row">
                <input id="pe-draft" type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
                <label htmlFor="pe-draft">Borrador (no se publica hasta desmarcarlo)</label>
              </div>
            </div>

            {/* Hidden metadata: none of this appears in the article, only in <head>. */}
            <div className="drawer-body" hidden={settingsTab !== "seo"}>
              <p className="hint drawer-note">
                Nada de esto se ve en el artículo: solo va en el &lt;head&gt; de la página,
                para buscadores y redes sociales.
              </p>

              <div className="field">
                <label htmlFor="pe-seotitle">Título SEO</label>
                <input id="pe-seotitle" type="text" value={seoTitle} maxLength={200}
                  placeholder={`${title || "Título del post"} | Professional Academy`}
                  onChange={(e) => setSeoTitle(e.target.value)} />
                <p className={cn("hint", seoTitle.length > 60 && "hint-warn")}>
                  {seoTitle.length || 0}/60 recomendados · si lo dejas vacío se usa el título normal
                </p>
              </div>

              <div className="field">
                <label htmlFor="pe-seodesc">Meta descripción</label>
                <textarea id="pe-seodesc" rows={3} value={seoDescription} maxLength={400}
                  placeholder={description || "Se usa la descripción normal"}
                  onChange={(e) => setSeoDescription(e.target.value)} />
                <p className={cn("hint", seoDescription.length > 155 && "hint-warn")}>
                  {seoDescription.length || 0}/155 recomendados
                </p>
              </div>

              <div className="field">
                <label htmlFor="pe-keywords">Palabras clave</label>
                <input id="pe-keywords" type="text" value={keywords} maxLength={300}
                  placeholder="toefl, examen, preparación"
                  onChange={(e) => setKeywords(e.target.value)} />
                <p className="hint">Separadas por comas.</p>
              </div>

              <div className="field">
                <label htmlFor="pe-canonical">URL canónica</label>
                <input id="pe-canonical" type="text" value={canonicalUrl}
                  placeholder="Se genera sola — solo si el contenido se publicó antes en otro sitio"
                  onChange={(e) => setCanonicalUrl(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="pe-ogimage">Imagen para redes sociales</label>
                <input id="pe-ogimage" type="text" value={ogImage}
                  placeholder="Si lo dejas vacío se usa la imagen destacada"
                  onChange={(e) => setOgImage(e.target.value)} />
                {ogImage && <img src={ogImage} alt="" className="og-preview" />}
              </div>

              <div className="checkbox-row">
                <input id="pe-noindex" type="checkbox" checked={noindex}
                  onChange={(e) => setNoindex(e.target.checked)} />
                <label htmlFor="pe-noindex">No indexar (ocultar de Google)</label>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Floating "+" button for inserting media/tables without the slash menu */}
      <button type="button" className="fab-insert-image" onClick={insertImageViaToolbar} title="Insertar imagen" aria-label="Insertar imagen">
        +🖼
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PreviewPane({
  data,
  html,
}: {
  data: { title: string; description: string; category: string; categorySlug: string; author: string; pubDate: string; image: string; imageAlt: string; readingTime: number };
  html: string;
}) {
  const formatted = data.pubDate
    ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${data.pubDate}T12:00:00`))
    : "";

  return (
    <div className="preview-shell">
      <div className="preview-chrome">Vista previa — así se verá publicado en /blog</div>
      <article className="preview-article">
        <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
          <nav className="font-mono text-[11px] tracking-[0.18em] text-ink-400 uppercase">
            <span>Blog</span>
            <span aria-hidden="true" className="mx-2 opacity-40">/</span>
            <span className="text-teal-600">{data.category || "Categoría"}</span>
          </nav>
          <header className="mt-6">
            <h1 className="font-display text-[clamp(1.875rem,4vw,3rem)] leading-tight font-semibold tracking-tight text-balance text-ink-950">
              {data.title || "Título del post"}
            </h1>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-[13px] font-medium text-ink-500">
              <span>Por {data.author}</span>
              <span>{formatted}</span>
              <span className="font-semibold text-teal-600">{data.readingTime} min de lectura</span>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-ink-500 text-balance">{data.description || "Descripción del post…"}</p>
          </header>
          {data.image && (
            <div className="mt-10 w-full overflow-hidden rounded-2xl bg-teal-500/8">
              <img src={data.image} alt={data.imageAlt} className="w-full h-[240px] sm:h-[320px] md:h-[400px] object-cover" />
            </div>
          )}
        </div>
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="prose-pa" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </article>
    </div>
  );
}
