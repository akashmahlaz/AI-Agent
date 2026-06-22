import { File as FileIcon, FileText, Image as ImageIcon } from "lucide-react";
import type { MessageAttachment } from "@/hooks/use-stream-events/types";

// Re-export so existing imports keep working.
export type ParsedAttachment = MessageAttachment;

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

function pickIcon(mime: string) {
  if (isImageMime(mime)) return ImageIcon;
  if (isPdfMime(mime)) return FileText;
  return FileIcon;
}

/**
 * ChatGPT-style attachment chip rendered inside the user bubble.
 *
 *   [📄 resume.pdf        ]
 *   [🖼  screenshot.png    ]
 *
 * For images we render an inline thumbnail (matches ChatGPT UX exactly).
 * For PDFs/documents we render a labelled card that links out to the file
 * in S3 — the same URL the provider adapter receives as a native content
 * block, so the model can read it and the user can also click to open.
 */
export function FilePart({ attachment }: { attachment: ParsedAttachment }) {
  const mime = attachment.mimeType || "";
  // Deep log: track every file render so users can verify which attachment
  // the model is "seeing" on each turn.
  console.log("[frontend] render_file_part", {
    name: attachment.name,
    mimeType: mime,
    url: attachment.url,
    isImage: isImageMime(mime),
    isPdf: isPdfMime(mime),
  });
  if (isImageMime(mime)) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/attach relative block overflow-hidden rounded-xl border border-border/40 bg-muted/30 transition-colors hover:border-border/70"
        title={attachment.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-64 max-w-72 object-contain"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/65 to-transparent px-2.5 py-1.5 text-[11px] font-medium text-white">
          {attachment.name}
        </div>
      </a>
    );
  }

  const Icon = pickIcon(mime);
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-72 items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-2.5 py-2 text-xs text-foreground transition-colors hover:border-border/70 hover:bg-background/80"
      title={attachment.name}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground/80" />
      <span className="min-w-0 truncate font-medium">{attachment.name}</span>
      {mime && (
        <span className="ml-1 shrink-0 rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {shortMime(mime)}
        </span>
      )}
    </a>
  );
}

function shortMime(mime: string): string {
  // Trim to a readable label: "application/pdf" → "PDF", "text/plain" → "TXT"
  const known: Record<string, string> = {
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "text/markdown": "MD",
    "text/csv": "CSV",
    "application/json": "JSON",
    "application/zip": "ZIP",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  };
  if (known[mime]) return known[mime];
  const slash = mime.indexOf("/");
  return slash < 0 ? mime.toUpperCase() : mime.slice(slash + 1).toUpperCase();
}

export function FilePartList({
  attachments,
}: {
  attachments: ParsedAttachment[];
}) {
  if (!attachments.length) return null;

  return (
    <div className="mb-2 flex max-w-full flex-wrap justify-end gap-2">
      {attachments.map((attachment, index) => (
        <FilePart key={`${attachment.url}-${index}`} attachment={attachment} />
      ))}
    </div>
  );
}