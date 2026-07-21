# Vyapar Setu — Implementation Plan v2.0 (Mobile-First)
### LogicSync Digital

**Change from v1.0:** Mobile app is built and launched first as a standalone MVP. Desktop app and Tally two-way integration move to Phase 2, built only after mobile proves traction. Backend/database core is unchanged — it was always designed to be client-agnostic.

---

## 1. Strategy Recap

**Why mobile-first:**
- Lower cost, faster time-to-first-paying-customer (one client app, not two)
- Udhari tracking — the core wedge feature — is a counter-side, phone-in-hand behavior, not a desktop one
- Reuses your existing AgriSync offline-first PWA/sync patterns directly

**What this changes in positioning:** Tally's XML/HTTP integration only works from a machine on the same local network as Tally (port 9000) — a phone cannot reach it. So the "switch from Tally, keep your data" pitch is **not** part of the mobile launch. Mobile v1 targets businesses currently on **paper registers, notebooks, or WhatsApp** for udhari tracking — arguably a bigger, less contested Tier 2/3 market than Tally switchers. The Tally-switcher pitch activates later, when Desktop + Tally Bridge ships.

**Assumption made for this plan:** Mobile v1 invoice sharing is PDF-via-WhatsApp only (no Bluetooth thermal printer). Printer support is deferred to the post-MVP mobile update once you confirm demand — flag if you'd rather build it into the MVP itself.

---

## 2. Tech Stack (Mobile-First Order)

### Mobile App — Phase 1 (build first)
- **Framework:** React Native + Expo (fast iteration; eject later only if a native module forces it — e.g., advanced Bluetooth printer SDKs)
- **Local DB:** WatermelonDB or op-sqlite — built for offline-first, handles large local datasets well
- **Push notifications:** Firebase Cloud Messaging
- **Camera/Barcode:** Expo Camera + a barcode-scanning library (react-native-vision-camera or expo-barcode-scanner)

### Backend (Central Server) — build alongside Phase 1, unchanged from v1.0
- **API:** Spring Boot, REST + WebSocket for sync events
- **Database:** PostgreSQL, multi-tenant, JSONB for industry-pack custom fields
- **Auth:** JWT + refresh tokens, RBAC (reuse VEGA ERP pattern)
- **AI layer:** Spring AI + Groq/LLaMA (reuse SmartSpend work) — deferred to Low priority, not MVP-blocking
- **File storage:** S3-compatible (Supabase storage) for invoice PDFs, product photos

### Desktop App — Phase 2 (build only after mobile traction is proven)
- **Framework:** Electron (fastest given your React skillset) wrapping the same core React components where possible for UI consistency with mobile
- **Local DB:** SQLite (better-sqlite3)
- **Tally Bridge:** Local Spring Boot microservice module — see Section 6

### DevOps
- **Hosting:** Backend on Render/Railway to start
- **CI/CD:** GitHub Actions — EAS Build for mobile releases (iOS/Android), desktop installers added in Phase 2

---

## 3. System Architecture

```
                 PHASE 1 (build now)
        ┌─────────────────────────┐
        │      Mobile App          │
        │   (React Native/Expo)    │
        │    Local WatermelonDB    │
        └────────────┬──────────────┘
                      │ Offline-first writes
                      │ Background sync (delta)
                      │ HTTPS/WSS
             ┌────────▼─────────┐
             │  Spring Boot API │
             │ (Sync + Business │
             │  Logic + Auth)   │
             └────────┬─────────┘
                      │
             ┌────────▼─────────┐
             │   PostgreSQL      │
             │  (multi-tenant)   │
             └───────────────────┘

                 PHASE 2 (after mobile traction)
        ┌─────────────────────────┐
        │      Desktop App          │
        │   (Electron + React)      │
        │     Local SQLite           │
        │  + Local Tally Bridge      │
        └────────────┬───────┬──────┘
                      │       │
                      │       └──── LAN: localhost:9000
                      │                    │
                      │            ┌───────▼────────┐
                      │            │  Tally Prime /   │
                      │            │  Tally ERP 9     │
                      │            └──────────────────┘
                      │
             (connects to the SAME backend API/DB
              built in Phase 1 — no rework needed)
```

The backend and database from Phase 1 are reused as-is in Phase 2 — this is the payoff of building the core client-agnostic from day one.

---

## 4. Core Database Schema

Unchanged from v1.0 — the schema was always designed independent of which client (mobile/desktop) writes to it. See Section 5 of the original Implementation Plan for full DDL. Quick reference:

```sql
businesses (id, name, business_type, gstin, config_pack JSONB, created_at)
users (id, business_id, name, phone, role, pin_hash)
parties (id, business_id, name, phone, type, opening_balance, custom_fields JSONB)
ledger_entries (id, business_id, party_id, type, amount, balance_after, mode, note, created_at, synced_at)
items (id, business_id, name, sku, batch_no, expiry_date, stock_qty, unit, purchase_price, sale_price, custom_fields JSONB)
invoices (id, business_id, party_id, invoice_no, gst_amount, total, irn, status, pdf_url, tally_voucher_id, created_at)
invoice_items (id, invoice_id, item_id, qty, rate, gst_rate, amount)
sync_log (id, business_id, entity_type, entity_id, operation, device_id, synced, conflict_resolved, created_at)
tally_mappings (id, business_id, local_entity_id, tally_master_name, tally_guid, last_synced_at)  -- unused until Phase 2
```

