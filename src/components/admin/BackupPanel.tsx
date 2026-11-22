import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";

type Phase = "idle" | "exporting" | "reading" | "uploading-images" | "importing" | "done" | "error";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
};

function extFor(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "bin";
}

function mimeFor(name: string): string {
  return MIME_BY_EXT[extFor(name)] ?? "application/octet-stream";
}

export default function BackupPanel({
  canExport = true,
  canImport = true,
}: {
  canExport?: boolean;
  canImport?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ---- Export ----
  const doExport = useCallback(async () => {
    setPhase("exporting");
    setError(null);
    setResult(null);
    setStatus("Generando backup (descargando imágenes)…");
    try {
      const res = await fetch("/api/admin/export");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el backup.");
        setPhase("error");
        return;
      }
      setStatus("Descargando archivo…");
      // The ZIP lives in Blobs; download it via the uploads route.
      const zipRes = await fetch(data.url);
      if (!zipRes.ok) {
        setError("El backup se generó pero no se pudo descargar.");
        setPhase("error");
        return;
      }
      const blob = await zipRes.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `proacademy-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setResult(
        `Backup descargado: ${data.counts.posts} posts, ${data.counts.snippets} snippets, ${data.counts.images} imágenes.` +
          (data.counts.imagesFailed ? ` (${data.counts.imagesFailed} imágenes no se pudieron descargar.)` : "")
      );
      setPhase("done");
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
      setPhase("error");
    }
  }, []);

  // ---- Import ----
  const doImport = useCallback(async (file: File) => {
    setPhase("reading");
    setError(null);
    setResult(null);
    setStatus("Leyendo archivo ZIP…");
    try {
      const zip = await JSZip.loadAsync(file);
      const dataFile = zip.file("data.json");
      if (!dataFile) {
        setError("El archivo no contiene data.json — ¿es un backup de ProAcademy?");
        setPhase("error");
        return;
      }
      const data = JSON.parse(await dataFile.async("string"));
      if (data.version !== 1) {
        setError("Versión de backup no soportada.");
        setPhase("error");
        return;
      }

      const imageMap: Record<string, string> = data.imageMap ?? {};
      const imageEntries = Object.entries(imageMap);
      const urlMapping: Record<string, string> = {}; // oldUrl -> new /uploads/ URL

      // Upload each image to the existing /api/admin/upload endpoint.
      if (imageEntries.length > 0) {
        setPhase("uploading-images");
        setProgress({ current: 0, total: imageEntries.length });
        let done = 0;
        for (const [oldUrl, zipPath] of imageEntries) {
          const entry = zip.file(zipPath);
          if (!entry) { done++; setProgress({ current: done, total: imageEntries.length }); continue; }
          const buffer = await entry.async("arraybuffer");
          const filename = zipPath.split("/").pop() ?? "image.webp";
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": mimeFor(filename), "X-Filename": encodeURIComponent(filename) },
            body: buffer,
          });
          if (res.ok) {
            const { url } = await res.json();
            urlMapping[oldUrl] = url;
          }
          done++;
          setProgress({ current: done, total: imageEntries.length });
          setStatus(`Subiendo imagen ${done} de ${imageEntries.length}…`);
        }
      }

      // Rewrite image URLs in posts before importing.
      setPhase("importing");
      setStatus("Importando posts y snippets…");
      const posts = (data.posts ?? []).map((post: Record<string, unknown>) => {
        const rewritten = { ...post };
        if (rewritten.image && urlMapping[rewritten.image as string]) {
          rewritten.image = urlMapping[rewritten.image as string];
        }
        if (rewritten.html) {
          let html = String(rewritten.html);
          for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
            html = html.split(oldUrl).join(newUrl);
          }
          rewritten.html = html;
          rewritten.body = html;
        }
        return rewritten;
      });

      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1, posts, snippets: data.snippets ?? [] }),
      });
      const resultData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(resultData.error ?? "No se pudo importar el backup.");
        setPhase("error");
        return;
      }
      setResult(
        `Importación completada: ${resultData.posts} posts, ${resultData.snippets} snippets.` +
          (resultData.postsSkipped ? ` (${resultData.postsSkipped} posts omitidos.)` : "") +
          (imageEntries.length ? ` ${Object.keys(urlMapping).length} imágenes subidas a Blobs.` : "")
      );
      setPhase("done");
    } catch {
      setError("No se pudo leer el archivo ZIP. Verifica que sea válido.");
      setPhase("error");
    }
  }, []);

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doImport(file);
    e.target.value = ""; // reset so the same file can be re-chosen
  };

  const busy = phase === "exporting" || phase === "reading" || phase === "uploading-images" || phase === "importing";

  return (
    <div className="space-y-6">
      {/* Export */}
      {canExport && (
      <div className="panel">
        <h2 className="sec-title">Exportar backup</h2>
        <p className="sec-sub">
          Descarga un archivo .zip con todos los posts, snippets e imágenes del blog.
          El backup incluye las imágenes de WordPress descargadas localmente.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <button onClick={doExport} disabled={busy} className="btn btn-primary">
            {phase === "exporting" ? "Generando…" : "Descargar backup (.zip)"}
          </button>
        </div>
      </div>
      )}

      {/* Import */}
      {canImport && (
      <div className="panel">
        <h2 className="sec-title">Importar backup</h2>
        <p className="sec-sub">
          Sube un archivo .zip de backup. Las imágenes se subirán a Netlify Blobs y
          los posts/snippets se insertarán en la base de datos actual.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={onFileChosen}
            disabled={busy}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="btn btn-secondary"
          >
            {busy ? "Procesando…" : "Seleccionar archivo .zip"}
          </button>
        </div>
      </div>
      )}

      {/* Status / progress */}
      {busy && (
        <div className="panel" style={{ background: "var(--color-ink-50)" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500 }}>{status}</p>
          {phase === "uploading-images" && progress.total > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <div
                style={{
                  height: 6, borderRadius: 999, background: "var(--color-ink-100)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%", borderRadius: 999, background: "var(--color-teal-600)",
                    width: `${Math.round((progress.current / progress.total) * 100)}%`,
                    transition: "width 0.2s",
                  }}
                />
              </div>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.72rem", color: "var(--color-ink-400)", fontFamily: "var(--font-mono)" }}>
                {progress.current} / {progress.total}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">{error}</div>
      )}

      {result && (
        <div className="notice-banner" role="status">{result}</div>
      )}
    </div>
  );
}
