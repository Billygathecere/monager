# MONAGER V4.0.0 — Comprehensive Architecture Audit & Implementation Plan

> **Document Version:** 4.0.0  
> **Date:** August 23, 2026  
> **Target Release:** MONAGER V4 (Production-Quality Intelligent Local-First Financial Command Center)

---

## 1. Executive Summary & Vision

**MONAGER V4** is the evolution of the Monager personal financial management platform into a **production-quality, intelligent, local-first money command center** featuring an autonomous, safety-guarded AI financial agent (**Monager AI V4**).

The core operational cycle is:

```
                  ┌─────────────────────────────────┐
                  │              USER               │
                  └───────────────┬─────────────────┘
                                  │ (Natural Language / UI)
                                  ▼
                  ┌─────────────────────────────────┐
                  │          MONAGER CORE           │
                  └───────────────┬─────────────────┘
                                  │
                                  ▼
                  ┌─────────────────────────────────┐
                  │    CENTRAL FINANCIAL STATE      │
                  └───────────────┬─────────────────┘
                                  │ Context Ingestion
                                  ▼
                  ┌─────────────────────────────────┐
                  │     MONAGER AI V4 AGENT         │
                  │   (Understands Full State)      │
                  └───────────────┬─────────────────┘
                                  │ Structured Tool Calling
                                  ▼
                  ┌─────────────────────────────────┐
                  │    SAFETY CONFIRMATION GATE     │
                  │   (Destructive/Financial Diffs) │
                  └───────────────┬─────────────────┘
                                  │ Approved Action Execution
                                  ▼
                  ┌─────────────────────────────────┐
                  │     STATE & UI AUTO-UPDATE      │
                  └─────────────────────────────────┘
```

---

## 2. Repository Audit Findings

### 2.1 Current Working Functionality
- **Dynamic Budget Allocation Engine**: Calculates proportional and fixed bucket allocations derived from the user's monthly salary.
- **Dashboard Command Center**: Real-time KPI summaries (Salary, Total Spent, Allocated, Safe Buffer, Health Status).
- **D3.js Category Spending Distribution**: Interactive SVG donut chart with hover animations, legend percentages, cycle switching, and center metrics.
- **Monthly Spending Trajectory**: 2D Canvas chart visualizing historical monthly burn rates against salary limits.
- **Expense Ledger**: Transaction recording, category filtering, search, pagination, CSV export, and editing.
- **Live Multi-Currency Matrix**: Real-time exchange rate engine supporting COP, KES, USD, EUR, GBP, CAD, AUD, JPY, INR, ZAR, AED, CHF, BRL, CNY, MXN with 5-minute server-side caching.
- **PDF Budget Parsing**: Multimodal PDF document ingestion via Gemini 2.5 Flash with fallback to `pdf-parse`.
- **Internationalization (i18n)**: Real-time localization across English (EN), Spanish (ES), Swahili (SW), French (FR), German (DE), and Portuguese (PT).
- **Theme & Settings Engine**: Multiple visual themes (Cyber Dark, Midnight Blue, Dark, Light, Auto), Web Audio feedback chimes, and JSON backup export/import.

### 2.2 Incomplete or Simulated Features (To Be Replaced)
1. **Receipt Scanner (SIMULATED)**: Currently, `captureReceiptSnapshot()` picks a random dummy receipt (`Éxito`, `D1 Tienda`, `Juan Valdez`) from a hardcoded array after a timeout. **No actual OCR or vision processing is performed on the captured image.**
2. **Monager AI Agent Capabilities (PASSIVE ONLY)**: The existing `/api/ai/chat` endpoint is a passive conversational interface returning static markdown. **It lacks tool/function calling, cannot perform state modifications, and cannot execute user commands** (e.g. recording expenses, reallocating budgets, or creating savings goals).
3. **Savings Goals (INCOMPLETE)**: Savings goals (such as the MacBook or Travel funds) are only tracked as standard budget categories, with no dedicated entity tracking target amounts, target dates, accumulated totals, monthly velocity, or projected completion dates.
4. **Payday Reminders (SIMULATED BACKGROUND)**: 25th payday reminders rely entirely on in-memory `setInterval` loops while the browser tab is open. If the tab is closed, reminders cannot fire without a Web Push notification backend.
5. **Geolocation Currency Switching (HEURISTIC)**: Country detection currently uses Euclidean distance to Bogota vs. Nairobi coordinates rather than real reverse geocoding, and automatically changes currency without user consent.

