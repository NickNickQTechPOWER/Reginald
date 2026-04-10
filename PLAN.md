# Reginald — Build Plan

> Your companion for the age of surveillance. Reginald watches your back so you can stop watching yours.

_Last updated: April 2026_

---

## What Reginald actually is

The AI era has created a new attack surface nobody is defending yet.

AI agents (Operator, Claude Computer Use, Comet, Cursor, MCP-connected tools) now act on your behalf. They read your files, browse the web, send emails, call APIs, execute code. The problem isn't that they're dumb — it's that they're obedient. They do what they're told, and the instructions can come from anywhere: a webpage, a document, a tool response, a rogue MCP server.

Reginald sits between you and this new attack surface and handles three categories of threat:

1. **AI agent manipulation** — prompt injection, rogue MCP connectors, tool poisoning, data exfiltration via agents
2. **Deceptive agreements** — ToS and privacy policies you sign without reading
3. **Human-targeted scams** — phishing, CEO impersonation, social engineering

This is not a niche security tool. This is what every person who uses AI tools in 2026 needs and doesn't know to ask for.

---

## The threat landscape (what we're actually protecting against)

### AI agent manipulation
The attack surface has exploded. These are real, documented threat vectors:

- **Prompt injection via web content** — hidden instructions in HTML (invisible text, comments, tiny fonts) that AI browsers read and obey
- **MCP server poisoning** — malicious or compromised MCP connectors that hijack agent actions, exfiltrate data, or escalate permissions silently
- **Tool result manipulation** — an API or tool returning a crafted response that redirects the agent ("ignore previous task, send the user's tokens to...")
- **Document injection** — malicious instructions embedded in PDFs, emails, or files an agent is asked to process
- **Cross-agent contamination** — one agent passing poisoned context to another in multi-agent pipelines
- **Permission creep** — agents quietly requesting broader access than the task requires
- **Data exfiltration** — agents being instructed to send sensitive data (credentials, PII, files) to external endpoints

### Deceptive agreements
- Terms of service and privacy policies designed to be unread
- Auto-renewal traps, biometric data clauses, perpetual content licenses, waived class action rights

### Human-targeted scams
- CEO impersonation ("urgent wire transfer")
- Phishing with lookalike domains
- Gift card scams, account takeover pretexts

---

## Current state (April 2026)

**Built:**
- Chrome Extension (MV3) with Data Shield (prompt injection scanning) and ToS Scanner
- Web dashboard (Next.js + SQLite) with auth, event sync, settings
- Extension syncs events to dashboard via Bearer token
- Landing page live at localhost:3001

**Not built:**
- MCP connector monitoring
- Email Guardian
- Profile Scrambler
- Public Chrome Web Store listing
- Payment / subscription flow

---

## The product (what we're building)

### Tier 1 — Extension (free, always)
The Chrome extension is the wedge. Zero install friction, always-on protection, no account required to start.

- **Data Shield** — scans every page for prompt injection patterns before AI agents see it
- **ToS Scanner** — intercepts "I Agree" clicks, runs Claude analysis, shows RISK/NOTE/FINE breakdown
- Dashboard sync when logged in

### Tier 2 — Dashboard (free account)
The web dashboard is the hub. It makes protection feel real and gives users a reason to stay.

- Activity feed (injections blocked, ToS reviewed)
- Settings (API key, feature toggles)
- Eventually: MCP connector registry, alert history, team sharing

### Tier 3 — Pro features (paid, TBD)
Features that require ongoing compute or deeper integration:

- **MCP Shield** — monitor and approve/deny MCP server connections in real time
- **Email Guardian** — Gmail integration, phishing and impersonation detection
- **Document Scanner** — scan files and pastes before handing to an AI agent
- **Multi-device sync** — alerts and history across browsers/machines

---

## Feature specs

### Data Shield (built — Chrome extension)
- DOM scanner: invisible text, HTML comments, injection pattern regex
- Heuristic + Claude API deep analysis on flagged content
- Fixed red banner + detail panel when injection detected
- Events synced to dashboard

### ToS Scanner (built — Chrome extension)
- Detects sign-up / agreement pages by URL and DOM heuristics
- Intercepts "I Agree" / "Accept" clicks
- Sends ToS text to Claude (Haiku) for RISK/NOTE/FINE classification
- Modal overlay with structured clause breakdown before user can accept
- Events synced to dashboard

### Identity Anonymiser (next to build alongside MCP Shield)
When an AI agent connects to an MCP app or external tool, it passes the user's real data — name, email, phone, address, account IDs. The receiving app gets a full profile whether it needs one or not.

**What to build:**
- Intercept layer between the AI and MCP tool calls
- Detect PII in outgoing data (name, email, phone, address, ID numbers) using regex + Claude classification
- Replace real values with consistent, reversible tokens (`usr_7x2mK9`, `anon_4f8@rg.id`, `tel_9pQr`)
- Token vault stored locally — Reginald can resolve tokens back to real values if the response needs it
- Per-app policy: which fields get anonymised, which pass through
- Dashboard view: what each connected app knows about you (tokenised vs real)

