import sql from "@/lib/pg";

export type CommunicationStyle =
  | "friendly"
  | "professional"
  | "balanced"
  | "direct"
  | "playful"
  | "desi";

export type LanguagePreference = "en" | "hi" | "hinglish" | "auto";

export type MemoryDepth = "7d" | "30d" | "90d" | "forever";

export interface PersonaSettings {
  // Identity
  aiName: string;
  userNickname?: string;
  model?: string;
  systemPromptTail?: string;

  // Model parameters
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;

  // Communication
  communicationStyle: CommunicationStyle;
  languagePreference: LanguagePreference;

  // Memory
  memoryEnabled: boolean;
  memoryDepth: MemoryDepth;
  proactiveEnabled: boolean;
  morningBriefing: boolean;
  briefingTime: string;
  expressiveReplies: boolean;
  voiceNotes: boolean;
  timezone?: string;

  // Channel overrides
  channelOverrides?: Partial<Record<string, Partial<PersonaSettings>>>;
}

export const DEFAULT_PERSONA: PersonaSettings = {
  aiName: "Operon",
  userNickname: "",
  communicationStyle: "balanced",
  languagePreference: "en",
  memoryEnabled: true,
  memoryDepth: "30d",
  proactiveEnabled: true,
  morningBriefing: false,
  briefingTime: "09:00",
  expressiveReplies: false,
  voiceNotes: false,
  model: undefined,
  temperature: undefined,
  topP: undefined,
  maxTokens: undefined,
  frequencyPenalty: undefined,
  presencePenalty: undefined,
  systemPromptTail: undefined,
};

export interface StoredUserSettings {
  id: string;
  userId: string;
  defaultModel?: string;
  persona?: Partial<PersonaSettings>;
  createdAt: string;
  updatedAt: string;
}