---

## 5. Development Phases & Timeline (Revised)

| Phase | Scope | Duration | Notes |
|---|---|---|---|
| **Phase 0 — Foundation** | Multi-tenant DB schema, auth/RBAC, core API skeleton | 3 weeks | Same as v1.0 — backend built once, used by both clients |
| **Phase 1 — Mobile MVP** | Ledger/udhari + basic invoicing (PDF/WhatsApp share), offline-first sync | 6 weeks | This is now the critical path — everything before public launch depends on this |
| **Phase 2 — Mobile: Inventory + GST invoicing** | Full GST invoice, stock module, barcode scan via camera | 4 weeks | |
| **Phase 3 — Mobile: Industry Packs (1-2 verticals)** | Start with Agri + Retail packs — reuse AgriSync learnings directly | 3 weeks | Only build packs for verticals you're actively selling into first |
| **Phase 4 — Closed Beta** | Onboard 5-10 real shop owners (ideally from your existing 9-10 clients), collect feedback, fix friction | 4 weeks | **Go/no-go checkpoint** — validate retention and willingness to pay before Phase 5 |
| **Phase 5 — Public Mobile Launch** | Play Store + App Store release, self-serve onboarding, pricing live | 2 weeks | |
| **Phase 6 — Desktop MVP** | Electron app, same core modules as mobile, reusing backend | 5 weeks | Starts only after Phase 4 validates demand |
| **Phase 7 — Tally Bridge (one-time import)** | XML export/import, ledger/party mapping + review UI | 4 weeks | Own this yourself — sensitive financial data logic |
| **Phase 8 — Tally Bridge (two-way sync) + remaining industry packs** | Scheduled sync, conflict resolution, GST export, Medical/Hardware/Real Estate packs | 5 weeks | |

**Time to first paying mobile customers: ~13-15 weeks (Phase 0-4).**
**Time to public mobile launch: ~17 weeks.**
**Desktop + Tally adds another ~14 weeks after mobile validates — only spend this if Phase 4 shows real retention.**

This is meaningfully faster to revenue than the original dual-client plan (which needed ~7-8 months before any public launch).

---

## 6. Tally Import/Export — Unchanged in Design, Just Deferred

All technical detail from v1.0 (XML ENVELOPE/HEADER/BODY structure, port 9000, one-request-at-a-time queueing, local Tally Bridge running on the Desktop app only, never exposing port 9000 publicly) still applies exactly as designed — it simply now happens in Phase 7-8 instead of Phase 4. No rework needed; this section of the original plan carries forward as-is.

---

## 7. Team Requirements (Revised)

| Role | Phase Needed | Notes |
|---|---|---|
| Backend (Spring Boot) | Phase 0 onward | You lead this |
| Mobile (React Native) | Phase 1 onward | Darshana cross-trains, or hire dedicated RN dev — this is now your most urgent hire |
| Design (UI/UX) | Phase 1 onward | Mobile UX is the whole product now — don't under-invest here |
| Desktop (Electron/React) | Phase 6 onward | Not needed until mobile validates — delay this hire |
| Tally Integration Specialist | Phase 7 onward | You, initially |
| QA | Phase 1 onward, part-time/rotating | |

---

## 8. Cost Estimate (Bootstrap Mode, Phase 0-5 only)

| Item | Monthly Cost (₹) |
|---|---|
| Cloud hosting (Render/Railway) | 3,000 – 10,000 |
| Expo EAS Build (mobile CI/CD) | Free tier initially, ~₹2,500/month at scale |
| Firebase (push) | Free tier initially |
| Design contractor | 10,000 – 20,000 one-time/per sprint |
| Additional mobile dev (if hired) | 25,000 – 45,000/month |

Reaching public mobile launch is now achievable on a **smaller budget than the original dual-client plan**, since desktop infra/dev cost is deferred.

---

## 9. Monetization (Mobile-First Tiers)

| Tier | Price | Includes |
|---|---|---|
| **Starter** | ₹299/month | Ledger + udhari tracking only |
| **Business** | ₹599/month | + GST invoicing + inventory |
| **Pro** | ₹999/month | + Industry pack (available once Desktop/Tally ships, upsell existing mobile users) |
| **Setup fee** | ₹1,000-2,000 one-time | Onboarding + data entry help (no Tally migration fee until Phase 7-8 exists) |

---

## 10. Immediate Next Steps

1. Finalize the printer-vs-PDF-share decision for invoice delivery in mobile v1 (currently assumed: PDF/WhatsApp only)
2. Start Phase 0 — auth + multi-tenant backend skeleton (reuse VEGA ERP's RBAC code)
3. Pick your **first 2-3 pilot businesses** from your existing 9-10 clients for Phase 4 closed beta — ideally ones without existing Tally usage, matching the mobile-first positioning
4. Begin wireframing the mobile ledger/udhari screen — this is the single highest-leverage screen in the entire product

---

*Prepared for LogicSync Digital — Atharva | Supersedes Implementation Plan v1.0's phase sequencing*
