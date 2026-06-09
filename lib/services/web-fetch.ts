/**
 * Web Fetch Service
 * -----------------
 * Makes a plain HTTP GET to a target URL and extracts readable text content.
 * Uses a lightweight regex-based approach (no heavy browser/DOM dependency).
 */

const USER_AGENT = "Operon/1.0 (+https://github.com/akashmahlaz/Operon)";
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB cap on downloaded HTML
const FETCH_TIMEOUT_MS = 15_000;

/** Minimal HTML → readable-text extractor. */
function htmlToReadableText(html: string): { title: string; text: string } {
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";

  // Extract meta description
  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i,
  );
  const metaDesc = metaDescMatch ? decodeEntities(metaDescMatch[1]).trim() : "";

  // Remove non-content elements
  let body = html;
  // Isolate <body> if present
  const bodyMatch = body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) body = bodyMatch[1];

  // Strip script, style, noscript, svg, nav, footer, header tags and their content
  body = body.replace(/<(script|style|noscript|svg|nav|footer|header|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Strip all remaining HTML tags
  body = body.replace(/<[^>]+>/g, " ");
  // Decode HTML entities
  body = decodeEntities(body);
  // Collapse whitespace
  body = body.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  const text = metaDesc ? `${metaDesc}\n\n${body}` : body;
  return { title, text };
}

/** Decode common HTML entities. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

export interface WebFetchResult {
  ok: boolean;
  url: string;
  status?: number;
  title?: string;
  text?: string;
  error?: string;
  bytesFetched?: number;
}

export async function fetchWebPage(url: string): Promise<WebFetchResult> {
  // Normalize URL
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Block non-HTTP(S) and private/internal URLs
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, url, error: "Only http and https URLs are supported." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html, application/xhtml+xml, text/plain;q=0.9, */*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ok: false,
        url,
        status: response.status,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";

    // Read body (capped)
    const reader = response.body?.getReader();
    if (!reader) {
      return { ok: false, url, status: response.status, error: "Empty response body." };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      chunks.push(value);
      if (totalBytes > MAX_BODY_BYTES) break;
    }
    reader.cancel().catch(() => {});

    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawBody = decoder.decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.length + c.length);
        merged.set(acc);
        merged.set(c, acc.length);
        return merged;
      }, new Uint8Array()),
    );

    // If it's plain text, return as-is
    if (contentType.includes("text/plain") || contentType.includes("application/json")) {
      return {
        ok: true,
        url: response.url,
        status: response.status,
        title: "",
        text: rawBody.slice(0, 50_000),
        bytesFetched: totalBytes,
      };
    }

    // HTML → readable text
    const { title, text } = htmlToReadableText(rawBody);

    return {
      ok: true,
      url: response.url,
      status: response.status,
      title,
      text: text.slice(0, 50_000), // cap output to ~50k chars for the LLM
      bytesFetched: totalBytes,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
          : err.message
        : String(err);
    return { ok: false, url, error: message };
  }
}
