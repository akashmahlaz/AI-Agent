import type { StreamPart, ToolCallEvent } from "@/hooks/use-stream-events/types";

function partId(messageId: string, index: number) {
  return `${messageId}-part-${index}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Hydrates persisted Rust `messages.parts` JSON into frontend stream parts.
 *
 * This is intentionally frontend-only: it does not call a database or API.
 * Rust persists the full parts array; Next.js only renders it.
 */
export function hydrateMessageParts(
  messageId: string,
  rawParts: unknown,
  fallbackContent: string,
): StreamPart[] {
  const parts = Array.isArray(rawParts) ? rawParts : [];
  const hydrated: StreamPart[] = [];

  parts.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    const type = typeof raw.type === "string" ? raw.type : "";
    const id = typeof raw.id === "string" ? raw.id : partId(messageId, index);

    switch (type) {
      case "text-delta":
      case "text-end":
        hydrated.push({
          id,
          type,
          text: typeof raw.text === "string" ? raw.text : "",
        });
        break;

      case "reasoning-start":
      case "reasoning-delta":
      case "reasoning-end":
        hydrated.push({
          id,
          type,
          text: typeof raw.text === "string" ? raw.text : "",
        });
        break;

      case "tool-call-start":
      case "tool-call-input-streaming":
      case "tool-call-input-available":
      case "tool-call-execute":
      case "tool-call-output-available":
      case "tool-call-output-error": {
        const state =
          raw.state === "calling" ||
          raw.state === "input-streaming" ||
          raw.state === "input-available" ||
          raw.state === "executing" ||
          raw.state === "output-available" ||
          raw.state === "output-error"
            ? raw.state
            : type === "tool-call-output-error"
              ? "output-error"
              : type === "tool-call-output-available"
                ? "output-available"
                : type === "tool-call-execute"
                  ? "executing"
                  : type === "tool-call-input-available"
                    ? "input-available"
                    : type === "tool-call-input-streaming"
                      ? "input-streaming"
                      : "calling";
        hydrated.push({
          id,
          type,
          state,
          toolCallId: String(raw.toolCallId ?? raw.tool_call_id ?? id),
          toolName: String(raw.toolName ?? raw.tool_name ?? raw.name ?? "tool"),
          args: isRecord(raw.args) ? raw.args : undefined,
          result: raw.result,
          errorText: typeof raw.errorText === "string" ? raw.errorText : undefined,
          invocationMessage:
            typeof raw.invocationMessage === "string" ? raw.invocationMessage : undefined,
          pastTenseMessage:
            typeof raw.pastTenseMessage === "string" ? raw.pastTenseMessage : undefined,
          originMessage:
            typeof raw.originMessage === "string" ? raw.originMessage : undefined,
        } satisfies ToolCallEvent);
        break;
      }

      case "source-url":
        hydrated.push({
          id,
          type,
          url: typeof raw.url === "string" ? raw.url : "",
          title: typeof raw.title === "string" ? raw.title : undefined,
        });
        break;

      case "progress":
        hydrated.push({
          id,
          type,
          text: typeof raw.text === "string" ? raw.text : "",
          status:
            raw.status === "active" || raw.status === "complete" || raw.status === "error"
              ? raw.status
              : undefined,
        });
        break;

      case "warning":
        hydrated.push({
          id,
          type,
          text: typeof raw.text === "string" ? raw.text : "",
        });
        break;

      case "usage":
        hydrated.push({
          id,
          type,
          promptTokens: Number(raw.promptTokens ?? 0),
          completionTokens: Number(raw.completionTokens ?? 0),
          totalTokens: Number(raw.totalTokens ?? 0),
        });
        break;

      case "provider-request-id":
        hydrated.push({
          id,
          type,
          provider: String(raw.provider ?? ""),
          model: String(raw.model ?? ""),
          requestId: String(raw.requestId ?? ""),
        });
        break;

      case "stream-error":
        hydrated.push({
          id,
          type,
          message: String(raw.message ?? "Stream error"),
          requestId: typeof raw.requestId === "string" ? raw.requestId : null,
          provider: typeof raw.provider === "string" ? raw.provider : null,
        });
        break;

      default:
        break;
    }
  });

  if (hydrated.length === 0 && fallbackContent.trim()) {
    hydrated.push({ id: partId(messageId, 0), type: "text-delta", text: fallbackContent });
    hydrated.push({ id: partId(messageId, 1), type: "text-end", text: "" });
  }

  return hydrated;
}