interface UserSettingsRow {
  id: string;
  userId: string;
  defaultModel: string | null;
  payload: {
    persona?: Partial<PersonaSettings>;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: UserSettingsRow): StoredUserSettings {
  return {
    id: row.id,
    userId: row.userId,
    defaultModel: row.defaultModel ?? undefined,
    persona: row.payload?.persona,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getUserSettings(userId: string): Promise<StoredUserSettings | null> {
  const [row] = await sql<UserSettingsRow[]>`
    select id, user_id, default_model, payload, created_at, updated_at
    from user_settings
    where user_id = ${userId}
    limit 1
  `;
  return row ? fromRow(row) : null;
}

export async function setDefaultModel(userId: string, defaultModel: string) {
  const [row] = await sql<UserSettingsRow[]>`
    insert into user_settings (id, user_id, default_model, payload)
    values (${crypto.randomUUID()}, ${userId}, ${defaultModel}, ${sql.json({})})
    on conflict (user_id) do update set
      default_model = excluded.default_model,
      updated_at    = now()
    returning id, user_id, default_model, payload, created_at, updated_at
  `;
  return fromRow(row);
}

function sanitizeStyle(value: unknown): CommunicationStyle {
  const allowed: CommunicationStyle[] = [
    "friendly",
    "professional",
    "balanced",
    "direct",
    "playful",
    "desi",
  ];
  return allowed.includes(value as CommunicationStyle)
    ? (value as CommunicationStyle)
    : DEFAULT_PERSONA.communicationStyle;
}

function sanitizeLanguage(value: unknown): LanguagePreference {
  const allowed: LanguagePreference[] = ["en", "hi", "hinglish", "auto"];
  return allowed.includes(value as LanguagePreference)
    ? (value as LanguagePreference)
    : DEFAULT_PERSONA.languagePreference;
}

function sanitizeMemoryDepth(value: unknown): MemoryDepth {
  const allowed: MemoryDepth[] = ["7d", "30d", "90d", "forever"];
  return allowed.includes(value as MemoryDepth)
    ? (value as MemoryDepth)
    : DEFAULT_PERSONA.memoryDepth;
}

function sanitizeBriefingTime(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_PERSONA.briefingTime;
  return /^\d{2}:\d{2}$/.test(value) ? value : DEFAULT_PERSONA.briefingTime;
}

function sanitizeName(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function normalizePersona(input: Partial<PersonaSettings> | null | undefined): PersonaSettings {
  const source = input ?? {};
  return {
    aiName: sanitizeName(source.aiName, DEFAULT_PERSONA.aiName, 32),
    userNickname:
      typeof source.userNickname === "string" ? source.userNickname.trim().slice(0, 48) : "",
    communicationStyle: sanitizeStyle(source.communicationStyle),
    languagePreference: sanitizeLanguage(source.languagePreference),
    memoryEnabled: source.memoryEnabled !== false,
    memoryDepth: sanitizeMemoryDepth(source.memoryDepth),
    proactiveEnabled: source.proactiveEnabled !== false,
    morningBriefing: source.morningBriefing === true,
    briefingTime: sanitizeBriefingTime(source.briefingTime),
    expressiveReplies: source.expressiveReplies === true,
    voiceNotes: source.voiceNotes === true,
    timezone: typeof source.timezone === "string" ? source.timezone.slice(0, 64) : undefined,
    model: typeof source.model === "string" && source.model.length > 0 ? source.model : undefined,
    temperature: typeof source.temperature === "number" ? source.temperature : undefined,
    topP: typeof source.topP === "number" ? source.topP : undefined,
    maxTokens:
      typeof source.maxTokens === "number" && source.maxTokens > 0 ? source.maxTokens : undefined,
    frequencyPenalty:
      typeof source.frequencyPenalty === "number" ? source.frequencyPenalty : undefined,
    presencePenalty:
      typeof source.presencePenalty === "number" ? source.presencePenalty : undefined,
    systemPromptTail:
      typeof source.systemPromptTail === "string" ? source.systemPromptTail : undefined,
  };
}

export async function getPersona(userId: string): Promise<PersonaSettings> {
  const settings = await getUserSettings(userId);
  return normalizePersona(settings?.persona);
}

export async function getPersonaForChannel(
  userId: string,
  channel?: string | null,
): Promise<PersonaSettings> {
  const base = await getPersona(userId);
  if (!channel) return base;
  const override = base.channelOverrides?.[channel];
  if (!override) return base;
  return normalizePersona({ ...base, ...override });
}

export async function setPersona(userId: string, persona: Partial<PersonaSettings>) {
  const merged = normalizePersona({ ...(await getPersona(userId)), ...persona });
  const payload = { persona: merged };
  await sql`
    insert into user_settings (id, user_id, payload)
    values (${crypto.randomUUID()}, ${userId}, ${sql.json(payload as never)})
    on conflict (user_id) do update set
      payload    = user_settings.payload || excluded.payload,
      updated_at = now()
  `;
  return merged;
}

const STYLE_GUIDE: Record<CommunicationStyle, string> = {
  friendly: "Warm, encouraging tone. Greet the user briefly and stay concise.",
  professional: "Polished, business-appropriate tone. No filler, no slang.",
  balanced: "Clear and helpful tone. Friendly but efficient.",
  direct: "Terse, action-first replies. Skip pleasantries.",
  playful: "Light, playful tone. Stay competent; never childish.",
  desi: "Hinglish, casual Desi vibe. Mix Hindi/English naturally; remain respectful.",
};

const LANGUAGE_GUIDE: Record<LanguagePreference, string> = {
  en: "Respond in English unless the user writes in another language.",
  hi: "Respond in Hindi unless the user writes in another language.",
  hinglish: "Respond in natural Hinglish (Hindi/English mix).",
  auto: "Detect the user's language each turn and reply in the same language.",
};

export function buildPersonaSystemPrompt(persona: PersonaSettings): string {
  const lines: string[] = [];
  lines.push(`You are ${persona.aiName}, the user's personal AI assistant.`);
  if (persona.userNickname) {
    lines.push(`Address the user as "${persona.userNickname}" when natural.`);
  }
  lines.push(STYLE_GUIDE[persona.communicationStyle]);
  lines.push(LANGUAGE_GUIDE[persona.languagePreference]);
  if (persona.expressiveReplies) {
    lines.push("Light expressive flourishes are welcome, but never sacrifice clarity.");
  } else {
    lines.push("Avoid emojis, exclamation spam, and decorative formatting.");
  }
  if (!persona.memoryEnabled) {
    lines.push(
      "Long-term memory is disabled by the user; do not call memory_remember and ignore stored memory context.",
    );
  }
  if (persona.timezone) {
    lines.push(`User timezone: ${persona.timezone}.`);
  }
  if (persona.systemPromptTail) {
    lines.push("\n" + persona.systemPromptTail);
  }
  return lines.join(" ");
}