### 2.3 Technical Risks & Inconsistencies
- **Legacy Branding & Version Consolidation**: Resolved previous branding fragmentation into unified **Monager v3.2.0** across `package.json`, `manifest.webmanifest`, `VERSION.txt`, `sw.js`, and `DEPLOYMENT.md`.
- **Lack of Guardrails on AI Actions**: No confirmation or preview mechanism exists for financial mutations triggered via natural language.
- **Skipped Salary Inconsistency**: When a user skips a month, the system does not record a structured `salaryStatus: 'skipped'` record in history, risking skewed analytics.
- **XSS / HTML Sanitization Vulnerabilities**: Several innerHTML insertions format user notes and chat messages with basic regex rather than a sanitized pipeline.

---

## 3. MONAGER V4 Architecture & Target State

### 3.1 Modular File Organization
To ensure optimal modularity, performance, and maintainability, the application will be structured as follows:

```
├── .env.example
├── DEPLOYMENT.md
├── VERSION.txt                 (Updated to MONAGER V4.0.0)
├── manifest.webmanifest        (Updated metadata, icons, shortcuts)
├── metadata.json               (Updated permissions & capabilities)
├── package.json                (v4.0.0, scripts, dependencies)
├── server.js                   (Express backend: Gemini Agent Tools, Vision OCR, Live FX, Web Push)
├── sw.js                       (Service Worker v4.0.0: offline caching, Web Push handlers)
├── index.html                  (Clean V4 Shell & View Templates)
└── src/
    ├── ai/
    │   ├── agentTools.js       (Client & server tool schemas + confirmation descriptors)
    │   └── aiController.js     (Agent chat lifecycle, tool dispatch, confirmation UI cards)
    ├── currency/
    │   └── currencyService.js  (Unified exchange rate state, caching, converter math)
    ├── finance/
    │   ├── financeState.js     (Single source of truth for salary, allocations, expenses, goals)
    │   ├── budgetEngine.js     (Proportional allocation rules, health status, rebalancing)
    │   └── analyticsEngine.js  (Velocity, burn-rate commentary, trend charts)
    ├── goals/
    │   └── goalsService.js     (Savings goal CRUD, target dates, monthly contribution math)
    ├── notifications/
    │   └── notificationEngine.js (In-app alerts, browser notifications, Web Push manager)
    ├── receipt/
    │   └── receiptScanner.js   (Camera feed, image capture, Gemini Vision OCR extraction, confirmation modal)
    └── utils/
        ├── formatters.js       (Currency, date, and number formatters)
        ├── sanitize.js         (Safe HTML rendering & XSS prevention)
        └── storage.js          (localStorage schema validation, migration, export/import)
```

---

## 4. Subsystem Specifications

### 4.1 Monager AI V4 — Genuine Agent & Tool Calling Architecture

#### Interaction Workflow:
```
User Prompt ("Move COP 100k from Living to Travel")
   │
   ▼
Backend /api/ai/agent (Gemini 3.7 Flash with Function Declarations)
   │
   ▼
Gemini selects tool: `reallocate_budget({ fromCategory: "Living", toCategory: "Travel", amount: 100000 })`
   │
   ▼
Frontend receives Tool Call Proposal
   │
   ▼
UI displays Safe Confirmation Card (Current vs. Proposed state diff + [Confirm] / [Cancel] buttons)
   │
   ├── [Cancel]  ──> Abort action, notify user in chat.
   │
   └── [Confirm] ──> Execute `financeState.reallocate(...)`
                     Update Budget, Dashboard, Charts, Storage
                     Send tool execution output back to AI context
                     AI generates confirmation message ("Successfully moved COP 100,000...")
```

#### Structured Tool Registry:
1. `record_salary({ amount, month, note })`
2. `skip_salary_month({ month, reason })`
3. `add_expense({ amount, category, date, note, merchant })`
4. `edit_expense({ expenseId, updates })`
5. `delete_expense({ expenseId })`
6. `create_budget_category({ name, percentOrAmount, isFixed })`
7. `edit_budget_category({ categoryName, updates })`
8. `delete_budget_category({ categoryName, transferRemainingTo })`
9. `reallocate_budget({ fromCategory, toCategory, amount })`
10. `create_savings_goal({ title, targetAmount, targetDate, categoryLink })`
11. `update_savings_goal({ goalId, updates })`
12. `delete_savings_goal({ goalId })`
13. `convert_currency({ amount, fromCurrency, toCurrency })`
14. `get_budget_status({ month })`
15. `get_financial_health({})`
16. `navigate_to_page({ pageId })` *(Safe — Executes immediately without confirmation)*
17. `open_modal({ modalType, prefillData })` *(Safe — Executes immediately without confirmation)*

