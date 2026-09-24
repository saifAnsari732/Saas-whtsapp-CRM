# ChatFlyr CRM - System Architecture, Features & Roles Documentation (Contaxt.md)

---

## 1. Project Overview & Platform Identity

- **Application Name**: **ChatFlyr CRM** (formerly WaCRM / Botify.ai CRM)
- **Architecture**: Multi-tenant WhatsApp CRM & Marketing Automation SaaS
- **Core Stack**:
  - **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Shadcn UI
  - **Database & Primary Backend**: **Firebase Firestore & Firebase Authentication** (migrated from Supabase for optimized SaaS scalability & cost efficiency)
  - **Database Backup & Fallback**: Complete Supabase data backup maintained locally (`supabase_backup/`) with dual ENV configurations
  - **WhatsApp Engines**: Dual connectivity (Official Meta Cloud API + Baileys Coexistence QR Engine)
  - **Billing & Subscriptions**: Razorpay integration, 5-day auto-trial system, tiered SaaS plans
  - **Internationalization**: `next-intl` (Multi-language support: English, Hindi, etc.)

---

## 2. Advanced Role-Based Access Control (RBAC) & Plan Feature Matrix

The system enforces a clean, strict separation between **Platform Admin (Super Admin)** and **Regular Users (Tenants/Customers)**.

### A. Platform Admin (Super Admin)
- **Identification**: Any account where `profiles.role = 'admin'` or the user's email matches designated platform admin emails (`ansarisaifuddin732@gmail.com`, `kisandeveloper2@gmail.com`, or configured via `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS`).
- **All-Power Full Access**:
  - **No Subscription Restrictions**: Admin accounts are automatically granted `status: 'active'`, `plan: 'enterprise'`, `daysRemaining: 99999`, and unlimited quotas (`currentPlanLimits: { messages: -1, contacts: -1, users: -1 }`).
  - **No Buy / Upgrade Prompts**: Admin never sees the "Trial Banner", "Trial Expired", or "Upgrade Plan" buttons anywhere.
  - **Gating Bypass**: Admin bypasses all middleware gates and frontend `SubscriptionGate` checks unconditionally.
  - **Admin Navigation**: The purple **Admin** button is rendered in the sidebar and Command Menu (`Ctrl+K`) exclusively for platform admins.
  - **Admin Control Panel (`/admin`)**:
    - **Platform Overview Stats**: Total Registered Users, Active Subscriptions, 5-Day Trial Users, Total Revenue.
    - **Users Management Tab**: View all platform users, their role (`User` vs `Admin`), status, current plan, trial expiry date, change plan directly from a dropdown, grant +7 days trial, or block/unblock.
    - **Customer Payments Tab**: Live audit log of all customer Razorpay transactions, customer names, emails, amounts in INR (`₹`), plan bought, and reference IDs.

### B. Regular Users (Tenants / Businesses)
- **Role Assignment**: All new signups automatically receive `profiles.role = 'user'`.
- **5-Day Free Trial (ALL FEATURES 100% UNLOCKED)**:
  - Automatically receives 5 full days of free trial starting from account registration time (`created_at + 5 days`).
  - **Every single feature is unlocked during the trial**: Meta Cloud API, QR Coexistence, Bulk Broadcasts, Automations, Flow Builder, AI Chatbot Assistant, Shared Inbox, and CRM Pipelines.
  - **Top Red UI Countdown Banner**: Displays live ticking countdown boxes: `[XXd] : [XXh] : [XXm] : [XXs]`.
- **Post-Trial Expiration & Automatic Billing Redirect**:
  - Once the 5 days end without an active subscription:
    - **Strict Gating**: All operational routes (`/dashboard`, `/inbox`, `/broadcasts`, `/automations`, `/contacts`, `/pipelines`, `/flows`, `/agents`) and send action buttons are completely blocked.
    - **Auto-Redirect to Billing**: Attempting to access any protected action or page immediately redirects the user directly to `/billing?expired=true`.
    - **Exempt Pages**: Only `/billing`, `/settings`, and `/profile` remain accessible so the user can upgrade.

---

## 3. Tiered Plan Feature & Access Matrix

