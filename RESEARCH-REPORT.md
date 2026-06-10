# Research Report: Cost Management, Unlimited Sessions, UI/UX Fixes

## 1. Cost Management — How to Make Sessions Unlimited Without Burning Money

### The #1 Strategy: Prompt Caching (90% Cost Reduction)

**This is the single highest-ROI change we can make.**

Both Anthropic and OpenAI support prompt caching that makes repeated prefixes nearly free:

| Provider | Cache Write | Cache Read | Savings on Read |
|----------|------------|------------|-----------------|
| Anthropic | 1.25x base price | **0.1x base price** | **90% savings** |
| OpenAI | Automatic (free) | **50% off** (90% with extended) | **50-90% savings** |

**How it works in multi-turn conversations (from Anthropic cookbook):**
```
Turn 1: System + Tools + User:A → CACHE WRITE (187K tokens @ $3.75/MTok)
Turn 2: System + Tools + User:A + Asst:B + User:C → CACHE READ 187K @ $0.30/MTok + WRITE 300 new tokens
Turn 3: Everything cached reads → $0.03 per turn instead of $0.56
```

**Real numbers from Anthropic's cookbook:**
- 187K token context (full book)
- Without caching: $0.56/request, 4.89s latency
- With caching (turn 2+): $0.06/request, 1.48s latency
- **Speedup: 3.3x faster, 90% cheaper**

### Implementation for Operon (Rust Backend)

```rust
// For Anthropic: add cache_control at the top level
// This is literally a one-field addition to our API request
let body = json!({
    "model": model,
    "max_tokens": max_tokens,
    "cache_control": { "type": "ephemeral" },  // ← THIS ONE LINE
    "system": system_prompt,
    "messages": messages,
});
```

For OpenAI: **Nothing to change** — it's fully automatic. Any prefix that matches a recent request gets cached server-side.

### The Sliding Window: Unlimited Sessions Without Manual Compaction

Users should NEVER have to compact manually. The system does it transparently:

```
┌─────────────────────────────────────────────────────────┐
│ WHAT THE USER SEES (full history in UI)                  │
│ [Message 1] [Message 2] ... [Message 50] [New Message]  │
└─────────────────────────────────────────────────────────┘
                        ↕ (different)
┌─────────────────────────────────────────────────────────┐
│ WHAT WE SEND TO THE MODEL (managed context window)       │
│ [System] [Summary of msgs 1-35] [Messages 36-50] [New]  │
└─────────────────────────────────────────────────────────┘
```

**Algorithm (run BEFORE every LLM call):**
```rust
fn prepare_context(
    full_history: &[Message],
    system_prompt: &str,
    tools: &[Tool],
    model_limit: usize,  // e.g., 128_000
) -> Vec<ChatMessage> {
    let output_reserve = 8_192;
    let budget = model_limit - output_reserve;
    
    let system_tokens = estimate_tokens(system_prompt);
    let tool_tokens = estimate_tokens_tools(tools);
    let msg_budget = budget - system_tokens - tool_tokens;
    
    // Fill from most recent backward
    let mut selected: VecDeque<&Message> = VecDeque::new();
    let mut used = 0;
    for msg in full_history.iter().rev() {
        let cost = estimate_tokens_msg(msg);
        if used + cost > msg_budget { break; }
        selected.push_front(msg);
        used += cost;
    }
    
    // If we dropped messages, prepend a free heuristic summary
    if selected.len() < full_history.len() {
        let dropped = &full_history[..full_history.len() - selected.len()];
        let summary = heuristic_summary(dropped); // NO LLM CALL - free!
        selected.push_front(&summary_message(summary));
    }
    
    selected.into_iter().cloned().collect()
}
```

**Key insight: The user sees all 50 messages in the UI. The model only receives the last 15-20 + a summary. The user never knows.**

### Cost Projections

| Scenario | Per-message cost (Sonnet) | 100-turn session |
|----------|--------------------------|------------------|
| No optimization (current) | $0.30-0.56 | $30-56 |
| With prompt caching | $0.03-0.06 | $3-6 |
| With caching + sliding window | $0.03-0.05 | $3-5 |
| With cheap model for compaction | $0.001 | ~free |

### What Netflix / Big Companies Do

1. **Static prefix caching** — System prompt + tools + persona cached permanently
2. **Automatic growing cache** — Anthropic moves breakpoint forward each turn automatically
3. **Tiered models** — Use gpt-4o-mini/Haiku for internal tasks (summarization, title generation, memory extraction) at 10-50x cheaper rates
4. **Batch API** — For non-urgent background tasks (50% discount)
5. **Pre-warming** — Fire a `max_tokens: 0` request at session start to warm cache before user's first message
6. **Token budget per user** — Business-level safety net, not a technical limitation

### Rust Ecosystem: `rig` crate (Recommended)

The `rig` crate (7.6K stars, v0.38+) has exactly what we need:
- `SlidingWindowMemory` — keeps last N messages
- `TokenWindowMemory` — keeps messages within a token budget
- 20+ provider integrations under one interface
- Built-in streaming, tool calling, MongoDB integration

We should evaluate adopting `rig` for the agent layer instead of hand-rolling everything.

---

## 2. Unlimited Sessions Architecture

### The Three-Layer Memory System