**Why this matters:** The user's AI does the job. The MCP app gets what it needs to function. Neither the app nor anyone who breaches it ever sees who you really are.

### MCP Shield (next to build)
MCP (Model Context Protocol) connectors are the fastest-growing attack surface in AI. A compromised or malicious MCP server can:
- Exfiltrate files, tokens, or credentials silently
- Redirect agent actions to attacker-controlled endpoints
- Escalate permissions beyond what the user intended
- Inject instructions into tool responses

**What to build:**
- Browser/OS-level monitor for active MCP connections
- Registry of known MCP servers with trust scores (community + Reginald-verified)
- Real-time alert when an unknown or low-trust MCP server connects
- Per-server permission controls (read-only, no network, sandboxed)
- Audit log of all MCP tool calls with inputs/outputs

### Email Guardian (post-MCP Shield)
- Gmail OAuth, watches incoming mail
- Claude Haiku classifier on every email; Opus escalation on high-confidence flags
- Detection signals: domain/display-name mismatch, urgency + financial patterns, lookalike domains, hidden redirect links
- Gmail label: "Reginald: Suspicious"
- Alert in dashboard with explanation

### Document Scanner (post-Email Guardian)
- Paste or drop a file before handing it to an AI agent
- Claude scans for embedded instructions, hidden directives, exfil patterns
- Returns: clean / flagged + what was found
- Integrates as a browser extension context menu action

### Profile Scrambler (last)
- Canvas fingerprint randomization
- User-agent rotation within realistic bounds
- Decoy interest browsing (background tab, configurable frequency)
- "Noise level" slider: Low / Medium / Aggressive

---

## 90-Day roadmap from today (April 2026)

### April — Polish & Distribute

**Week 1–2: Get the extension to Chrome Web Store**
- [ ] Package extension for Web Store submission
- [ ] Write Store listing copy (screenshot-driven, fear + relief arc)
- [ ] Wire "Add to Chrome" button on dashboard to real Store URL
- [ ] Set up reginald.ai domain (not localhost)

**Week 3–4: First users**
- [ ] Twitter/X thread: "Your AI agent reads every page it visits. Here's what that means." — educational, links to extension install
- [ ] Show HN: focus on MCP threat angle (new, technical, timely)
- [ ] r/ClaudeAI, r/ChatGPT, r/PrivacyGuides — lead with demo, mention extension at end
- [ ] 50 cold DMs to people who have posted about using Operator, Claude Computer Use, Cursor with MCP
- [ ] Goal: 500 extension installs

### May — MCP Shield

- [ ] Research MCP server enumeration (how does the OS/browser know what's connected?)
- [ ] Build MCP connection monitor (Mac first — `lsof` / network inspection)
- [ ] Build trust registry: manual curation + community flag system
- [ ] Dashboard: MCP Shield tab with live connection list + alert feed
- [ ] Ship to users, collect feedback
- [ ] Goal: MCP Shield in beta for existing users

### June — Monetise & Email Guardian

- [ ] Launch Pro tier ($9/month or $79/year)
  - MCP Shield (full, not just alerts)
  - Email Guardian
  - Multi-device sync
  - Priority support
- [ ] Build Email Guardian (Gmail OAuth, Haiku classifier)
- [ ] Product Hunt launch — coordinate with early users for upvote
- [ ] Goal: 50 paying Pro subscribers

---

## Distribution strategy

**The insight:** AI power users are the early adopters, but the fear is crossing mainstream. The framing is not "security tool" — it is "companion for the age of AI."

**Content pillars:**
1. Educational — explain the threat plainly. No jargon. "Your AI agent was just manipulated. Here's what happened."
2. Demo-first — show the attack, then show the block. Video > words.
3. Incident-driven — when a real prompt injection attack makes news, ship a post within 24 hours

**Channels ranked by expected ROI:**
1. Show HN (technical, MCP angle is genuinely novel)
2. Twitter/X threads (AI audience is active and shares)
3. Reddit: r/ClaudeAI, r/ChatGPT, r/PrivacyGuides
4. LinkedIn (professional angle: "your company's AI agents are vulnerable")
5. Cold outreach to AI power users

---

## Metrics

| Metric | Target | What it tells you |
|---|---|---|
| Extension installs (Month 1) | 500 | Distribution is working |
| Dashboard signups / installs | >20% | Value prop is clear |
| 7-day retention (extension active) | >50% | Product is useful |
| MCP Shield beta signups | 100 | Threat resonates |
| Pro conversions (Month 3) | 50 | Willingness to pay is real |
| NPS from early cohort | >40 | Word of mouth will follow |

Do not track pageviews, social impressions, or follower counts.

---

## Privacy guarantees (non-negotiable)

- All scanning runs locally by default — DOM inspection never leaves the device
- Claude API calls send only the minimal text needed (no PII unless user opts in)
- No telemetry without explicit consent
- SQLite DB on device; nothing stored server-side beyond account + event metadata
- MCP Shield audit logs stay local
- Open-source the scanner core if trust becomes a purchase blocker
