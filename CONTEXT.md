# ChatFlyr (WaCRM) — Full Application Architecture & Feature Reference

> **Product Name**: ChatFlyr (WhatsApp SaaS CRM & Business Automation Platform)  
> **Official Support**: WhatsApp (+91 9511450914)  
> **Architecture**: Multi-Tenant SaaS | Next.js 16 App Router | Supabase PostgreSQL & Realtime | WhatsApp Cloud API v21.0 & Baileys Multi-Device  

---

## 1. System Architecture & Tech Stack

- **Frontend Framework**: Next.js 16 (App Router with Turbopack), React 19, TypeScript.
- **Styling & UI Components**: Tailwind CSS v4, Shadcn UI, Lucide Icons, Framer Motion animations.
- **Database & Realtime Backend**: Supabase PostgreSQL with Row Level Security (RLS), Supabase Auth, Realtime Subscriptions, Cloud Storage buckets (`chat-media`).
- **WhatsApp Engine Integration**:
  - **Meta Cloud API**: Official v21.0 Graph API with Meta Embedded Signup, WABA management, System User Access Tokens (encrypted via AES-256 GCM).
  - **Baileys / Coexistence Engine**: Socket-based multi-device pairing via QR code scan for hybrid mode.
- **Payment & Billing**: Razorpay API (Subscriptions & Instant Wallet Top-ups).
- **AI Engine**: Multimodal LLM integration supporting OpenAI (`gpt-4o-mini`), Anthropic (`claude-3-haiku`), and Google Gemini (`gemini-3.5-flash`).

---

## 2. Comprehensive Module & Feature Breakdown

### A. Authentication, Multi-Tenancy & Access Control
- **User Authentication**: Secure Sign-up, Sign-in, Password Reset, and Session Management.
- **Multi-Tenant Scoping**: All operational data (`contacts`, `broadcasts`, `message_templates`, `conversations`, `wallets`) is scoped by `account_id`.
- **Role-Based Access Control (RBAC)**:
  - `owner`: Complete administrative control, billing access, account deletion, team invitations.
  - `admin`: Campaign management, flow creation, contact management, team administration.
  - `member`: Inbox conversation handling, manual broadcasting, contact editing.
  - `agent`: Assigned inbox conversation handling.
- **Team Invitations**: Tokenized invite links sent via email/link to add members to an existing workspace.

---

### B. 5-Day Free Trial & Subscription Management Engine
- **Automatic 5-Day Trial**: Every newly created account receives a full 5-day trial period automatically on signup.
- **Live Red Countdown Banner**: Mounted dynamically on the top of the dashboard shell:
  - High-visibility **Red UI styling** displaying real-time `HH:MM:SS` countdown timer until expiration.
  - Displays urgent upgrade call-to-action button leading directly to the billing portal.