| Plan Tier | Price | Messaging Quota | Contacts | Agents | Allowed Features | Excluded Features |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **5-Day Free Trial** | Free | 5,000 | 2,500 | 3 | **ALL FEATURES 100% ENABLED** (Cloud API, QR Coexistence, Broadcasts, Automations, Flows, AI Reply, CRM Pipelines) | None |
| **Starter** | ₹10 / mo | 2,000 | 2,000 | 1 | WhatsApp Cloud API, Live Shared Inbox, Contacts, Templates | QR Coexistence, Automations, Flows, AI Reply, Deals Pipeline |
| **Essential** | ₹999 / mo | 15,000 | 15,000 | 5 | Cloud API, QR Coexistence, Live Shared Inbox, Bulk Broadcasts, Automations, CRM Pipelines | Visual Flows, AI Reply Assistant |
| **Growth** | ₹1,999 / mo | 50,000 | Unlimited | 15 | Cloud API, QR Coexistence, Broadcasts, Automations, Visual Flow Builder, AI Auto-Reply, Pipelines | None |
| **All-In-One Enterprise** | ₹3,999 / mo | Unlimited | Unlimited | Unlimited | Unlimited Everything, Dedicated Manager, Custom Integrations, Mobile App Support | None |
| **Platform Super Admin** | Free | Unlimited | Unlimited | Unlimited | Unrestricted master access to all features and admin console | None |

---

## 4. Payment Tracking & Details

### A. On User Billing & Profile Page (`/billing`, `/profile`)
- **Active Plan & Permissions Card**:
  - Displays current plan name, active status, days remaining or expiration date.
  - Shows visual status tags for each feature (e.g., "Meta Cloud API: Enabled", "QR Coexistence: Enabled", "Bulk Broadcasts: Enabled", "AI Smart Reply: Enabled").
  - Displays quota meters (Messages used vs limit, Contacts vs limit).
- **Payment & Transaction History Table**:
  - Displays complete historical record of payments: Date & Time, Description (e.g. `Plan: GROWTH (Monthly)`), Amount in INR (`₹`), Razorpay Reference ID (`pay_XXXX`), and Status (`Success`).

### B. On Admin Control Panel (`/admin`)
- **Customer Payments Audit Table**:
  - Full visibility into every payment made by any user on the platform.
  - Customer Name & Email (e.g. `KISAN CHOICE - ecokisanchoice@gmail.com`).
  - Account Name.
  - Description & Plan Purchased.
  - Exact Amount Paid in Rupees.
  - Razorpay Payment Reference ID.
  - Real-time timestamps and payment status (`Success (Paid)`).

---

## 5. Core Features & Working Details

### 1. Dual WhatsApp Connectivity Engine
- **Meta Official Cloud API (WABA)**: Direct integration with Meta Graph API (v19.0+). Handles business-initiated broadcast messages using Meta-approved templates. Webhook processing with HMAC-SHA256 signature verification.
- **Coexistence QR Engine (Baileys)**: Multi-device pairing via QR code scanner. Allows businesses to use their existing WhatsApp phone application simultaneously with the web CRM without losing mobile access.

### 2. Live Shared Team Inbox (`/inbox`)
- Real-time chat sync with multi-agent assignments, tag filtering, templates, quick replies, and unread badges.

### 3. Broadcasts & Campaign Manager (`/broadcasts`)
- Send WhatsApp bulk messages to hundreds or thousands of contacts. Meta template variable replacements, contact audience targeting, anti-ban pacing delays, and live delivery status tracking (Sent, Delivered, Read, Failed).

### 4. Visual Automation Builder (`/automations`, `/flows`)
- Visual node-based workflow canvas. Triggers: keyword matches, new contact, incoming message. Actions: message dispatch, agent routing, condition branches, and delay timers.

### 5. AI Chatbot & Smart Auto-Reply (`/settings?tab=ai`)
- Bring-Your-Own-Key (BYOK) architecture for OpenAI and Anthropic. Configurable system persona, prompt instructions, and contextual automated replies.