### 4.2 Genuine Receipt Scanner (Gemini Vision OCR)
1. **Camera Feed & Snap**: Stream live video using `navigator.mediaDevices.getUserMedia` and snapshot to canvas (with file drag-and-drop fallback).
2. **Backend Vision Endpoint (`/api/receipt/scan`)**: Sends base64 image to Gemini 2.5 Flash with structured JSON schema:
   - `merchant`: Store/vendor name
   - `total`: Total monetary amount as a number
   - `currency`: Detected currency code (COP, KES, USD, EUR, etc.)
   - `date`: Transaction date (YYYY-MM-DD)
   - `suggestedCategory`: Best matching category from the user's active budget rules
   - `items`: Itemized list with unit prices (if legible)
   - `confidence`: Extraction confidence score
3. **Verification Dialog**: Displays extracted data in an editable review modal (`[Add Expense]`, `[Edit Details]`, `[Cancel]`).
4. **Zero Silent Writes**: Never silently writes unverified OCR data to the ledger.
5. **Offline / Error State**: Displays clear messaging when AI vision is unavailable.

### 4.3 Centralized Currency Architecture
1. **Single Source of Truth**: All components (Dashboard, Ledger, Budget, AI, Matrix) read from a single centralized `currencyService`.
2. **Resilient Rate Pipeline**:
   - Primary: Live upstream API fetch via backend proxy (`/api/rates`).
   - Caching: 5-minute server-side memory cache + local client-side cache in `localStorage`.
   - Fallback: Hardcoded fallback rates used *only* on network failure, clearly labeled: `Cached Rate (Offline)`.
3. **Prompted Currency Switching**: If GPS location detects a country change, the UI prompts: *"Detected location in Kenya. Would you like to switch primary display to KES?"* (never switches automatically).

### 4.4 Savings Goals Engine
1. **Data Model**:
   ```typescript
   interface SavingsGoal {
     id: string;
     title: string;
     targetAmount: number;
     currentAmount: number;
     currency: string;
     targetDate: string; // YYYY-MM-DD
     linkedCategory?: string; // e.g. "MacBook"
     monthlyContributionRequired: number;
     notes?: string;
   }
   ```
2. **Calculations**: Automatically computes required monthly contributions based on target date and track progress against linked budget categories.

### 4.5 Notification & Payday Reminder Architecture
1. **Explicit Separation**:
   - **In-App Alerts**: Active banners and badge indicators when opening the app.
   - **Browser Notifications**: Triggered via standard Notification API when permission is granted.
   - **Web Push Notifications**: Server-side push subscription management via Service Worker for true background alerts where supported.
2. **Payday Reminder Actions**:
   - `[Enter Salary]`: Opens prefilled salary dialog.
   - `[Skip This Month]`: Sets `salaryStatus = "skipped"` for that month without treating salary as 0.
   - `[Remind Me Later]`: Snoozes notification for 24 hours.

---

## 5. Security & Privacy Hardening

1. **API Key Security**: `GEMINI_API_KEY` is exclusively managed on the server side in `server.js`. Frontend code never accesses or exposes the API key.
2. **Safe HTML Pipeline**: All dynamic text, expense notes, AI responses, and merchant names pass through `sanitizeHtml()` before DOM insertion.
3. **Zero Hardcoded Secrets**: All configuration is documented in `.env.example`.
4. **Safe Backup Engine**: JSON backup imports are strictly validated against a JSON schema to reject corrupted or malicious payloads.

---

## 6. Phased Implementation Plan

| Phase | Description | Key Deliverables |
|---|---|---|
| **Phase 1** | **Repository Alignment & Metadata** | Update `package.json`, `metadata.json`, `manifest.webmanifest`, `VERSION.txt`, and `DEPLOYMENT.md` to `MONAGER V4.0.0`. |
| **Phase 2** | **Centralized Financial State & Goals Engine** | Unify `financeState`, budget calculations, savings goals CRUD, and skipped-month history tracking. |
| **Phase 3** | **Backend Gemini Agent & Tool Execution** | Implement `/api/ai/agent` with structured function declarations, tool dispatchers, and frontend confirmation cards. |
| **Phase 4** | **Genuine Receipt Scanner with Gemini Vision** | Implement `/api/receipt/scan` vision pipeline and verification modal; remove dummy data simulation. |
| **Phase 5** | **Currency System & Notification Hardening** | Unify exchange rate state, add offline labels, implement true Web Push / in-app notification engine. |
| **Phase 6** | **UI/UX Polish & Mobile Responsiveness** | Polish dashboard cards, D3 donut chart, savings goals view, responsive modals, and touch targets. |
| **Phase 7** | **End-to-End Verification & Testing** | Validate all 22 test criteria (salary distribution, AI tool execution, receipt OCR, backup/restore, offline PWA). |

---

## 7. Known Environment Limitations

- **True Background Web Push**: Background notifications while the browser is completely closed require an active external VAPID push service. In environments without an external push gateway, the application will provide standard in-app notifications and browser notification triggers, clearly labeled to the user without faking background execution.

---

*This document is stored as `IMPLEMENTATION_PLAN_V4.md` in the workspace root for reference.*