- **Dual-Layer Action Blocking (Strict Gate)**:
  - **API Layer ([middleware.ts](file:///i:/Saas-whtsapp%20CRM/wacrm/src/middleware.ts))**: Blocks outbound message endpoints (`/api/whatsapp/send`, `/api/broadcasts`, `/api/automations`, `/api/flows`) with a `403 SUBSCRIPTION_EXPIRED` JSON error when trial expires.
  - **UI Layer ([SubscriptionGate.tsx](file:///i:/Saas-whtsapp%20CRM/wacrm/src/components/billing/subscription-gate.tsx))**: Disables sending buttons and actions across the UI.
- **Subscription Plans**:
  - **Starter (Testing)**: ₹10 testing plan.
  - **Essential Plan**: ₹999 / month.
  - **Growth Plan**: ₹1,999 / month.
  - **All-In-One Plan**: ₹3,999 / month.
- **Billing Cycles**: Supports Monthly & Yearly billing (Yearly calculates exact +365 day expiration).
- **Wallet System**: Instant Wallet Top-up with automatic paise-to-rupees conversion (`amount / 100`) and transaction history audit logs.

---

### C. WhatsApp Message Template Manager
- **Full Template Builder**: Create Meta-approved message templates across categories (`Marketing`, `Utility`, `Authentication`):
  - **Header Formats**: Text, Image, Video, Document, Location, or None.
  - **Body Content**: Plain text with dynamic variable placeholders (`{{1}}`, `{{2}}`).
  - **Footer Text**: Optional signature / opt-out text.
  - **Interactive Buttons**: Quick Replies, Call-to-Action (URL/Phone), and Copy Code.
- **Permanent Cloud Storage Link**: Upload media files directly to the `chat-media` bucket; media URLs are permanently stored with the template for instant single-click reuse.
- **Meta Sync & Lifecycle**:
  - Real-time status synchronization (`APPROVED`, `PENDING`, `REJECTED`, `PAUSED`).
  - Native fallback logic: Skips Meta Graph API calls for `native-` / `baileys-` local templates.

---

### D. Broadcast / Bulk Campaign Engine
- **Audience Filtering Options**:
  - All Contacts directory.
  - Contact Groups / Tags (multi-tag selection with exclusion logic).
  - Custom Field filters (`is`, `is_not`, `contains`).
  - Direct CSV Paste (comma or newline-separated phone numbers).
- **Variable Personalization Mapping UI**:
  - Detects template variables (`{{1}}`, `{{2}}`, etc.).
  - Interactive UI mapping each placeholder to **Contact Fields** (`Name`, `Phone`, `Email`, `Company`), **Custom Fields**, or **Static Text**.
- **Anti-Ban Messaging Delay (Interval Selector)**:
  - Adjustable rate limiter delay between message dispatches: 1s, 2s, 3s (recommended), 5s, 10s, 15s, 30s.
- **Immediate vs Scheduled Execution**:
  - Immediate execution via background worker queue.
  - Scheduled execution powered by `/api/whatsapp/broadcast/cron` endpoint.
- **Campaign Analytics**: Sent, Delivered, Read, Replied, and Failed count tracking without overcounting. Campaign clone & resend capabilities.

---

### E. AI Chatbot & Intelligent Auto-Reply
- **AI Persona & System Prompt Configuration**: Customize business context, tone, and guidelines.
- **Dynamic Prompt Interpolation**: Automatically injects live contact & environment data:
  - `{{contact.name}}`, `{{contact.phone}}`, `{{contact.email}}`, `{{contact.company}}`, `{{contact.tags}}`
  - `{{business.name}}`, `{{current_date}}`, `{{current_time}}`
- **Smart Co-existence with Automations (`coexistWithAutomations`)**: AI works alongside rule-based automations without double-texting customers.
- **Handoff Sentinel (`[[HANDOFF]]`)**: Automatically detects unhappy customers or complex requests and flags the conversation for a human agent.
- **Interactive AI Playground**: Test and preview AI responses with live contact simulation.

---

### F. Automations & Visual Flow Builder
- **Event Triggers**:
  - `new_message_received`: Triggers on any inbound customer message.
  - `keyword_match`: Triggers when inbound message contains specific keywords.
  - `first_inbound_message`: Triggers on new lead creation.
  - `tag_added`: Triggers when a contact tag is applied.
- **Flow Actions**: Send Text Message, Send Template Message, Time Delay, Conditional Branching (If/Else), Add/Remove Tag, Assign Agent.

---

### G. Live Omnichannel Inbox & Chat Management
- **Real-Time Streaming**: Messages land instantly via Supabase Realtime & Webhook events without page refresh.
- **Rich Media Messages**: Send & receive Text, Images, Videos, Audio Voice Notes, PDF/Documents, Locations, and Interactive Button Replies.
- **Conversation Management**:
  - Filter by All, Unassigned, Assigned to Me, Closed.
  - Assign to specific team members/agents.
  - Quick Replies snippet insertion via `/` trigger.
  - Right-side Contact Details drawer for custom fields, notes, and tags.

---

### H. Contact Management & CRM Tools
- **Contact Directory**: Search, filter, and view full communication histories.
- **Tag Management**: Categorize leads with custom color-coded tags.
- **Custom Fields Builder**: Add custom contact attributes (text, numbers, dates, dropdowns).
- **CSV Import & Export**: Bulk import contacts with phone number deduplication and automated tag assignment.

---

### I. Kanban Deal Pipelines
- **Custom Pipeline Stages**: Define stages (e.g. *Lead In*, *Qualified*, *Proposal Sent*, *Won*, *Lost*).
- **Drag-and-Drop Cards**: Visual deal progression with deal value tracking, notes, and direct contact linking.

---

### J. High-Converting Landing Page & Branding
- **WhatsFlow-Inspired Design**: WhatsApp Green & Deep Navy visual identity with ChatFlyr logo branding.
- **Hero & Feature Ticker**: Dual-device mockups (Dashboard + Mobile Bot) with scrolling service tickers.
- **3D Arc Perspective Testimonials**: 5-card perspective review carousel with **3.5s smooth auto-sliding**.
- **Floating WhatsApp Support Widget**: Quick-connect widget floating on bottom-right linking directly to WhatsApp support (`9511450914`).
- **Multi-Theme Engine**: 5 distinct accent themes (`violet`, `emerald`, `cobalt`, `amber`, `rose`) with true OKLCH color definitions and Dark Mode compatibility.

---

## 3. Database Schema Overview (Key Tables)

| Table Name | Description |
| :--- | :--- |
| `accounts` | Tenant accounts, subscription plan, trial status (`trial`, `active`, `expired`), trial end date. |
| `profiles` | User profiles linked to `auth.users` and `account_id`, role (`owner`, `admin`, `member`, `agent`). |
| `contacts` | Leads/contacts directory with phone, name, email, company, and account scoping. |
| `tags` & `contact_tags` | Tag definitions and junction table mapping contacts to tags. |
| `custom_fields` & `contact_custom_values` | Dynamic custom field schemas and per-contact value storage. |
| `message_templates` | Meta and local message template catalog with components, status, and media handles. |
| `broadcasts` & `broadcast_recipients` | Bulk messaging campaigns, filters, variables, and recipient delivery statuses. |
| `conversations` & `messages` | Real-time chat threads, assigned agents, message payloads, and media URLs. |
| `automations` & `flows` | Rule-based automation triggers and visual flow node trees. |
| `ai_configs` | System prompts, LLM model settings, auto-reply scopes, and coexistence toggles. |
| `wallets` & `wallet_transactions` | Tenant wallet balance and credit/debit transaction logs. |
| `billing_orders` | Razorpay order records, status (`created`, `paid`, `failed`), and plan metadata. |
| `whatsapp_config` | Meta WABA credentials, phone_number_id, encrypted access tokens, verify tokens. |

---

## 4. Security & Production Controls

1. **HMAC Webhook Signature Verification**: Verifies `x-hub-signature-256` headers on Meta webhook POST requests using `META_APP_SECRET`.
2. **Access Token Encryption**: All WhatsApp access tokens are encrypted at rest using AES-256-GCM before database insertion.
3. **Database Row-Level Security (RLS)**: Enforces strict tenant isolation — accounts can only read/write rows matching their `account_id`.
4. **Subscription Middleware Enforcement**: Blocks API write routes for accounts with expired subscriptions or trials.

---

## 5. Recent Working Features Added (September 24–25, 2026)

### 1. Coexistence Session Auto-Adoption & Connection Stability
- **Global Mutex Connection Locking**: Implemented `global.waConnectionLocks` in Baileys service to prevent race conditions during concurrent socket initialization.
- **Companion Pairing Fix**: Corrected credential validation by checking `creds.me.id` alongside `creds.registered`, preventing automatic disconnection on page refresh for linked multi-device WhatsApp companion sessions.
- **Session Folder Auto-Adoption**: Server automatically scans and adopts existing registered session folders on disk upon startup or reconnect.
- **Direct Contacts & Group Fetching**: Optimized `/api/whatsapp/baileys/chats` to fetch all 1,988 contacts directly from Firestore as well as active WhatsApp groups for complete conversation listing.

### 2. Primary Database Activation (Firebase Firestore & Auth) & 100% Data Sync
- **Primary Backend Shift**: Full transition to **Firebase Firestore** (`whatsapp-saas-7ab44`, region `asia-south2`) and Firebase Auth for all CRUD operations and user session management.
- **100% Zero-Loss Migration**: Successfully exported, validated, and synchronized 5,857 records across 24 database collections (1,988 contacts, 3,452 broadcast recipients, 216 messages, 66 conversations, 45 broadcasts, 15 pipeline stages, 4 profiles, 4 accounts, etc.).
- **Dual Config Continuity**: Supabase backup database maintained locally as an offline fallback while Firestore handles 100% of live traffic.

### 3. AI Chatbot Studio & Multi-Step Automated Follow-Up Engine
- **AI Chatbot Studio (`/dashboard/chatbot`)**: Built visual management interface for AI auto-reply rules and personas (Sales Representative, Customer Support, Lead Qualifier, Custom Prompt).
- **Automated Follow-Up Runner (`src/lib/chatbot/*`)**: Multi-step sequential follow-ups triggered after initial contact, featuring customizable typing delays, retry limits, and status tracking.
- **Keyword & Intent Matching**: Flexible triggers for inbound messages based on exact, partial, or regex keyword rules.

### 4. Pricing Plan Restructuring & 5% OFF Yearly Billing Discount
- **Removal of ₹10 Starter Plan**: Removed the legacy ₹10 testing plan from the Landing Page (`PricingSection.tsx`), Billing Page (`billing/page.tsx`), Admin Page (`admin/page.tsx`), `plan-features.ts`, and Razorpay order creation endpoints. Baseline paid tier set to Essential (₹999/mo).
- **5% OFF Yearly Billing**: Updated yearly billing logic with a prominent `(Save 5% OFF)` badge and accurate annual price calculation (`monthlyPrice * 0.95 * 12`): Essential (₹949/mo billed annually), Growth (₹1,899/mo), and Enterprise (₹3,799/mo).

### 5. Platform Admin Coupon Management Console & User Checkout Coupon System
- **Admin Coupon Management (`/admin` - Coupons Tab)**: Platform admins can create discount promo codes with percentage (`%`) or fixed (`₹`) discounts, set maximum usage limits, select expiry dates, toggle coupon status (`Active`/`Inactive`/`Expired`), and delete coupons.
- **User Checkout Coupon Validation**: Integrated "Have a Promo or Coupon Code?" widget on `/billing` page with real-time validation via `/api/billing/coupons/apply`.
- **Server-Side Razorpay Discount Engine**: Discount calculation enforced on the server within `/api/billing/razorpay/create-order` endpoint, updating coupon `used_count` directly in the Firestore `coupons` collection.

### 6. Shared Team Inbox & UI Usability Enhancements
- **Tab & Button UI Optimization**: Increased button sizes, improved active tab visual contrast, and made section tab bars scrollable for seamless navigation across responsive viewports.
- **Enhanced Chat & Group Display**: Consolidated direct customer contacts and group chats into a single unified inbox search and filter view.