### 6. CRM Contacts & Pipelines (`/contacts`, `/pipelines`)
- Contact profiles, custom fields, tags, CSV import/export. Kanban sales deal pipeline with configurable stages, drag-and-drop movement, and deal values.

### 7. Razorpay Payments & Subscriptions (`/billing`)
- Direct integration with Razorpay checkout. Webhook verification, automatic wallet credits, subscription renewal, and invoice generation.

---

## 6. Layout & Navigation Structure

```
ChatFlyr CRM
├── Header (Top Navigation)
│   ├── Trial Countdown Banner (Top Red UI - 5 Days live countdown or Expired block)
│   ├── Global Command Search (Ctrl+K)
│   ├── Language Locale Selector (EN / HI)
│   ├── Dark / Light Mode Switcher
│   └── User Avatar & Quick Menu
│
├── Sidebar Navigation
│   ├── Brand Logo ("ChatFlyr")
│   ├── Quick Action Bar:
│   │   ├── Primary Button: "+ New Campaign" (Emerald Green)
│   │   ├── Pill: "Cloud API" (Meta configuration link)
│   │   └── Pill: "QR Scan" (Baileys Coexistence QR link)
│   ├── Main Navigation Links:
│   │   ├── Dashboard (/dashboard)
│   │   ├── Chats (/dashboard/chats)
│   │   ├── Coexistence (/dashboard/coexistence)
│   │   ├── Inbox (/inbox)
│   │   ├── Notifications (/notifications)
│   │   ├── Contacts (/contacts)
│   │   ├── Pipelines (/pipelines)
│   │   ├── Bulk Messages (/broadcasts)
│   │   ├── Automations (/automations)
│   │   ├── Flows [Beta] (/flows)
│   │   ├── Keyword Flow (/keyword-flows)
│   │   ├── Billing & Plans (/billing)
│   │   └── AI Agents (/agents)
│   ├── Bottom Utility Links:
│   │   ├── Settings (/settings)
│   │   ├── Admin (Exclusive to Platform Super Admins only)
│   │   └── Profile (/profile)
│   └── User Footer (Avatar, User Name, Email & Role Chip)
```

---

## 7. Firebase Migration & Database Protection (Zero Data Loss)

### A. Firebase Primary Architecture
- **Firebase Project ID**: `whatsapp-saas-7ab44`
- **Auth Domain**: `whatsapp-saas-7ab44.firebaseapp.com`
- **Storage Bucket**: `whatsapp-saas-7ab44.firebasestorage.app`
- **App ID**: `1:636788413828:web:485159899275395362b9d1`
- **Measurement ID**: `G-C9RF03BW2H`
- **Client SDK**: Configured via `src/lib/firebase/client.ts`
- **Admin SDK**: Configured via `src/lib/firebase/admin.ts` for privileged backend operations

### B. 100% Zero-Loss Database Audit & Backup
All live data from Supabase was thoroughly audited and exported into structured JSON collections (`supabase_backup/`):
- `contacts.json`: 1,988 records
- `broadcast_recipients.json`: 3,452 records
- `messages.json`: 216 records
- `conversations.json`: 66 records
- `broadcasts.json`: 45 records
- `ai_usage_log.json`: 31 records
- `pipeline_stages.json`: 15 records
- `contact_tags.json`: 10 records
- `flow_nodes.json`: 7 records
- `accounts.json`: 4 records
- `profiles.json`: 4 records
- `message_templates.json`: 4 records
- `pipelines.json`: 3 records
- `keyword_flows.json`: 2 records
- `tags.json`: 2 records
- `automations.json`: 1 record
- `automation_steps.json`: 1 record
- `deals.json`: 1 record
- `flows.json`: 1 record
- `quick_replies.json`: 1 record
- `whatsapp_config.json`: 1 record
- `contact_notes.json`: 1 record
- `ai_configs.json`: 1 record
- **Grand Total Data Preserved**: **5,857 records**

### C. Security & Credentials
- All Firebase client and admin configurations are stored securely in `.env.local`.
- Supabase credentials remain preserved as an inactive fallback to guarantee business continuity.
- Tokens and secrets continue to use AES-256-GCM encryption with `ENCRYPTION_KEY`.
