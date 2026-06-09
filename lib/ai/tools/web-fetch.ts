import { tool } from "ai";
import { z } from "zod";
import { appendLog } from "@/lib/services/logs";
import { fetchWebPage } from "@/lib/services/web-fetch";

export function createWebFetchTools(userId: string) {
  return {
    web_fetch: tool({
      description:
        "Fetch a web page by URL (plain HTTP GET) and return its readable text content. " +
        "Use this to read articles, landing pages, documentation, or any public web page. " +
        "Supports HTML (auto-extracts readable text) and plain text / JSON responses.",
      inputSchema: z.object({
        url: z
          .string()
          .min(1)
          .describe(
            "The URL to fetch, e.g. 'https://example.com' or 'example.com' (https is assumed if no protocol).",
          ),
      }),
      execute: async ({ url }) => {
        await appendLog({
          userId,
          level: "info",
          source: "ai-tool",
          message: `Web fetch: ${url}`,
          metadata: { tool: "web_fetch", url },
        });

        const result = await fetchWebPage(url);

        if (!result.ok) {
          return { error: result.error, url: result.url, status: result.status };
        }

        const { capToolResult } = await import("@/lib/ai/tools/truncate");
        return capToolResult({
          url: result.url,
          title: result.title,
          text: result.text,
          bytesFetched: result.bytesFetched,
        }).result;
      },
    }),
  };
}
