# Matterfull — Delivered vs Required

## Tool Inventory

| # | Tool | Status | Covers Requirement | Notes |
|---|------|--------|-------------------|-------|
| 1 | `fetch_ads_txt` | DONE | Step 5-6 (websites) | Fetches + parses ads.txt, returns structured entries |
| 2 | `fetch_app_ads_txt` | DONE | Step 5-6 (apps) | Fetches app-ads.txt from known publisher domain |
| 3 | `fetch_sellers_json` | DONE | Step 8 | Fetches + parses sellers.json, returns seller entries |
| 4 | `verify_domain` | DONE | General domain health | DNS + SSL + ads.txt + risk score in one call |
| 5 | `dns_lookup` | DONE | Domain investigation | A/AAAA/MX/NS/TXT records |
| 6 | `whois_lookup` | DONE | Domain investigation | Registration data |
| 7 | `ssl_inspect` | DONE | Domain investigation | Certificate chain + expiry |
| 8 | `crawl_domain` | DONE → UPGRADE | Step 5 | Currently reqwest-based. NEEDS spider crate for Cloudflare bypass |
| 9 | `wayback_lookup` | DONE | Historical analysis | Wayback Machine snapshots |
| 10 | `check_proxy` | DONE → UPGRADE | Proxy support | Currently mock. NEEDS real proxy pool |
| 11 | `detect_fraud` | DONE | QA/fraud | Pattern-based fraud detection |
| 12 | `generate_report` | DONE | Output | Report compilation |
| 13 | `openrtb_parse` | DONE | Bid request analysis | OpenRTB/schain parsing |
| 14 | `traffic_analyze` | DONE | Traffic patterns | Bid-level analysis |
| 15 | `validate_supply_chain` | DONE → UPGRADE | Step 8-10 partially | Basic logic. NEEDS full Scenario 1 algorithm |
| 16 | `app_store_lookup` | **MISSING** | Step 2-3 | Google Play + Apple App Store scraping |
| 17 | `schain_verify` | **MISSING** | Step 7-10 | Full multi-step cross-verification |
| 18 | `bulk_process` | **MISSING** | Batch (5000+ items) | Queue + parallel processing pipeline |
| 19 | `extract_root_domain` | **MISSING** | Step 3 | URL → registrable root domain |

## Infrastructure Gaps

| Feature | Status | Required |
|---------|--------|----------|
| Cloudflare bypass | NOT DONE | spider crate with `real_browser` + `chrome_stealth` |
| Proxy rotation | MOCK ONLY | Real proxy pool (Google proxies, SOCKS5, rotation) |
| App store scraping | NOT DONE | Google Play + Apple App Store page parsing |
| Bulk processing | NOT DONE | Queue system for 5000+ items |
| Structured table output | NOT DONE | 10-column table matching client format |
| xlsx upload/parse | NOT DONE | Frontend upload + calamine/xlsx parsing |

## Personalization Status

| Component | Status |
|-----------|--------|
| user_profiles table | Migration created |
| PersonalizationContext struct | Done |
| build_context() | Done |
| generate_prompt_injection() | Done |
| post_conversation_learn() | Done - wired into runner.rs |
| recall_relevant_memories() | Done (keyword-based, no vector yet) |
| Bootstrap onboarding | Module done, not triggered from frontend |
| Vector semantic recall | Pgvector column exists, embedding logic not wired |

## Pages Status

| Page | Has UI | Has Real Backend | Assessment |
|------|--------|-----------------|------------|
| Chat | YES | YES | Core product. Works end-to-end. |
| Domains | YES (static mock) | NO | Fake data, no real fetching |
| Inventory | YES (static mock) | NO | Fake stats, no real data |
| Monitor | YES (static mock) | NO | Fake alerts, no real monitoring |
| Reports | Placeholder | NO | Empty shell |
| Explore | Placeholder | NO | Empty shell |
| Knowledge | Placeholder | NO | Empty shell |

## Gap Closure Plan (Today)

1. ✅ Requirements documented
2. Add `spider` crate with `real_browser`, `chrome_stealth`, `smart`, `socks` features
3. Implement `app_store_lookup` tool (Google Play + Apple App Store)
4. Implement `schain_verify` tool (full Scenario 1 algorithm steps 7-11)
5. Implement `bulk_process` tool (accept list, process in parallel, return table)
6. Upgrade `crawl_domain` to use spider for Cloudflare bypass
7. Add real proxy pool support (SOCKS5, HTTP proxies, Google proxies)
8. Add `extract_root_domain` utility
9. Add structured 10-column table output format
10. Wire all new tools into dispatch + tool definitions
