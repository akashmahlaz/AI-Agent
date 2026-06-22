# Graph Report - Operon  (2026-06-22)

## Corpus Check
- 181 files · ~92,123 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1150 nodes · 1994 edges · 96 communities (80 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ed6cb804`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 319 edges
2. `Button()` - 30 edges
3. `operonFetch()` - 17 edges
4. `compilerOptions` - 16 edges
5. `Operon — Copilot agent instructions` - 14 edges
6. `Input()` - 12 edges
7. `scripts` - 12 edges
8. `describeTool()` - 11 edges
9. `Card()` - 11 edges
10. `/graphify` - 11 edges

## Surprising Connections (you probably didn't know these)
- `FileTypeIcon()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/chat/page.tsx → lib/utils.ts
- `LogsPage()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/logs/page.tsx → lib/utils.ts
- `OverviewPage()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/overview/page.tsx → lib/utils.ts
- `ReasoningPart()` --calls--> `cn()`  [EXTRACTED]
  components/chat/message/parts/ai-reasoning.tsx → lib/utils.ts
- `ProgressRing()` --calls--> `cn()`  [EXTRACTED]
  components/chat/message/parts/media-skeleton.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (96 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (35): ACTIVE_TOOL_STATES, ActivePulseDot(), ChatMessageRow, deriveThinkingRunTitle(), DownloadResult(), extractDownloadResult(), formatBytes(), formatStreamErrorMessage() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (47): dependencies, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/openai, @ai-sdk/react, antd, bcryptjs, chat (+39 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (29): ChatErrorBoundary, Props, State, AttachedFile, CHANNEL_META, ChatPage(), ConversationFile, ConversationSummary (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (31): cn(), Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (28): useIsMobile(), Separator(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (33): 0A: Deep Logging Infrastructure, 0B: Fix MiniMax / Multi-Provider Streaming, 0C: Fix Tool Card Stuck Loading, 0D: Fix Compaction, 0E: Fix Retry Loop, 5A: Repo Indexing (Greptile-style), 5B: Provider Abstraction Layer, 5C: Pre-flight Quota Check (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (27): ChatDisplayMessage, ParsedAttachment, ToolCallPart, ChartBlock(), ChartBlockProps, ChartData, ChartType, COLORS (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (24): SSEEvent, SSEEventType, UseStreamEventsOptions, UseStreamEventsReturn, AnchorEvent, CodeblockUriEvent, CommandButtonEvent, ConfirmationEvent (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/node, @types/react (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (13): DashboardIcon, ServiceCardItem, ServiceSectionPage(), ServiceSectionPageProps, statusLabel, codingServices, crmServices, googleServices (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (25): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (25): 1.1 Two production-grade Rust AI SDKs exist today, 1.2 Supporting crates we will need, 1. Research: the Rust AI ecosystem in 2026, 2. Why aisdk over rig (for Operon specifically), 3.1 Tauri v2 — the obvious path, 3.2 If we don't build in Rust, 3.3 Conclusion, 3. Desktop future: what Rust unlocks (this is the real reason to build in Rust) (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (19): jakarta, jetBrainsMono, metadata, spaceGrotesk, applyTheme(), getStoredTheme(), getSystemTheme(), storageKey() (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (16): CHANNEL_LABELS, DEFAULT_STATE, MemoryFact, PersonaSettings(), PersonaState, Label(), Select(), SelectContent() (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (16): isModelProvider(), providerCatalog, ProviderKind, ProviderMeta, ProviderSetup, recommendedProviderIds, providerClass, ProviderIcon() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (11): ReasoningPart(), MermaidBlock(), MermaidBlockProps, ReasoningPart(), ReasoningPartProps, AnimatedShinyText(), AnimatedShinyTextProps, Checkbox() (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (13): builtInIntegrations, builtInSkills, Agent, Channel, ChatMessage, ConversationDetail, Integration, LogEntry (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (16): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (11): MetaStatus, LogsPage(), RunLog, STATUS_COLORS, Connector, connectors, MetaStatus, Button() (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (12): Agent, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (14): AppSidebarProps, groupLabels, dashboardNav, DashboardNavItem, marketingNav, ConversationSummary, SidebarContent(), SidebarFooter() (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (7): SignUpForm(), CampaignInsight, MetaAccount, MetaCampaign, MetaStatus, ConvSummary, Input()

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (17): 1. Cost Management — How to Make Sessions Unlimited Without Burning Money, 2. Unlimited Sessions Architecture, 3. UI/UX Research Report, 3A: Steer Messages (Send While AI Works), 3B: Layout Shift During Streaming, 3C: Anthropic Streaming Chunks (Paragraph Jumps), 4. Summary of Priorities, Auto-Compaction (Zero User Intervention) (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (9): LoginForm(), AuthCallbackContent(), OperonAuthResponse, operonGoogleOAuthUrl(), operonJson(), operonLogin(), operonMe(), operonSignup() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (13): useAutoResizeTextarea(), UseAutoResizeTextareaProps, AI_Input_Search(), AIInputSearchProps, compactModelLabel(), extractProvider(), ModelProviderIcon(), PromptModelOption (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (12): DailyPoint, HealthData, LogEntry, OverviewPage(), UsageSummary, Badge(), badgeVariants, CardContent() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.23
Nodes (8): Card(), CardAction(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), Textarea(), workspaceFiles

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (10): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (5): allDashboardSections, DashboardSection, settingsDashboardSection, settingsTabs, SettingsTabs()

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (14): Active product plan (locked 2026-05-13 — DO NOT REORDER without asking the user), AI streaming UI rules, App Router conventions, Branch awareness, Brand, Brand / UI, File / folder layout, Git hygiene (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (11): ASPECT_RATIOS, GeneratedAudio(), GeneratedImage(), GeneratedVideo(), getAspectClass(), MEDIA_ICONS, MediaSkeleton(), MediaSkeletonProps (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (8): OperonMark(), OperonWordmark(), PageShell(), PageShellProps, DashboardTopbar(), DashboardTopbarProps, cols, MarketingFooter()

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (9): DashboardLayoutClient(), DashboardLayoutClientProps, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (12): ARCHITECTURE IMPROVEMENTS (P3), BUGS & ERRORS (P1), CRITICAL BUGS (P0), DEAD CODE / DUPLICATES (P1), ENV CONFIGURATION, FILE UPLOAD UX (P1), MEDIA GENERATION FLOW, Operon — Comprehensive Audit TODO (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (9): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogMedia(), AlertDialogOverlay() (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (10): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), INITIAL_DIMENSION, THEMES (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.23
Nodes (6): Features, Hero(), HowItWorks(), scenarios, Pricing(), tiers

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (9): hydrateMessageParts(), partId(), detectEdit(), EditCard(), EditCardKind, EditPayload, parseUnifiedDiff(), StreamPart (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (4): GithubStatus, clearOperonSession(), operonFetch(), operonToken()

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.31
Nodes (7): AppSidebar(), Navbar(), navDropdowns, operonUser, OperonSessionContext, OperonSessionContextValue, useOperonSession()

### Community 46 - "Community 46"
Cohesion: 0.39
Nodes (8): FilePart(), FilePartList(), isImageMime(), isPdfMime(), ParsedAttachment, pickIcon(), shortMime(), MessageAttachment

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 48 - "Community 48"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (5): ToolInvocationLike, toolLabels, ToolLike, ToolPart(), toToolLike()

### Community 51 - "Community 51"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (6): extractDimension(), extractMediaUrl(), isMediaTool(), MediaResult(), mediaTypeForTool(), ToolCallItem()

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (4): AIEmptyState(), AIEmptyStateProps, AITextLoading(), AITextLoadingProps

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (5): Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants

### Community 55 - "Community 55"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (3): hostnameOf(), SourceUrlPart(), SourceUrlPartProps

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (3): MARKDOWN_COMPONENTS, TextPart(), TextPartProps

### Community 58 - "Community 58"
Cohesion: 0.40
Nodes (3): InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (3): DataTable(), DataTableProps, parseMarkdownTable()

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (3): For /graphify explain, For /graphify path, graphify reference: query, path, explain

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **382 isolated node(s):** `$schema`, `plugin`, `@opencode-ai/plugin`, `Agent`, `ConversationSummary` (+377 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 3` to `Community 0`, `Community 2`, `Community 4`, `Community 6`, `Community 9`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 22`, `Community 23`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 44`, `Community 48`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 57`, `Community 58`, `Community 59`, `Community 66`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 19` to `Community 2`, `Community 3`, `Community 4`, `Community 9`, `Community 13`, `Community 14`, `Community 17`, `Community 18`, `Community 21`, `Community 22`, `Community 23`, `Community 27`, `Community 28`, `Community 29`, `Community 34`, `Community 35`, `Community 38`, `Community 40`, `Community 43`, `Community 48`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `TypewriterBuffer` connect `Community 49` to `Community 7`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `@opencode-ai/plugin` to the rest of the system?**
  _382 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04499274310595065 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05314009661835749 - nodes in this community are weakly interconnected._