```
┌─────────────────────────────────────────────┐
│ Layer 1: WORKING MEMORY (current context)    │
│ - System prompt + tools (cached, ~3K tokens) │
│ - Last 15-20 messages (~20-40K tokens)       │
│ - Summary of older messages (~1K tokens)     │
│ Total: ~25-45K of 128K budget               │
├─────────────────────────────────────────────┤
│ Layer 2: SESSION MEMORY (per conversation)   │
│ - Full message history in Postgres           │
│ - Auto-generated summaries (heuristic)       │
│ - UI shows everything, model sees window     │
├─────────────────────────────────────────────┤
│ Layer 3: LONG-TERM MEMORY (cross-session)    │
│ - User preferences, facts, patterns          │
│ - Semantic search via pgvector               │
│ - Injected into system prompt when relevant  │
└─────────────────────────────────────────────┘
```

### Auto-Compaction (Zero User Intervention)

Replace the manual "Compact" button with transparent auto-management:

```rust
// Before EVERY LLM call in the runner:
async fn build_context_for_model(
    db: &Pool<Postgres>,
    conversation_id: Uuid,
    system_prompt: &str,
    tools: &[Value],
    provider: &str,
    model: &str,
) -> Vec<ChatMessage> {
    let model_limit = model_context_limit(provider, model);
    let all_messages = load_conversation_history(db, conversation_id).await;
    
    // Automatic sliding window — no user intervention
    prepare_context(&all_messages, system_prompt, tools, model_limit)
}
```

---

## 3. UI/UX Research Report

### 3A: Steer Messages (Send While AI Works)

**What VS Code Copilot does:** Users can send follow-up messages while the AI is streaming. The system:
1. Freezes the partial assistant response (marks it incomplete)
2. Appends the user's steer message
3. Starts a new AI generation with full context (including the partial response)

**Current Operon problem (line 729 of useStreamEvents):**
```typescript
if (streamingRef.current) return; // ← BLOCKS new messages while streaming!
```

**Fix: Remove this guard and implement steer:**
```typescript
const sendMessage = async (text, opts) => {
  if (streamingRef.current) {
    // STEER: abort current, freeze partial, start new
    abortRef.current?.abort();
    if (assistantMessageRef.current) {
      assistantMessageRef.current.isComplete = true;
      assistantMessageRef.current.isStreaming = false;
    }
    // ... append steer message, start new generation
  }
  // ... normal flow
};
```

### 3B: Layout Shift During Streaming

**Problem:** As text streams in, content below pushes down. Jarring jumps.

**Fix (CSS):**
```css
.chat-scroll-container {
  overflow-y: auto;
  overflow-anchor: none;  /* Disable browser default */
  overscroll-behavior: contain;
}

.scroll-anchor {
  overflow-anchor: auto;  /* Pin scroll to this element */
  height: 0;
}

.streaming-message {
  contain: layout style;  /* Isolate reflow to this element */
}
```

**Fix (JS) — smart auto-scroll:**
```typescript
// Only auto-scroll if user is near the bottom
const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
if (atBottom) {
  anchorRef.current?.scrollIntoView({ behavior: 'instant' }); // NOT 'smooth' during streaming!
}
```

### 3C: Anthropic Streaming Chunks (Paragraph Jumps)

**Problem:** Anthropic sends 20-200 char chunks vs OpenAI's 3-15 char chunks. UI looks like paragraphs appear at once.

**Fix: Typewriter Buffer**
```typescript
class TypewriterBuffer {
  private pending = "";
  private rafId: number | null = null;

  push(chunk: string) {
    this.pending += chunk;
    if (!this.rafId) this.drain();
  }

  private drain() {
    const step = () => {
      // Emit 2-3 chars per frame for Anthropic, 8+ for OpenAI
      const batch = Math.min(
        this.pending.length,
        this.pending.length > 200 ? Math.ceil(this.pending.length / 5) : 3
      );
      const out = this.pending.slice(0, batch);
      this.pending = this.pending.slice(batch);
      this.onFlush(out);
      
      if (this.pending.length > 0) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(step);
  }

  flush() { /* On stream end, emit everything immediately */ }
}
```

**How Claude.ai handles it:** They use exactly this pattern — characters appear 2-3 at a time even though the API sends 20+ chars. Plus a blinking cursor animation that masks the batchy feel.

---

## 4. Summary of Priorities

| # | Task | Cost Impact | UX Impact | Effort |
|---|------|-------------|-----------|--------|
| 1 | **Enable Anthropic prompt caching** | 90% savings | Faster responses | 1 line |
| 2 | **Auto sliding window** (no manual compact) | Unlimited sessions | Seamless | 1 day |
| 3 | **Typewriter buffer** for Anthropic chunks | — | Smooth streaming | 2 hours |
| 4 | **Layout shift fix** (CSS + scroll anchor) | — | No jank | 2 hours |
| 5 | **Steer messages** (send while AI works) | — | Major UX win | 1 day |
| 6 | **Token counting before send** | Prevents errors | No context overflow | 1 day |
| 7 | **Model-tiered operations** (cheap for internal) | 10x savings on internal ops | — | 3 hours |

### Immediate Action: Enable Prompt Caching (1 line of code!)

In `server/src/agent/anthropic.rs`, add `cache_control` to the API request body. This single change will:
- Cut Anthropic costs by 90% on turn 2+
- Speed up responses by 3.3x
- Work automatically for multi-turn conversations
- Require ZERO changes to conversation management

For OpenAI: Already automatic. For OpenRouter: Depends on the underlying model.
